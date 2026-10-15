import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, GraduationCap, Upload, ArrowRight } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { cleanInput } from '../lib/sanitize';
import type { EducationLevel, User } from '../types';

interface Props {
  user: User;
  subjectOptions: string[];
  onClose: () => void;
  onOpenUpload: () => void;
}

export const OnboardingModal: React.FC<Props> = ({ user, subjectOptions, onClose, onOpenUpload }) => {
  const [level, setLevel] = useState<EducationLevel>(user.education_level);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(user.preferences);
  const [customSubject, setCustomSubject] = useState('');
  const queryClient = useQueryClient();

  const subjects = [...new Set([...subjectOptions, ...selectedSubjects])];

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const addCustomSubject = () => {
    const subject = cleanInput(customSubject, 60);
    if (subject && !selectedSubjects.includes(subject)) {
      setSelectedSubjects((prev) => [...prev, subject]);
    }
    setCustomSubject('');
  };

  const prefMutation = useMutation({
    mutationFn: (skip: boolean) =>
      apiFetch<User>('/api/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          education_level: level,
          preferences: selectedSubjects,
          skip,
        }),
      }),
    onSuccess: (updatedUser, skipped) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      onClose();
      if (skipped) {
        onOpenUpload();
      }
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl border border-indigo-100">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6D5CAE] bg-purple-50 px-3 py-1 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Personalize Your Skrulla Feed
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900">
          What sparks your curiosity?
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          We use this to load verified default study cards and quizzes when you haven&apos;t uploaded notes yet.
        </p>

        {/* Grade / Education Level Selector */}
        <div className="mt-5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
            <GraduationCap className="w-4 h-4 text-[#6D5CAE]" /> Select your education level
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['High School', 'University'] as EducationLevel[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLevel(item)}
                className={`py-3 px-4 rounded-2xl text-xs font-bold border transition ${
                  level === item
                    ? 'bg-[#1C1B22] text-white border-[#1C1B22]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item} Level
              </button>
            ))}
          </div>
        </div>

        {/* Subject Preferences */}
        <div className="mt-5">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Pick your favorite subjects
          </label>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subj) => {
              const active = selectedSubjects.includes(subj);
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => toggleSubject(subj)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-[#6D5CAE] text-white shadow-sm'
                      : 'bg-[#F4F3F8] text-slate-700 hover:bg-purple-100'
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addCustomSubject();
            }}
            className="mt-3 flex gap-2"
          >
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Add another subject..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#6D5CAE]"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[#F4F3F8] text-slate-700 text-xs font-semibold hover:bg-purple-100"
            >
              Add
            </button>
          </form>
        </div>

        {/* Actions: Save or Skip straight to Uploading */}
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => prefMutation.mutate(true)}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Skip &amp; Upload Notes Now
          </button>
          <button
            type="button"
            onClick={() => prefMutation.mutate(false)}
            className="flex-1 py-3 px-5 rounded-xl bg-[#1C1B22] text-white text-xs font-semibold hover:bg-slate-800 flex items-center justify-center gap-1.5"
          >
            <span>Start Scrolling</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
