'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { QUESTION_TYPE_TO_AI_TYPE } from '@/features/assignments/constants/question-types';

import {
  AssignmentForm,
  FormFooter,
} from '@/features/assignments/components';
import { PageHeader } from '@/shared/components/page-header';
import { ROUTES } from '@/shared/constants/navigation';
import { Progress } from '@/components/ui/progress';
import {
  useAssignmentStore,
  useAssignmentFormStore,
  useSystemStore,
} from '@/shared/store';

type PipelineStep = 'idle' | 'uploading' | 'extracting' | 'generating' | 'completed' | 'failed';

export function CreateAssignmentView() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const { addAssignment } = useAssignmentStore();
  const {
    uploadedFile,
    dueDate,
    questionRows,
    additionalInfo,
    title,
    subject,
    difficulty,
    resetForm
  } = useAssignmentFormStore();
  const { isGenerating, setGenerating } = useSystemStore();

  // Real-time Pipeline Progress State
  const [step, setStep] = useState<PipelineStep>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusText, setStatusText] = useState('');

  // Read from NEXT_PUBLIC_SERVER_URL (set in .env.local) — fallback to :5000 (backend port)
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
  console.log('🌐 SERVER_URL:', SERVER_URL);

  const totalMarks = questionRows.reduce((sum, row) => sum + row.numQuestions * row.marks, 0);

  useEffect(() => {
    // Cleanup websocket connection on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleFailure = (msg: string) => {
    setStep('failed');
    setErrorMessage(msg);
    toast.error(msg);
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const handleReset = () => {
    setStep('idle');
    setGenerating(false);
    setUploadProgress(0);
    setExtractionProgress(0);
    setAiProgress(0);
    setErrorMessage('');
  };

  const handleCreate = async () => {
    console.log('🔔 Next button clicked');
    console.log('📋 Current form state:', {
      title,
      subject,
      difficulty,
      additionalInfo,
      uploadedFile: uploadedFile?.name ?? null,
      questionRows,
    });

    // ─── Validation: support TWO modes ────────────────────────────
    // MODE 1: PDF upload (title + subject required, file present)
    // MODE 2: Prompt-only (additionalInfo required; title/subject derived if empty)
    const hasFile = Boolean(uploadedFile);
    const hasPrompt = Boolean(additionalInfo.trim());

    if (!hasFile && !hasPrompt) {
      toast.error(
        'Please either upload a PDF or enter a prompt in the Additional Information field.',
      );
      return;
    }

    // Auto-derive title & subject from prompt when not filled in
    const effectiveTitle = title.trim() || (hasPrompt ? 'AI Generated Paper' : '');
    const effectiveSubject = subject.trim() || (hasPrompt ? 'General' : '');

    if (!effectiveTitle) {
      toast.error('Assignment Title is required.');
      return;
    }
    if (!effectiveSubject) {
      toast.error('Subject is required.');
      return;
    }

    if (hasFile) {
      console.log('📤 Mode: PDF Upload Pipeline');
    } else {
      console.log('🚀 Mode: Prompt-only AI Generation (no PDF)');
    }

    setGenerating(true);

    try {
      if (uploadedFile) {
        // FLOW A: PDF Upload pipeline
        console.log(`📤 Upload Pipeline: Initializing multipart upload for file: ${uploadedFile.name}`);
        setStep('uploading');
        setUploadProgress(10);
        setStatusText('Uploading reference materials to Veda server...');

        const mappedQuestionRows = questionRows.map((row) => ({
          ...row,
          type: QUESTION_TYPE_TO_AI_TYPE[row.type] || 'long_answer',
        }));
        console.log('📤 Upload Pipeline: questionRows being sent:', JSON.stringify(mappedQuestionRows));

        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('title', effectiveTitle);
        formData.append('subject', effectiveSubject);
        formData.append('difficulty', difficulty);
        formData.append('prompt', additionalInfo.trim());
        formData.append('maxMarks', String(totalMarks || 100));
        formData.append('dueDate', dueDate);
        formData.append('createdBy', 'teacher_001');
        formData.append('questionRows', JSON.stringify(mappedQuestionRows));

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${SERVER_URL}/api/uploads/material`, true);

        // Monitor upload progress percentage
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            console.log(`📤 Upload Pipeline: Progress: ${percent}%`);
            setUploadProgress(percent);
          }
        };

        // xhr.onload = () => {
        //   console.log(`📤 Upload Pipeline: Received response code ${xhr.status}`);
        //   if (xhr.status === 201) {
        //     const response = JSON.parse(xhr.responseText);
        //     const { jobId, assignmentId } = response.data;
        //     console.log('📤 Upload Pipeline: Success! Target IDs:', { jobId, assignmentId });
        //     toast.success('Material uploaded successfully! Commencing extraction parser...');
        //     connectWebSockets(jobId, assignmentId, false);
        //   } else {
        //     let errRes: any = {};

        //     try {
        //       errRes = JSON.parse(xhr.responseText || '{}');
        //     } catch (parseError) {
        //       console.error('❌ Failed to parse server response:', xhr.responseText);

        //       errRes = {
        //         message:
        //           xhr.responseText ||
        //           'Server returned invalid response format.',
        //       };
        //     }
        //     console.error('📤 Upload Pipeline: Failed with response:', errRes);
        //     handleFailure(errRes.message || 'Server material upload failed.');
        //   }
        // };

        xhr.onload = () => {
          const response = JSON.parse(xhr.responseText);

          const { jobId, assignmentId } = response.data;

          console.log(
            '📤 Upload success:',
            { jobId, assignmentId }
          );

          // connect immediately
          connectWebSockets(
            jobId,
            assignmentId,
            false
          );
        };


        xhr.onerror = () => {
          console.error('📤 Upload Pipeline: General network connectivity failure.');
          handleFailure('Network failure occurred during upload.');
        };

        xhr.send(formData);
      } else {
        // FLOW B: Prompt-only AI generation (no PDF uploaded)
        console.log('🚀 Prompt-only Pipeline: Dispatching direct AI generation request.');
        setStep('generating');
        setUploadProgress(100);
        setExtractionProgress(100);
        setAiProgress(10);
        setStatusText('Sending AI generation request...');

        const mappedQuestionRowsB = questionRows.map((row) => ({
          ...row,
          type: QUESTION_TYPE_TO_AI_TYPE[row.type] || 'long_answer',
        }));
        console.log('🚀 Standard Pipeline: questionRows being sent:', JSON.stringify(mappedQuestionRowsB));

        const promptPayload = additionalInfo.trim() || `Generate questions for subject: ${effectiveSubject}`;

        const res = await fetch(`${SERVER_URL}/api/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: effectiveTitle,
            prompt: promptPayload,
            subject: effectiveSubject,
            difficulty: difficulty,
            maxMarks: totalMarks || 100,
            dueDate: dueDate || undefined,
            createdBy: 'teacher_001',
            questionRows: mappedQuestionRowsB,
          }),
        });

        console.log(`🚀 Standard Pipeline: Received response status: ${res.status}`);
        if (!res.ok) {
          const errRes = await res.json().catch(() => ({}));
          console.error('🚀 Standard Pipeline: Call failed:', errRes);
          throw new Error(errRes.message || 'Failed to initialize AI generation.');
        }

        const response = await res.json();
        const { jobId, assignmentId } = response.data;
        console.log('🚀 Standard Pipeline: Success! Target IDs:', { jobId, assignmentId });

        toast.success('AI generation initiated! Connecting live feed...');
        connectWebSockets(jobId, assignmentId, true);
      }
    } catch (err: any) {
      console.error('💥 Core Submission Failure:', err);
      console.error('📡 Target SERVER_URL was:', SERVER_URL);
      handleFailure(err.message || 'An unexpected network error occurred. Please check backend connectivity.');
    }
  };

  const connectWebSockets = (jobId: string, assignmentId: string, isStandardFlow: boolean) => {
    if (!isStandardFlow) {
      setStep('extracting');
      setUploadProgress(100);
      setStatusText('Initializing syllabus content text extraction...');
    } else {
      setStep('generating');
      setStatusText('Connecting to background AI compile task...');
    }

    console.log(`📡 WebSockets: Connecting to Socket.IO at: ${SERVER_URL}`);
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      withCredentials: true
    });
    socketRef.current = socket;

    // Detailed debug event logger
    socket.onAny((event, data) => {
      console.log('🔥 SOCKET EVENT:', event, data);
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      console.log('Joining room:', jobId);
      socket.emit('join:job', jobId);

      // Perform State Recovery immediately on connect
      fetch(`${SERVER_URL}/api/jobs/${jobId}/status`)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && resData.data) {
            const { status, progress, error } = resData.data;
            console.log('Recovered job state:', { status, progress, error });

            if (status === 'pending') {
              setStep('extracting');
              setUploadProgress(100);
              setExtractionProgress(progress || 0);
              setStatusText(`Parsing PDF syllabus contents (${progress || 0}%)...`);
            } else if (status === 'processing') {
              setStep('generating');
              setUploadProgress(100);
              setExtractionProgress(100);
              setAiProgress(progress || 10);
              setStatusText(`Structuring exam questions via Groq Llama 3 (${progress || 10}%)...`);
            } else if (status === 'completed') {
              setStep('completed');
              setUploadProgress(100);
              setExtractionProgress(100);
              setAiProgress(100);
              setStatusText('Exam paper successfully generated and saved!');
              toast.success('Assignment question paper successfully generated!');

              addAssignment({
                title: title.trim(),
                dueDate: dueDate || 'N/A',
              });

              setTimeout(() => {
                socket.disconnect();
                setGenerating(false);
                resetForm();
                router.push(`${ROUTES.assignments}/output?id=${assignmentId}`);
              }, 1500);
            } else if (status === 'failed') {
              handleFailure(error || 'AI Generation task runner failed.');
            }
          }
        })
        .catch((err) => {
          console.error('Failed to recover job status:', err);
        });
    });

    // Handle extraction stage (PDF parsers / OCR images)
    socket.on('extraction:progress', (data) => {
      console.log('📡 WebSockets: Received event "extraction:progress":', data);
      setStep('extracting');
      setExtractionProgress(data.progress);
      setStatusText(`Parsing PDF syllabus contents (${data.progress}%)...`);
    });

    socket.on('ocr:progress', (data) => {
      console.log('📡 WebSockets: Received event "ocr:progress":', data);
      setStep('extracting');
      setExtractionProgress(data.progress);
      setStatusText(`Running OCR scanner on image context (${data.progress}%)...`);
    });

    // Handle AI generation states
    socket.on('job:queued', () => {
      console.log('📡 WebSockets: Received event "job:queued"');
      setStep('generating');
      if (!isStandardFlow) setExtractionProgress(100);
      setAiProgress(5);
      setStatusText('Task enqueued. Waiting for free background worker slot...');
    });

    socket.on('job:started', () => {
      console.log('📡 WebSockets: Received event "job:started"');
      setStep('generating');
      setAiProgress(15);
      setStatusText('Groq AI Llama 3 compiler starting generation...');
    });

    socket.on('job:progress', (data) => {
      console.log('📡 WebSockets: Received event "job:progress":', data);
      setStep('generating');
      setAiProgress(data.progress);
      setStatusText(`Structuring exam questions via Groq Llama 3 (${data.progress}%)...`);
    });

    // Handle Completed Generation
    socket.on('job:completed', (data) => {
      console.log('📡 WebSockets: Received event "job:completed" - Complete Payload:', data);
      setStep('completed');
      setAiProgress(100);
      setStatusText('Exam paper successfully generated and saved!');
      toast.success('Assignment question paper successfully generated!');

      // Populate local dashboard cards list
      addAssignment({
        title: title.trim(),
        dueDate: dueDate || 'N/A',
      });

      setTimeout(() => {
        socket.disconnect();
        setGenerating(false);
        resetForm();
        router.push(`${ROUTES.assignments}/output?id=${assignmentId}`);
      }, 1500);
    });

    // Handle Failures
    socket.on('job:failed', (data) => {
      handleFailure(data.error || 'AI Generation task runner failed.');
    });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-3xl relative">
        <PageHeader
          title="Create Assignment"
          description="Set up a new assignment with materials and question configuration"
        />

        <AssignmentForm />

        <FormFooter
          onPrevious={() => router.back()}
          onNext={handleCreate}
          isLoading={isGenerating}
        />

        {/* Real-time AI Pipeline Progress Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-neutral-100 shadow-2xl dark:bg-neutral-900 dark:border-neutral-800 space-y-6">

              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <Loader2 className={`h-10 w-10 text-indigo-600 ${step !== 'completed' && step !== 'failed' ? 'animate-spin' : ''}`} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  AI Question Generator Pipeline
                </h3>
                <p className="text-xs text-neutral-450 dark:text-neutral-400 font-medium">
                  {statusText}
                </p>
              </div>

              <Separator className="bg-slate-100" />

              <div className="space-y-5">
                {/* 1. Upload Stage */}
                {uploadedFile && (
                  <div className={`flex flex-col space-y-1.5 ${step !== 'uploading' && step !== 'idle' ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-600 dark:text-neutral-350 flex items-center gap-1.5">
                        1. Reference Material Upload
                        {uploadProgress === 100 && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 fill-green-50" />}
                      </span>
                      <span className="font-bold text-indigo-600">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5 bg-slate-100" />
                  </div>
                )}

                {/* 2. Extraction Stage */}
                {uploadedFile && (
                  <div className={`flex flex-col space-y-1.5 ${step === 'uploading' || step === 'idle' ? 'opacity-30' : step === 'generating' || step === 'completed' ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-600 dark:text-neutral-350 flex items-center gap-1.5">
                        2. Content Text Extraction (PDF / OCR)
                        {extractionProgress === 100 && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 fill-green-50" />}
                      </span>
                      <span className="font-bold text-indigo-600">{extractionProgress}%</span>
                    </div>
                    <Progress value={extractionProgress} className="h-1.5 bg-slate-100" />
                  </div>
                )}

                {/* 3. AI Question Compilation Stage */}
                <div className={`flex flex-col space-y-1.5 ${step !== 'generating' && step !== 'completed' && step !== 'failed' ? 'opacity-30' : ''}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-600 dark:text-neutral-350 flex items-center gap-1.5">
                      {uploadedFile ? '3.' : '1.'} AI Exam Paper Compilation (Groq Llama 3)
                      {aiProgress === 100 && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 fill-green-50" />}
                    </span>
                    <span className="font-bold text-indigo-600">{aiProgress}%</span>
                  </div>
                  <Progress value={aiProgress} className="h-1.5 bg-slate-100" />
                </div>
              </div>

              {/* Failure Error Display */}
              {step === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-red-800 animate-pulse text-xs dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold">Pipeline Compilation Failed</p>
                    <p className="leading-relaxed opacity-95">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Reset Control Bar */}
              {step === 'failed' && (
                <div className="pt-2">
                  <button
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors dark:border-neutral-800 dark:hover:bg-neutral-850 dark:text-neutral-300"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Try Again
                  </button>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> { }
function Separator({ className, ...props }: SeparatorProps) {
  return <div className={`h-[1px] w-full bg-neutral-200 dark:bg-neutral-800 ${className || ''}`} {...props} />;
}
