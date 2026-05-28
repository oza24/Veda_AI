"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQuestionPaper = exports.extractIntentFromPrompt = exports.normalizeQuestionType = exports.RateLimitError = void 0;
const groq_1 = require("../config/groq");
const logger_1 = require("../utils/logger");
class RateLimitError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
// Helper sleep function for retry logic
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const TYPE_MAP = {
    mcq: "multiple_choice",
    multiplechoice: "multiple_choice",
    multiple_choice: "multiple_choice",
    short: "short_answer",
    shortanswer: "short_answer",
    short_answer: "short_answer",
    sshort_answer: "short_answer",
    shorttype: "short_answer",
    long: "long_answer",
    longanswer: "long_answer",
    long_answer: "long_answer",
    essay: "long_answer",
    diagram: "diagram",
    true_false: "true_false",
    truefalse: "true_false"
};
/**
 * Normalise any user-facing question type label to internal AI type key.
 */
const normalizeQuestionType = (raw) => {
    if (!raw)
        return 'short_answer';
    const v = raw.toLowerCase().trim().replace(/[_\-\s]+/g, '');
    for (const [key, val] of Object.entries(TYPE_MAP)) {
        if (v.includes(key))
            return val;
    }
    return TYPE_MAP[v] || 'short_answer';
};
exports.normalizeQuestionType = normalizeQuestionType;
/**
 * Extract structured constraints from a free-text user prompt using an LLM Intent Parser.
 * Handles multilingual prompts (Hindi, Hinglish, English) and normalizes types/subjects.
 */
const extractIntentFromPrompt = async (prompt, fallbackSubject) => {
    if (!prompt || prompt.trim() === '') {
        return { sections: [], totalMarks: null, duration: null, topic: fallbackSubject };
    }
    const systemInstructions = `
You are an expert NLP parser for an educational platform.
Your task is to parse the user's natural language request (which may be in English, Hindi, or Hinglish) and extract the EXACT exam constraints into a structured JSON format.

RULES:
1. Normalize the subject. For example, "maths" or "math" -> "Mathematics", "bio" -> "Biology", "chem" -> "Chemistry".
2. Normalize question types EXACTLY to one of these: "multiple_choice", "short_answer", "long_answer", "true_false", "diagram". For example, "mcq" -> "multiple_choice", "short type" -> "short_answer".
3. Extract the exact number of questions (count) and marks per question for each section mentioned.

Return ONLY a valid JSON object matching this schema:
{
  "subject": "Normalized subject name (or null if none detected)",
  "language": "Detected language (e.g., Hindi-English, English, etc.)",
  "sections": [
    {
      "type": "multiple_choice | short_answer | long_answer | true_false | diagram",
      "count": 5,
      "marks": 1
    }
  ],
  "totalMarks": null,
  "duration": null
}
`;
    try {
        const response = await groq_1.groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemInstructions },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0,
            max_tokens: 1024,
        });
        const responseText = response.choices[0]?.message?.content;
        if (!responseText)
            throw new Error("Empty response from Groq intent parser");
        const cleanedText = extractJsonSafely(responseText);
        const parsed = JSON.parse(cleanedText);
        const sections = (parsed.sections || []).map((s) => ({
            type: (0, exports.normalizeQuestionType)(s.type),
            count: Number(s.count) || 5,
            marks: Number(s.marksPerQuestion || s.marks) || 2
        }));
        logger_1.logger.info(`🧠 Intent Parser Results: Subject: ${parsed.subject}, Sections: ${JSON.stringify(sections)}`);
        return {
            sections,
            totalMarks: parsed.totalMarks || null,
            duration: parsed.duration || null,
            topic: parsed.subject || fallbackSubject
        };
    }
    catch (error) {
        logger_1.logger.warn(`⚠️ Intent parser failed, returning empty sections: ${error}`);
        return { sections: [], totalMarks: null, duration: null, topic: fallbackSubject };
    }
};
exports.extractIntentFromPrompt = extractIntentFromPrompt;
/**
 * Robust JSON extraction fallback utility. Strips markdown fences, leading/trailing conversational text,
 * and extracts the core JSON object securely using regex when needed.
 */
const extractJsonSafely = (text) => {
    if (!text)
        return '';
    let cleaned = text.trim();
    // 1. Remove markdown block quotes
    cleaned = cleaned.replace(/```json/gi, '');
    cleaned = cleaned.replace(/```/gi, '');
    cleaned = cleaned.trim();
    // 2. Extract content between first '{' and last '}'
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
    // 3. Robustly handle unescaped raw newlines inside JSON string properties
    cleaned = cleaned.replace(/:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g, (_, p1) => {
        const escaped = p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        return `: "${escaped}"`;
    });
    // 4. Remove illegal trailing commas inside arrays/objects
    cleaned = cleaned.replace(/,(\s*[\]}])/g, '$1');
    return cleaned;
};
/**
 * Execute Groq completions with robust exponential backoff to handle rate limits (429) or transient errors
 */
const executeWithRetry = async (apiCall, maxRetries = 2) => {
    let attempt = 0;
    while (true) {
        try {
            return await apiCall();
        }
        catch (error) {
            attempt++;
            const statusCode = error.status || error.statusCode;
            if (statusCode === 429 || error.message?.includes('429') || error.message?.includes('rate limit')) {
                logger_1.logger.error(`💥 Groq API Rate Limit Exceeded. Quota exhausted.`);
                throw new RateLimitError('Daily AI quota exhausted. Please retry later.');
            }
            const isTransient = statusCode === 503 || statusCode >= 500;
            if (attempt > maxRetries || !isTransient) {
                logger_1.logger.error(`💥 Groq API request failed after ${attempt - 1} retries. Error: ${error.message}`);
                throw error;
            }
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
            logger_1.logger.warn(`⚠️ Groq API Rate Limit or Transient error. Retrying attempt #${attempt} in ${delay.toFixed(0)}ms...`);
            await sleep(delay);
        }
    }
};
/**
 * Build a human-readable label for a question type.
 */
const typeLabel = (t) => ({
    multiple_choice: 'Multiple Choice (MCQ)',
    short_answer: 'Short Answer',
    long_answer: 'Long Answer / Essay',
    true_false: 'True / False',
}[t] ?? t);
/**
 * Generate a highly structured exam question paper using Groq API and llama3-70b-8192.
 * Supports two input modes:
 *   Mode A – structured questionRows (from the form UI)
 *   Mode B – free-text prompt only (prompt-only / voice mode)
 * In Mode B, constraints are extracted from the prompt automatically.
 */
const generateQuestionPaper = async (subject, difficulty, prompt, gradeLevel = 'Grade 10', extractedText, questionRows) => {
    logger_1.logger.info(`✨ Groq Service: Request started for Subject: "${subject}", Difficulty: "${difficulty}", Grade: "${gradeLevel}"`);
    logger_1.logger.info(`📋 Raw prompt received: "${prompt}"`);
    logger_1.logger.info(`📦 questionRows received: ${JSON.stringify(questionRows)}`);
    // ── Step 1: Build the effective constraint rows ──────────────────────────
    // Priority: explicit questionRows > parsed from prompt > bare minimum defaults
    let effectiveRows = [];
    const parsed = await (0, exports.extractIntentFromPrompt)(prompt, subject);
    // Override subject if a specific one was strongly detected in the prompt
    if (parsed.topic && parsed.topic !== subject && parsed.topic.toLowerCase() !== 'null') {
        logger_1.logger.info(`🧠 Overriding base subject '${subject}' with Intent Parsed Subject: '${parsed.topic}'`);
        subject = parsed.topic;
    }
    if (questionRows && questionRows.length > 0) {
        // Mode A — structured rows supplied by UI
        effectiveRows = questionRows.map((row) => ({
            type: (0, exports.normalizeQuestionType)(row.type),
            numQuestions: Number(row.numQuestions) || 10, // safe fallback
            marks: Number(row.marks) || 2,
        }));
        // CRITICAL FIX: The frontend always sends the default UI row (e.g. 5 questions) even in prompt-only mode.
        // If there is only 1 row, we MUST overlay any constraints explicitly extracted from the user's prompt
        // to ensure text prompts aren't overridden by silent UI defaults.
        if (effectiveRows.length === 1 && parsed.sections && parsed.sections.length > 0) {
            effectiveRows = parsed.sections.map(sec => ({
                type: (0, exports.normalizeQuestionType)(sec.type),
                numQuestions: sec.count,
                marks: sec.marks || 2
            }));
            logger_1.logger.info(`📐 Mode A (Single Row) overridden by Prompt constraints: ${JSON.stringify(effectiveRows)}`);
        }
        else {
            logger_1.logger.info(`📐 Using Mode A — structured questionRows (${effectiveRows.length} section(s))`);
            logger_1.logger.info(`📐 Mode A effective constraints: ${JSON.stringify(effectiveRows)}`);
        }
    }
    else {
        // Mode B — parse constraints from free-text prompt
        if (parsed.sections && parsed.sections.length > 0) {
            effectiveRows = parsed.sections.map(sec => ({
                type: (0, exports.normalizeQuestionType)(sec.type),
                numQuestions: sec.count,
                marks: sec.marks || 2
            }));
        }
        else {
            logger_1.logger.warn(`⚠️ Prompt parser could NOT extract sections from: "${prompt}". Defaulting to short_answer.`);
            effectiveRows = [{
                    type: 'short_answer',
                    numQuestions: 10,
                    marks: 2,
                }];
        }
        logger_1.logger.info(`🎙️ Using Mode B — prompt-only. Effective constraints: ${JSON.stringify(effectiveRows)}`);
    }
    // Safe Fallbacks
    effectiveRows = effectiveRows.map(row => ({
        type: row.type,
        numQuestions: (!row.numQuestions || row.numQuestions < 1) ? 5 : row.numQuestions,
        marks: (!row.marks || row.marks < 1) ? 2 : row.marks
    }));
    // Debug Logging
    logger_1.logger.info(`🔍 Parsed Subject: ${subject}`);
    logger_1.logger.info(`🔍 Parsed Sections: ${JSON.stringify(effectiveRows)}`);
    logger_1.logger.info(`🔍 Normalized Types: ${effectiveRows.map(r => r.type).join(', ')}`);
    logger_1.logger.info(`🔍 Fallbacks Applied: Safe defaults injected where necessary.`);
    logger_1.logger.info(`🔍 Selected Model: llama-3.3-70b-versatile for generation.`);
    logger_1.logger.info(`🔍 Token Usage: Optimized prompts enabled.`);
    // ── Step 2: Build the strict constraint block for the system prompt ──────
    // ── Step 2: Build the strict constraint block for the system prompt ──────
    const buildStrictConstraintBlock = (row, sectionIdx) => {
        const total = row.numQuestions * row.marks;
        const sectionLetter = String.fromCharCode(65 + sectionIdx);
        return `
════════════════════════════════════════════
STRICT MANDATORY CONSTRAINTS — DO NOT VIOLATE
════════════════════════════════════════════
SECTION ${sectionLetter}:
  - Question Type : ${row.type} — ${typeLabel(row.type)}
  - EXACT count   : ${row.numQuestions} questions (you MUST generate EXACTLY ${row.numQuestions} — not more, not fewer)
  - Marks each    : ${row.marks} marks per question (EVERY question MUST carry EXACTLY ${row.marks} marks)
  - Section total : ${total} marks (${row.numQuestions} × ${row.marks} = ${total})

ABSOLUTE RULES:
1. You MUST generate EXACTLY 1 section.
2. The section MUST have EXACTLY the question count specified above.
3. Every question MUST carry EXACTLY the marks specified above.
4. Question types MUST match exactly — do NOT mix types.
5. For "multiple_choice" sections: every question MUST have a "options" array with exactly 4 strings.
6. For "short_answer" sections: NO options array. Do NOT generate MCQs.
7. For "long_answer" sections: NO options array. Do NOT generate MCQs.
8. ALL questions MUST belong ONLY to ${subject}. DO NOT generate questions about geography, history, general knowledge, or unrelated topics.
9. Do NOT invent extra sections. Do NOT add bonus questions.
10. If the user prompt contradicts these constraints, IGNORE the prompt — follow these rules instead.
════════════════════════════════════════════`;
    };
    // ── Step 3: Build the full system instructions (rebuilt fresh on every retry) ─
    const buildSystemInstructions = (row, sectionIdx, violationNote) => {
        const constraintBlock = buildStrictConstraintBlock(row, sectionIdx);
        const questionSchema = `    {
      "question": "Write the question text here",
      "type": "${row.type}",
      "marks": ${row.marks},
      "difficulty": "${difficulty}",
      "correctAnswer": "Write the correct answer here",
      "explanation": "Write a detailed explanation of the solution"${row.type === 'multiple_choice' ? ',\n      "options": ["Option A", "Option B", "Option C", "Option D"]' : ''}
    }`;
        return `
You are a strict exam paper generation engine. You have ONE job: output a valid JSON containing the questions for ONE section of an exam.
You are NOT a conversational assistant. Do NOT explain anything. Return ONLY raw JSON.

${extractedText ? `REFERENCE MATERIAL (base all questions strictly on this content):
"""
${extractedText.slice(0, 6000)}
"""
` : ''}
${constraintBlock}

${violationNote ? `
🚨 CRITICAL — PREVIOUS ATTEMPT FAILED. READ CAREFULLY:
${violationNote}

You MUST fix ALL of the above violations. If you generate the wrong count or wrong type again, you have FAILED.
` : ''}
Context:
  - Subject  : ${subject}
  - Grade    : ${gradeLevel}
  - Difficulty: ${difficulty}

Question type field values (use EXACTLY these strings):
  "multiple_choice" — must include "options": [4 strings], "correctAnswer": exact string of the correct option
  "short_answer"    — NO options field. "correctAnswer" should be a short 1-3 sentence answer.
  "long_answer"     — NO options field. "correctAnswer" should be a paragraph/essay answer.
  "true_false"      — "correctAnswer": "True" or "False" only.

For ALL types, you MUST include a "correctAnswer" and an "explanation" string field.

JSON schema to follow (return EXACTLY this structure):
{
  "questions": [
${questionSchema}
  ]
}

CRITICAL REMINDERS:
- Return ONLY raw JSON. No markdown. No backticks. No text before or after the JSON.
- Do NOT wrap questions in a "sections" array. Return the "questions" array at the root.
- The "questions" array length MUST exactly match the count mandated.
- Every question "type" and "marks" MUST exactly match what is asked for this section.`;
    };
    // ── Step 4: Validator ────────────────────────────────────────────────────
    const validateSectionResponse = (parsedData, row) => {
        const violations = [];
        if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
            return { isValid: false, reason: "Missing required 'questions' array.", violations: ["No questions array"] };
        }
        // Count check
        const genCount = parsedData.questions.length;
        if (genCount !== row.numQuestions) {
            violations.push(`Question count: expected EXACTLY ${row.numQuestions}, got ${genCount}`);
        }
        for (let qIdx = 0; qIdx < parsedData.questions.length; qIdx++) {
            const q = parsedData.questions[qIdx];
            if (!q) {
                violations.push(`Q${qIdx + 1} is null`);
                continue;
            }
            // Marks check per question
            const qMarks = Number(q.marks);
            if (qMarks !== row.marks) {
                violations.push(`Q${qIdx + 1} marks: expected ${row.marks}, got ${qMarks}`);
            }
            // Type check
            const normalizedActual = (0, exports.normalizeQuestionType)(q.type);
            const normalizedExpected = (0, exports.normalizeQuestionType)(row.type);
            if (normalizedActual !== normalizedExpected) {
                violations.push(`Q${qIdx + 1} type: expected "${normalizedExpected}", got "${q.type ?? 'undefined'}"`);
            }
            // Options check for MCQ
            if (normalizedExpected === 'multiple_choice') {
                if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                    violations.push(`Q${qIdx + 1} is multiple_choice but missing valid options array`);
                }
            }
            if (!q.correctAnswer || q.correctAnswer.trim() === '') {
                violations.push(`Q${qIdx + 1} is missing a correctAnswer`);
            }
        }
        if (violations.length > 0) {
            logger_1.logger.warn(`❌ Validation violations found:`);
            violations.forEach((v) => logger_1.logger.warn(`   • ${v}`));
            return { isValid: false, reason: violations.join(' | '), violations };
        }
        return { isValid: true, violations: [] };
    };
    // ── Step 4.5: Subject Relevance Classifier ───────────────────────────────
    const validateSubjectRelevance = async (questions, targetSubject) => {
        try {
            const questionsText = questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n');
            const prompt = `
You are an expert academic classifier.
Your job is to determine if ALL the following questions strictly belong to the academic subject: "${targetSubject}".
If ANY question belongs to a different subject (e.g., geography, history, general knowledge, etc.) when it shouldn't, return isValid: false and explain the reason.

Questions:
${questionsText}

Return ONLY valid JSON in this exact format:
{
  "isValid": true/false,
  "reason": "Explain which questions are out of scope and why, if any. Leave empty if true."
}
`;
            const response = await groq_1.groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0,
                max_tokens: 1024,
            });
            const responseText = response.choices[0]?.message?.content;
            if (!responseText)
                return { isValid: true }; // Fallback to true if classifier fails to respond
            const parsed = JSON.parse(extractJsonSafely(responseText));
            return {
                isValid: Boolean(parsed.isValid),
                reason: parsed.reason
            };
        }
        catch (error) {
            logger_1.logger.warn(`Subject classifier failed, falling back to true: ${error}`);
            return { isValid: true };
        }
    };
    // ── Step 5: Generation loop per section with retry ───────────────────────────────────
    const finalSections = [];
    const maxSemanticRetries = 1; // Reduced from 4 to 1 to prevent token explosions
    for (let idx = 0; idx < effectiveRows.length; idx++) {
        const row = effectiveRows[idx];
        if (!row)
            throw new Error('Constraint row is undefined');
        let retryCount = 0;
        let lastViolationNote;
        let sectionGenerated = false;
        logger_1.logger.info(`🔄 Groq Service: Starting generation for Section ${idx + 1}/${effectiveRows.length} (${row.type}, ${row.numQuestions} Qs)`);
        while (!sectionGenerated) {
            const systemInstructions = buildSystemInstructions(row, idx, lastViolationNote);
            const fetchCompletions = async () => {
                const response = await groq_1.groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemInstructions },
                        {
                            role: 'user',
                            content: [
                                `Generate Section ${String.fromCharCode(65 + idx)} questions for subject "${subject}" at difficulty "${difficulty}".`,
                                `MANDATORY: Generate EXACTLY ${row.numQuestions} questions total.`,
                                `Follow the exact breakdown of question types, marks, and counts as strictly defined in the system prompt.`,
                                `ALL questions MUST belong ONLY to ${subject}.`,
                                `Return ONLY valid JSON in the format { "questions": [...] } — no markdown, no explanation.`,
                            ].join(' '),
                        },
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.01, // near-zero = maximum determinism
                    max_tokens: 4096,
                });
                const responseText = response.choices[0]?.message?.content;
                logger_1.logger.info(`✨ Groq response [tokens: prompt=${response.usage?.prompt_tokens}, completion=${response.usage?.completion_tokens}]`);
                if (!responseText) {
                    throw new Error('Groq completions returned an empty payload content.');
                }
                const cleanedText = extractJsonSafely(responseText);
                const parsedData = JSON.parse(cleanedText);
                if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
                    throw new Error("Parsed JSON successfully but missing required 'questions' array structure.");
                }
                return parsedData;
            };
            try {
                logger_1.logger.info(`🔄 Section ${idx + 1} attempt #${retryCount + 1}/${maxSemanticRetries}`);
                const parsedData = await executeWithRetry(fetchCompletions);
                // ── Logging ──────────────────────────────────────────────────────────
                const genQuestions = parsedData.questions.length;
                const reqMarks = row.numQuestions * row.marks;
                const genMarks = parsedData.questions.reduce((qs, q) => qs + (Number(q.marks) || 0), 0);
                logger_1.logger.info(`📊 Validation check for Section ${idx + 1} (Attempt #${retryCount + 1}):`);
                logger_1.logger.info(`   Requested Question Count : ${row.numQuestions}`);
                logger_1.logger.info(`   Generated Question Count : ${genQuestions}`);
                logger_1.logger.info(`   Requested Total Marks    : ${reqMarks}`);
                logger_1.logger.info(`   Generated Total Marks    : ${genMarks}`);
                const types = parsedData.questions.map((q) => q.type).join(', ');
                logger_1.logger.info(`   Expected type : ${row.type}`);
                logger_1.logger.info(`   Generated types: ${types || '(none)'}`);
                const validation = validateSectionResponse(parsedData, row);
                // Subject Validation Step
                if (validation.isValid) {
                    logger_1.logger.info(`🧠 Running LLM Subject Classification against target: "${subject}"...`);
                    const subjectValidation = await validateSubjectRelevance(parsedData.questions, subject);
                    if (!subjectValidation.isValid) {
                        validation.isValid = false;
                        validation.violations.push(`Subject Relevance Failed: ${subjectValidation.reason}`);
                        logger_1.logger.warn(`❌ Subject Classification Failed: ${subjectValidation.reason}`);
                    }
                    else {
                        logger_1.logger.info(`✅ Subject Classification PASSED`);
                    }
                }
                logger_1.logger.info(`   Final Validation Result : ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}`);
                if (validation.isValid) {
                    const sectionLetter = String.fromCharCode(65 + idx);
                    const validSection = {
                        title: `Section ${sectionLetter} — ${typeLabel(row.type)}`,
                        instruction: `Answer all ${row.numQuestions} questions. Each question carries ${row.marks} marks.`,
                        type: row.type,
                        questions: parsedData.questions
                    };
                    logger_1.logger.info(`✅ Groq Service: Section ${idx + 1} generated and validated successfully.`);
                    finalSections.push(validSection);
                    sectionGenerated = true;
                    break; // break the retry loop
                }
                retryCount++;
                if (retryCount >= maxSemanticRetries) {
                    logger_1.logger.error(`💥 AI generation failed validation for Section ${idx + 1} after ${maxSemanticRetries} attempts. Last violations: ${validation.reason}`);
                    throw new Error(`AI generated section failed strict constraint validation after ${maxSemanticRetries} attempts. Violations: ${validation.reason}`);
                }
                // Build a targeted correction note for the next attempt
                lastViolationNote = [
                    `Attempt #${retryCount} violated the following constraints:`,
                    ...validation.violations.map((v) => `  • ${v}`),
                    ``,
                    `Correct ALL of the above in your next response. Follow the constraint rules exactly.`,
                ].join('\n');
                logger_1.logger.warn(`⚠️ Retrying Section ${idx + 1} with correction note (Attempt #${retryCount + 1}): ${lastViolationNote}`);
            }
            catch (err) {
                if (retryCount >= maxSemanticRetries)
                    throw err;
                retryCount++;
                logger_1.logger.warn(`⚠️ Generation error for Section ${idx + 1}: ${err.message}. Retrying (Attempt #${retryCount + 1})...`);
            }
        }
    }
    return { sections: finalSections };
};
exports.generateQuestionPaper = generateQuestionPaper;
