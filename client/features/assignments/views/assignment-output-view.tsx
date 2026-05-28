'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Printer,
  ArrowLeft,
  BookOpen,
  Clock,
  Award,
  AlertTriangle,
  Sparkles,
  BookMarked,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  text: string;
  type: 'multiple_choice' | 'short_answer' | 'long_answer' | 'true_false';
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  marks: number;
}

interface Section {
  title: string;
  instruction?: string;
  type: string;
  questions: Question[];
}

interface QuestionPaper {
  _id: string;
  title: string;
  subject: string;
  gradeLevel?: string;
  syllabus?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sections?: Section[];
  questions: Question[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  createdBy: string;
  dueDate?: string;
  status: 'draft' | 'published' | 'closed';
  maxMarks: number;
  generationStatus: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
}

export function AssignmentOutputView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  const SERVER_URL = 'http://localhost:3000';

  useEffect(() => {
    if (!id) {
      setError('Missing Assignment ID parameter.');
      setLoading(false);
      return;
    }

    const fetchPaperAndAssignment = async () => {
      try {
        console.log(`🔍 Output Page: Fetching Assignment & Question Paper for ID: "${id}"...`);
        setLoading(true);
        setError(null);

        // 1. Fetch Assignment Details
        console.log(`🔍 Output Page: Requesting GET ${SERVER_URL}/api/assignments/${id}`);
        const assignmentRes = await fetch(`${SERVER_URL}/api/assignments/${id}`);
        if (!assignmentRes.ok) {
          throw new Error('Failed to fetch assignment details.');
        }
        const assignmentData = await assignmentRes.json();
        console.log('🔍 Output Page: Assignment Details successfully retrieved:', assignmentData.data);
        setAssignment(assignmentData.data);

        // 2. Fetch Question Paper Details
        console.log(`🔍 Output Page: Requesting GET ${SERVER_URL}/api/assignments/${id}/paper`);
        const paperRes = await fetch(`${SERVER_URL}/api/assignments/${id}/paper`);
        if (!paperRes.ok) {
          const errData = await paperRes.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to fetch generated exam paper.');
        }
        const paperData = await paperRes.json();
        console.log('🔍 Output Page: Question Paper successfully retrieved:', paperData.data);
        setPaper(paperData.data);
      } catch (err: any) {
        console.error('💥 Output Page Query Blocked:', err);
        setError(err.message || 'An unexpected error occurred while loading the question paper.');
        toast.error(err.message || 'Error loading paper.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaperAndAssignment();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  // Group questions dynamically into logical Sections
  const getSectionedQuestions = (questions: Question[]) => {
    const sectionsMap: Record<string, { title: string; instruction: string; questions: Question[] }> = {};

    questions.forEach((q) => {
      const type = q.type || 'short_answer';
      if (!sectionsMap[type]) {
        let title = '';
        let instruction = '';
        switch (type) {
          case 'multiple_choice':
            title = 'Section A: Multiple Choice Questions';
            instruction = 'Choose the single best alternative from the options below. Circle or mark your response clearly.';
            break;
          case 'true_false':
            title = 'Section B: True or False';
            instruction = 'Determine whether the following statements are True or False. Mark your answer clearly.';
            break;
          case 'short_answer':
            title = 'Section C: Short Answer Questions';
            instruction = 'Provide brief, concise answers to the questions. Include key points and formulas where applicable.';
            break;
          case 'long_answer':
            title = 'Section D: Long Answer / Essay Questions';
            instruction = 'Answer in detail. Structure your responses with clear explanations, calculations, or step-by-step logic.';
            break;
          default:
            title = 'Section E: General Questions';
            instruction = 'Answer the following questions.';
        }
        sectionsMap[type] = { title, instruction, questions: [] };
      }
      sectionsMap[type].questions.push(q);
    });

    const displayOrder = ['multiple_choice', 'true_false', 'short_answer', 'long_answer'];
    return Object.keys(sectionsMap)
      .sort((a, b) => displayOrder.indexOf(a) - displayOrder.indexOf(b))
      .map((key) => sectionsMap[key]);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'hard':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50';
      case 'medium':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50';
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-6 rounded-[2rem] border border-neutral-100 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex justify-center"><Skeleton className="h-8 w-64" /></div>
          <div className="flex justify-center gap-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-32" /></div>
          <div className="h-[1px] w-full bg-neutral-200 dark:bg-neutral-800" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="mx-auto max-w-md p-4 py-16">
        <div className="bg-rose-50/20 border border-rose-100/50 rounded-3xl p-8 text-center space-y-4 dark:bg-neutral-900 dark:border-neutral-850">
          <div className="bg-rose-100 p-3 rounded-full inline-block text-rose-600 dark:bg-rose-950/30">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-rose-950 dark:text-rose-400">Error Loading Paper</h3>
          <p className="text-xs text-rose-800 bg-white border border-rose-200 p-3 rounded-xl break-words font-mono dark:bg-neutral-950 dark:border-neutral-800">
            {error || 'Question paper not generated yet or failed.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/assignments/create')}
              className="w-full bg-neutral-900 hover:bg-neutral-850 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <ArrowLeft className="h-4 w-4 inline mr-1" /> Back to Creator
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sections = paper.sections && paper.sections.length > 0 
    ? paper.sections 
    : getSectionedQuestions(paper.questions);
    
  const calculatedMaxMarks = sections.reduce(
    (sum, sec) => sum + sec.questions.reduce((qSum, q) => qSum + q.marks, 0),
    0
  );
  let questionCounter = 0;

  return (
    <>
      <div className="mx-auto max-w-4xl p-4 pb-24 md:p-8 md:pb-8 print:p-0 print:max-w-full print-container">

        {/* Actions bar (Hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 print:hidden">
          <button
            onClick={() => router.push('/assignments')}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to List
          </button>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] bg-indigo-50 border border-indigo-100/50 text-indigo-700 px-2.5 py-1 rounded-full font-bold dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50">
              <Sparkles className="h-3 w-3" /> AI GENERATED
            </span>
            <button
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-750"
            >
              {showAnswerKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showAnswerKey ? 'Hide Answer Key' : 'Show Answer Key'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:scale-[1.01] hover:bg-neutral-850 active:scale-[0.98] transition-all dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <Printer className="h-3.5 w-3.5" /> Print / Export to PDF
            </button>
          </div>
        </div>

        {/* Traditional Exam Layout Sheet */}
        <div className="pdf-print-wrapper">
          <div className="space-y-8 rounded-[2rem] border border-neutral-100 bg-white p-8 md:p-12 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 print:border-0 print:shadow-none print:p-0 print:rounded-none">

            {/* Header */}
            <div className="text-center space-y-4 pb-6 border-b-2 border-slate-900/10 dark:border-neutral-800">
              <div className="flex justify-center items-center gap-2 mb-1 print:hidden">
                <BookMarked className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Veda AI Academic System</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-neutral-100 uppercase">
                {paper.title}
              </h1>
              <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-slate-500 font-bold dark:text-neutral-450">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                  Subject: <strong className="text-slate-800 font-extrabold dark:text-neutral-350">{paper.subject}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Duration: <strong className="text-slate-800 font-extrabold dark:text-neutral-350">2 Hours</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-slate-400" />
                  Max Marks: <strong className="text-slate-800 font-extrabold dark:text-neutral-350">{calculatedMaxMarks}</strong>
                </span>
                <span className="flex items-center gap-1 print:hidden">
                  Difficulty:
                  <Badge variant="outline" className={`font-bold capitalize text-[10px] py-0.5 ml-1 ${getDifficultyColor(paper.difficulty)}`}>
                    {paper.difficulty}
                  </Badge>
                </span>
              </div>
            </div>

            {/* Student Info Table Grid Block */}
            <div className="exam-student-info border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50 dark:border-neutral-800 dark:bg-neutral-900/50 print:p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px] dark:text-neutral-450">Student Name:</span>
                  <div className="flex-1 border-b border-dotted border-slate-400 min-h-[16px] dark:border-neutral-700"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px] dark:text-neutral-450">Roll Number:</span>
                  <div className="flex-1 border-b border-dotted border-slate-400 min-h-[16px] dark:border-neutral-700"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px] dark:text-neutral-450">Date of Exam:</span>
                  <div className="flex-1 border-b border-dotted border-slate-400 min-h-[16px] dark:border-neutral-700"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px] dark:text-neutral-450">Grade / Class:</span>
                  <span className="font-extrabold text-slate-700 dark:text-neutral-350">{paper.gradeLevel || 'Grade 10'}</span>
                </div>
              </div>
            </div>

            {/* Standard Guidelines */}
            <div className="exam-guidelines text-[11px] text-slate-500 space-y-2 border border-slate-100 rounded-xl p-4 bg-slate-50/20 dark:border-neutral-800 dark:text-neutral-450 dark:bg-transparent print:p-3">
              <p className="font-extrabold text-slate-750 dark:text-neutral-300 uppercase tracking-wider">Candidate Guidelines:</p>
              <ul className="list-decimal pl-4 space-y-1">
                <li>Check that you have filled in Name, Roll Number, and Exam Date above.</li>
                <li>Read every question instruction carefully before preparing responses.</li>
                <li>Calculators or mobile phones are strictly barred from the examination center.</li>
                <li>Candidates are expected to preserve clean handwriting.</li>
              </ul>
            </div>

            {/* Sections List */}
            <div className="space-y-10">
              {sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-5 paper-wrapper">
                  <div className="exam-section-header bg-slate-900 text-white px-4 py-3 rounded-xl flex items-center justify-between gap-4 dark:bg-neutral-800 print:rounded-none">
                    <h3 className="font-bold text-sm tracking-wider uppercase">{section.title}</h3>
                    <span className="text-[10px] font-bold opacity-90">
                      {section.questions.length} Items | Total: {section.questions.reduce((sum, q) => sum + q.marks, 0)} M
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 italic px-1 dark:text-neutral-450">
                    {section.instruction}
                  </p>

                  <div className="space-y-6 pl-1">
                    {section.questions.map((question, qIdx) => {
                      questionCounter++;
                      return (
                        <div key={qIdx} className="space-y-2.5 print:break-inside-avoid question-section">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-2.5 text-slate-800 text-sm leading-relaxed dark:text-neutral-250">
                              <span className="font-extrabold text-slate-900 dark:text-neutral-100">{questionCounter}.</span>
                              <span className="font-semibold">{question.text}</span>
                            </div>
                            <span className="exam-marks-badge shrink-0 text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-lg dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50">
                              [{question.marks} M]
                            </span>
                          </div>

                          {/* Options */}
                          {question.type === 'multiple_choice' && question.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-6 pt-1">
                              {question.options.map((option, oIdx) => {
                                const optionLetter = String.fromCharCode(65 + oIdx);
                                return (
                                  <div
                                    key={oIdx}
                                    className="exam-option-item flex items-center gap-2 border border-slate-100 rounded-xl px-3 py-2 bg-slate-50/20 dark:border-neutral-850 dark:bg-neutral-900/50 print:rounded-none"
                                  >
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px] font-extrabold text-slate-500 bg-white dark:bg-neutral-800 dark:border-neutral-700">
                                      {optionLetter}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-neutral-350">{option}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* True / False line */}
                          {question.type === 'true_false' && (
                            <div className="pl-6 pt-1">
                              <span className="inline-block border border-solid border-slate-400 rounded-none px-4 py-1 font-extrabold text-[10px] uppercase text-slate-600 dark:border-neutral-800 dark:text-neutral-500 print:border-black print:text-black">
                                [ &nbsp; &nbsp; &nbsp; ] True / False
                              </span>
                            </div>
                          )}

                          {/* lines space in print */}
                          {(question.type === 'short_answer' || question.type === 'long_answer') && (
                            <div className="pl-6 pt-2 space-y-4 hidden print:block">
                              {Array.from({ length: question.type === 'short_answer' ? 3 : 7 }).map((_, l) => (
                                <div key={l} className="border-b border-solid border-black h-6" />
                              ))}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* End Blocks */}
            <div className="exam-footer mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-400 dark:border-neutral-800 dark:text-neutral-500">
              <div className="text-center md:text-left space-y-0.5">
                <p className="font-extrabold tracking-widest text-[9px] uppercase">BOARD AUTHORITY</p>
                <p className="font-bold text-slate-650 dark:text-neutral-400">Veda AI Academic System</p>
              </div>
              <div className="exam-id-pill font-mono text-[10px] border border-slate-100 bg-slate-50/50 rounded-lg px-2 py-0.5 dark:bg-neutral-850 dark:border-neutral-800">
                Exam ID: {paper._id}
              </div>
              <div className="text-center md:text-right space-y-1 min-w-[150px]">
                <div className="border-b border-dotted border-slate-400 h-8 dark:border-neutral-700" />
                <p className="font-bold uppercase tracking-wider text-[9px]">Sign of Examiner</p>
              </div>
            </div>

            <div className="text-center mt-8 text-slate-400 font-extrabold tracking-widests text-[9px] uppercase select-none dark:text-neutral-500">
              --- END OF QUESTION PAPER ---
            </div>

            {/* Answer Key Section */}
            {showAnswerKey && (
              <div className="mt-16 break-before-page print:mt-0 print:pt-16 pt-8 border-t-[3px] border-dashed border-slate-200 dark:border-neutral-800 print:border-t-0">
                <div className="text-center space-y-2 mb-10">
                  <h2 className="text-2xl font-black tracking-widest text-slate-900 dark:text-neutral-100 uppercase">
                    Answer Key
                  </h2>
                  <p className="text-xs text-slate-500 font-bold dark:text-neutral-450 uppercase tracking-widest">
                    For Evaluator / Teacher Reference Only
                  </p>
                </div>

                <div className="space-y-8">
                  {(() => {
                    let akCounter = 0;
                    return sections.map((section, sIdx) => (
                      <div key={`ak-sec-${sIdx}`} className="space-y-4">
                        <h3 className="font-bold text-xs tracking-widest uppercase text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/30 pb-2">
                          {section.title}
                        </h3>
                        <div className="space-y-4 pl-1">
                          {section.questions.map((question, qIdx) => {
                            akCounter++;
                            let displayAnswer = question.correctAnswer || "Answer not provided.";
                            
                            // Transform full string answers to "Option X" if they perfectly match an option
                            if (question.type === 'multiple_choice' && question.options && question.correctAnswer) {
                              const matchIdx = question.options.findIndex(opt => opt.trim() === question.correctAnswer?.trim());
                              if (matchIdx !== -1) {
                                displayAnswer = `Correct Option: ${String.fromCharCode(65 + matchIdx)}`;
                              } else if (question.correctAnswer.toLowerCase().startsWith('option ')) {
                                displayAnswer = `Correct ${question.correctAnswer}`;
                              }
                            }

                            return (
                              <div key={`ak-q-${qIdx}`} className="text-sm print:break-inside-avoid">
                                <div className="flex gap-3">
                                  <span className="font-extrabold text-slate-900 dark:text-neutral-100 shrink-0 w-8">
                                    {akCounter}.
                                  </span>
                                  <div className="text-slate-700 dark:text-neutral-300 w-full">
                                    <div>
                                      <span className="font-bold text-emerald-700 dark:text-emerald-400 mr-2">→</span>
                                      <span className="whitespace-pre-wrap leading-relaxed">{displayAnswer}</span>
                                    </div>
                                    {question.explanation && (
                                      <div className="mt-2.5 bg-slate-50 border border-slate-100 rounded-lg p-3 dark:bg-neutral-850 dark:border-neutral-800 print:border-slate-300 print:bg-transparent">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block dark:text-neutral-450 print:text-slate-600">Explanation:</span>
                                        <span className="text-xs whitespace-pre-wrap text-slate-600 dark:text-neutral-350 print:text-slate-800">{question.explanation}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
export default AssignmentOutputView;
