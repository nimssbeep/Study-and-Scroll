import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, Camera, Trash2, Check, Lock, KeyRound, Eye, EyeOff,
  User as UserIcon, GraduationCap, Calendar, Award, Globe,
  Github, Linkedin, Twitter, Instagram, Sparkles, AlertCircle, ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { cleanInput } from '../lib/sanitize';
import { UserAvatar } from './UserAvatar';
import type { User, EducationLevel } from '../types';

interface Props {
  user: User;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

type TabType = 'general' | 'certifications' | 'security';

const POPULAR_SCHOOLS = [
  'Harvard University',
  'Stanford University',
  'Massachusetts Institute of Technology (MIT)',
  'University of California, Berkeley',
  'University of Oxford',
  'University of Cambridge',
  'University of Toronto',
  'National University of Singapore (NUS)',
  'ETH Zurich',
  'Carnegie Mellon University',
  'University of Washington',
  'Georgia Institute of Technology',
  'New York University (NYU)',
  'University of Michigan',
];

const SUGGESTED_CERTS = [
  'AWS Certified Cloud Practitioner',
  'AWS Solutions Architect',
  'Google Cloud Associate Engineer',
  'CompTIA Security+',
  'CompTIA Network+',
  'Meta Frontend Developer',
  'Harvard CS50',
  'TensorFlow Developer',
  'Azure Fundamentals AZ-900',
  'PMP Project Management',
];

export const ProfileSettingsModal: React.FC<Props> = ({ user, onClose, onSuccessToast }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('general');

  // General fields
  const [name, setName] = useState(user.name || '');
  const [handle, setHandle] = useState((user.handle || '').replace(/^@/, ''));
  const [bio, setBio] = useState(user.bio || '');
  const [school, setSchool] = useState(user.school || '');
  const [birthday, setBirthday] = useState(user.birthday || '');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(user.education_level);

  // Certifications
  const [certifications, setCertifications] = useState<string[]>(user.certifications || []);
  const [certInput, setCertInput] = useState('');

  // Social Links
  const [github, setGithub] = useState(user.social_links?.github || '');
  const [linkedin, setLinkedin] = useState(user.social_links?.linkedin || '');
  const [twitter, setTwitter] = useState(user.social_links?.twitter || '');
  const [instagram, setInstagram] = useState(user.social_links?.instagram || '');
  const [website, setWebsite] = useState(user.social_links?.website || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Error & Success feedback states
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Profile Save Mutation
  const profileMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      handle: string;
      bio: string;
      school: string;
      birthday: string;
      education_level: string;
      certifications: string[];
      social_links: Record<string, string>;
    }) =>
      apiFetch<User>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      setProfileError(null);
      setProfileSuccess('Profile updated successfully!');
      onSuccessToast?.('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setProfileError(err.message || 'Failed to update profile.');
      setProfileSuccess(null);
    },
  });

  // Avatar Upload Mutation
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiFetch<User>('/api/auth/avatar', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      setProfileSuccess('Profile picture updated!');
      onSuccessToast?.('Profile picture updated!');
      setTimeout(() => setProfileSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setProfileError(err.message || 'Failed to upload photo.');
    },
  });

  // Remove Avatar Mutation
  const removeAvatarMutation = useMutation({
    mutationFn: () => apiFetch<User>('/api/auth/avatar', { method: 'DELETE' }),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      setProfileSuccess('Profile picture removed.');
      onSuccessToast?.('Profile picture removed.');
      setTimeout(() => setProfileSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setProfileError(err.message || 'Failed to remove photo.');
    },
  });

  // Password Change Mutation
  const passwordMutation = useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      apiFetch<{ message: string }>('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: (res) => {
      setPasswordError(null);
      setPasswordSuccess(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onSuccessToast?.('Password changed successfully!');
      setTimeout(() => setPasswordSuccess(null), 4000);
    },
    onError: (err: Error) => {
      setPasswordError(err.message || 'Failed to change password.');
      setPasswordSuccess(null);
    },
  });

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    const cleanName = cleanInput(name, 60);
    if (cleanName.length < 2) {
      setProfileError('Display name must be at least 2 characters.');
      return;
    }

    const cleanHandleStr = cleanInput(handle, 30).toLowerCase().replace(/^@/, '');
    if (!/^[a-z0-9_.]+$/.test(cleanHandleStr)) {
      setProfileError('Username can only contain letters, numbers, underscores, and dots.');
      return;
    }
    if (cleanHandleStr.length < 3) {
      setProfileError('Username must be at least 3 characters long.');
      return;
    }

    const social_links: Record<string, string> = {};
    if (github.trim()) social_links.github = cleanInput(github, 160);
    if (linkedin.trim()) social_links.linkedin = cleanInput(linkedin, 160);
    if (twitter.trim()) social_links.twitter = cleanInput(twitter, 160);
    if (instagram.trim()) social_links.instagram = cleanInput(instagram, 160);
    if (website.trim()) social_links.website = cleanInput(website, 160);

    profileMutation.mutate({
      name: cleanName,
      handle: `@${cleanHandleStr}`,
      bio: cleanInput(bio, 300),
      school: cleanInput(school, 160),
      birthday: cleanInput(birthday, 50),
      education_level: educationLevel,
      certifications,
      social_links,
    });
  };

  // Add Certification
  const handleAddCert = (certText?: string) => {
    const textToAdd = (certText || certInput).trim();
    if (!textToAdd) return;
    const cleanCert = cleanInput(textToAdd, 80);
    if (!certifications.includes(cleanCert)) {
      if (certifications.length >= 15) {
        setProfileError('You can add up to 15 certifications.');
        return;
      }
      setCertifications((prev) => [...prev, cleanCert]);
    }
    setCertInput('');
  };

  const handleRemoveCert = (index: number) => {
    setCertifications((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Password Change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password cannot be the same as your current password.');
      return;
    }

    passwordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-indigo-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6D5CAE] to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                Profile &amp; Account Settings
              </h3>
              <p className="text-xs text-slate-400">
                Customize your academic identity, certifications &amp; security
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 gap-2 bg-white shrink-0">
          {[
            { id: 'general', label: 'Profile & Academic', icon: UserIcon },
            { id: 'certifications', label: 'Certifications & Socials', icon: Award },
            { id: 'security', label: 'Security & Password', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setProfileError(null);
                  setPasswordError(null);
                }}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition ${
                  active
                    ? 'border-[#6D5CAE] text-[#6D5CAE]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Hidden File Input for Avatar */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.size > 5 * 1024 * 1024) {
                setProfileError('Profile picture must be under 5 MB.');
                return;
              }
              avatarMutation.mutate(file);
            }
          }}
        />

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
          {/* TAB 1: GENERAL PROFILE */}
          {activeTab === 'general' && (
            <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-5">
              {profileError && (
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{profileError}</span>
                </div>
              )}
              {profileSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{profileSuccess}</span>
                </div>
              )}

              {/* Avatar Section */}
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  <UserAvatar
                    name={user.name}
                    avatarUrl={user.avatar_url}
                    size="xl"
                    className="ring-4 ring-white shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarMutation.isPending}
                    className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#6D5CAE] text-white hover:bg-[#584699] shadow-md ring-2 ring-white transition"
                    title="Upload custom photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-bold text-slate-900 text-sm">Profile Picture</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upload your favorite portrait. Supported formats: JPG, PNG, WEBP, GIF (max 5MB).
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarMutation.isPending}
                      className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 hover:border-[#6D5CAE] text-[#6D5CAE] font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {avatarMutation.isPending ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    {user.avatar_url && (
                      <button
                        type="button"
                        onClick={() => removeAvatarMutation.mutate()}
                        disabled={removeAvatarMutation.isPending}
                        className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold text-xs transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Display Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={60}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Username / Handle <span className="text-slate-400 font-normal">(@unique)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-xs select-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                      required
                      maxLength={30}
                      placeholder="alex.learner"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Bio / About me */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Bio &amp; Study Motto</label>
                  <span className="text-[10px] text-slate-400">{bio.length}/300</span>
                </div>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                  placeholder="Tell peers what you are studying, your goals, or your favorite subjects..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs font-medium resize-none"
                />
              </div>

              {/* School & Birthday */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#6D5CAE]" />
                    School / University
                  </label>
                  <input
                    type="text"
                    list="school-suggestions"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    maxLength={160}
                    placeholder="e.g. Stanford University"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs font-medium"
                  />
                  <datalist id="school-suggestions">
                    {POPULAR_SCHOOLS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#6D5CAE]" />
                    Birthday
                  </label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs font-medium"
                  />
                </div>
              </div>

              {/* Education Level Toggle */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Education Stage</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['High School', 'University'] as EducationLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEducationLevel(lvl)}
                      className={`p-3 rounded-2xl border text-center font-bold transition flex items-center justify-center gap-2 ${
                        educationLevel === lvl
                          ? 'border-[#6D5CAE] bg-purple-50 text-[#6D5CAE]'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>{lvl}</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: CERTIFICATIONS & SOCIALS */}
          {activeTab === 'certifications' && (
            <div className="space-y-6">
              {profileError && (
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{profileError}</span>
                </div>
              )}
              {profileSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{profileSuccess}</span>
                </div>
              )}

              {/* Certifications Manager */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Award className="w-4 h-4 text-amber-500" />
                    Academic &amp; Professional Certifications ({certifications.length})
                  </label>
                  <span className="text-[10px] text-slate-400">Shown as badges on your profile</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCert();
                      }
                    }}
                    placeholder="e.g. AWS Solutions Architect, CompTIA Security+..."
                    maxLength={80}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCert()}
                    disabled={!certInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#6D5CAE] text-white font-bold hover:bg-[#584699] disabled:opacity-50 transition"
                  >
                    Add
                  </button>
                </div>

                {/* Current Certifications Badges */}
                <div className="flex flex-wrap gap-2 min-h-[38px] p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                  {certifications.length === 0 ? (
                    <p className="text-slate-400 text-xs italic py-1">
                      No certifications added yet. Add your certificates, licenses, or honors above!
                    </p>
                  ) : (
                    certifications.map((cert, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100/70 text-[#534092] font-semibold text-xs border border-purple-200 shadow-sm animate-in fade-in"
                      >
                        <Award className="w-3 h-3 text-[#6D5CAE]" />
                        <span>{cert}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCert(idx)}
                          className="hover:text-rose-600 rounded-full p-0.5 hover:bg-white/60 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Quick Add Suggestions */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 mb-1.5">
                    Popular student certifications (Click to add):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_CERTS.map((sc) => {
                      const alreadyAdded = certifications.includes(sc);
                      return (
                        <button
                          key={sc}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => handleAddCert(sc)}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                            alreadyAdded
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-white hover:bg-purple-50 text-slate-600 hover:text-[#6D5CAE] border-slate-200 hover:border-purple-300'
                          }`}
                        >
                          {alreadyAdded ? <Check className="w-2.5 h-2.5" /> : <span>+</span>}
                          {sc}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#6D5CAE]" />
                    Social &amp; Portfolio Links
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Connect with study partners across your favorite platforms
                  </p>
                </div>

                <div className="space-y-3">
                  {/* GitHub */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-slate-700" /> GitHub URL / Username
                    </label>
                    <input
                      type="text"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/username or your handle"
                      maxLength={160}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs font-medium"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-sky-600" /> LinkedIn URL
                    </label>
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      maxLength={160}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs font-medium"
                    />
                  </div>

                  {/* Twitter / X */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                      <Twitter className="w-3.5 h-3.5 text-slate-800" /> Twitter / X
                    </label>
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://x.com/username or @handle"
                      maxLength={160}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs font-medium"
                    />
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-rose-500" /> Instagram
                    </label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="https://instagram.com/username or @handle"
                      maxLength={160}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs font-medium"
                    />
                  </div>

                  {/* Personal Website */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" /> Personal Website / Portfolio
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://myportfolio.dev"
                      maxLength={160}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60 flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-xs">Security &amp; Password Management</h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                    To change your password, provide your current password followed by your new password (minimum 6 characters).
                  </p>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{passwordError}</span>
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{passwordSuccess}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter your current password"
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Create a strong password (6+ chars)"
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Re-enter your new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={passwordMutation.isPending || !currentPassword || !newPassword}
                className="w-full py-3 px-4 rounded-xl bg-[#1C1B22] text-white font-bold hover:bg-slate-800 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {passwordMutation.isPending ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer (for tabs 1 and 2) */}
        {activeTab !== 'security' && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50 rounded-b-3xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={profileMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-[#6D5CAE] text-white font-bold hover:bg-[#584699] disabled:opacity-50 shadow-md shadow-purple-200 transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {profileMutation.isPending ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
