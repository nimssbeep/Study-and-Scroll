import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, ShieldCheck, ArrowUpRight, Users } from 'lucide-react';
import { apiFetch, setAuthSession } from '../lib/api';
import { cleanInput } from '../lib/sanitize';
import type { AuthResponse } from '../types';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const authMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email: cleanInput(email, 120), password }
          : { name: cleanInput(name, 80), email: cleanInput(email, 120), password };
      return apiFetch<AuthResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: (data) => {
      setAuthSession(data.access_token, data.csrf_token);
      queryClient.setQueryData(['currentUser'], data.user);
      navigate('/feed');
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authMutation.mutate();
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-slate-900">
      {/* Left Brand Showcase Panel */}
      <div className="bg-[#EEF0FF] p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-[#6D5CAE]" />
          <span className="text-xl font-bold tracking-tight">
            study<span className="font-serif italic font-normal text-[#6D5CAE]">&amp;</span>scroll.
          </span>
          <span className="ml-2 text-xs font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-200/70 text-[#59469B]">
            Skrulla
          </span>
        </div>

        <div className="my-10 max-w-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A6F9B] mb-4">
            YOUR NEXT SCROLL COULD CHANGE YOUR MIND.
          </p>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            A little scroll.
            <br />A whole lot of
            <br />
            <span className="font-serif italic font-normal text-[#8B7BB8]">possibility.</span>
          </h1>
          <p className="mt-5 text-slate-600 text-sm leading-relaxed">
            Turn your study notes into a feed worth getting lost in.
            <br />
            Learn a little. Connect a little. Grow a lot.
          </p>

          {/* Preview Storyteller Card */}
          <div className="mt-8 bg-white rounded-3xl p-5 shadow-xl shadow-indigo-950/5 border border-indigo-100 -rotate-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-[#6D5CAE] flex items-center justify-center font-serif font-bold text-sm">
                  S
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">The Storyteller</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">
                      AI
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">From your Biology 101 notes</p>
                </div>
              </div>
              <span className="text-slate-300 text-sm">•••</span>
            </div>

            <div className="bg-gradient-to-br from-[#DCE5FF] to-[#E8E2FF] rounded-2xl p-5 relative overflow-hidden">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">
                YOUR DAILY LIGHTBULB MOMENT
              </p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                Big ideas.
                <br />
                <span className="font-serif italic font-normal text-[#6D5CAE]">Bite-sized.</span>
              </h3>
              <div className="mt-4 inline-flex items-center gap-1 bg-[#FFF6D6] text-amber-900 text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-sm">
                <ArrowUpRight className="w-3.5 h-3.5" /> A better kind of feed. 01 / 04 →
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
              <span>Made for your curious mind.</span>
              <span className="text-emerald-600 font-medium">Source verified ✓</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600">
          <div className="w-9 h-9 rounded-full bg-white text-[#6D5CAE] flex items-center justify-center shadow-sm">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Good minds. Great company.</p>
            <p className="text-slate-500 text-[11px]">Your learning era starts here.</p>
          </div>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="p-8 lg:p-16 flex flex-col justify-between">
        <div className="flex justify-end">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            Skrulla Social Learning <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="max-w-md w-full mx-auto my-auto">
          {/* Segmented Toggle */}
          <div className="bg-[#F4F3F8] p-1.5 rounded-2xl grid grid-cols-2 mb-8">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2.5 text-xs font-semibold rounded-xl transition ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`py-2.5 text-xs font-semibold rounded-xl transition ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Create account
            </button>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7A6F9B]">
            {mode === 'login' ? 'WELCOME BACK, CURIOUS MIND' : 'A FRESH START FOR A CURIOUS MIND'}
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
            {mode === 'login' ? 'Good to have you back.' : 'Your next chapter starts here.'}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 mb-6">
            {mode === 'login'
              ? 'Big ideas and little discoveries are waiting for you.'
              : 'Less mindless scrolling. More moments that stick.'}
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#6D5CAE]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#6D5CAE]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === 'login' ? 'Enter your password' : 'Create a password (6+ characters)'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#6D5CAE]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <p className="text-[11px] text-slate-400">
                You can choose your interests &amp; grade level next, or skip straight to your notes.
              </p>
            )}

            <button
              type="submit"
              disabled={authMutation.isPending}
              className="w-full bg-[#1C1B22] hover:bg-[#2C2A35] text-white font-semibold text-sm py-3.5 px-5 rounded-xl flex items-center justify-between transition disabled:opacity-50"
            >
              <span>
                {authMutation.isPending
                  ? 'Please wait...'
                  : mode === 'login'
                  ? 'Sign in'
                  : 'Create my account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#6D5CAE]" />
            <span>Protected by Hallucination Shield &amp; End-to-End Input Sanitization.</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center">© 2026 Skrulla (Study &amp; Scroll)</p>
      </div>
    </div>
  );
};
