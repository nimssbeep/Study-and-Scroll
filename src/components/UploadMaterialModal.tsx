import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Sparkles } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { cleanInput, validateEducationalFile } from '../lib/sanitize';
import { getActiveGeminiKey } from '../lib/aiPersonaEngine';

interface Props {
  isOpen: boolean;
  defaultSubject: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const UploadMaterialModal: React.FC<Props> = ({
  isOpen,
  defaultSubject,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState(defaultSubject);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isAiActive = Boolean(getActiveGeminiKey());

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error('Please choose a study file (.pdf, .txt, .md)');
      const validationError = validateEducationalFile(uploadFile, 10);
      if (validationError) throw new Error(validationError);

      const formData = new FormData();
      formData.append('title', cleanInput(uploadTitle, 100));
      formData.append('subject', cleanInput(uploadSubject, 60));
      formData.append('file', uploadFile);

      return apiFetch('/api/materials/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      onClose();
      setUploadTitle('');
      setUploadFile(null);
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onSuccess('Notes uploaded & grounded cards generated!');
    },
    onError: (err: Error) => setUploadError(err.message),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-slate-900">Upload Study Material</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Strictly educational files (.pdf, .txt, .md up to 10 MB). Our Hallucination Shield
          verifies every generated card against your source text.
        </p>

        {/* AI Engine Status Pill */}
        <div className="mb-4 p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-semibold bg-slate-50 border-slate-100">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#6D5CAE]" />
            <span className="text-slate-700">AI Card Generator:</span>
          </div>
          {isAiActive ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Gemini 3 Flash Active
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Offline Synthesizer
            </span>
          )}
        </div>

        {uploadError && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 text-xs text-rose-700 border border-rose-200">
            {uploadError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            uploadMutation.mutate();
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Course / Note Title
            </label>
            <input
              type="text"
              required
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g., Organic Chemistry Lecture 4"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              required
              list="subject-options"
              value={uploadSubject}
              onChange={(e) => setUploadSubject(e.target.value)}
              placeholder="e.g., Chemistry"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              File (.pdf, .txt, .md — Max 10MB)
            </label>
            <input
              type="file"
              accept=".pdf,.txt,.md"
              required
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="w-full py-3 rounded-xl bg-[#1C1B22] text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition shadow-sm"
          >
            {uploadMutation.isPending
              ? 'Sanitizing & Generating Grounded Cards...'
              : 'Upload & Generate Feed Cards'}
          </button>
        </form>
      </div>
    </div>
  );
};
