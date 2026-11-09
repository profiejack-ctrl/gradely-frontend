import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Camera,
  AlertCircle,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  { id: '1', name: 'Alex', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
  { id: '2', name: 'Maya', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya' },
  { id: '3', name: 'Felix', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: '4', name: 'Chloe', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe' },
  { id: '5', name: 'Ryan', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan' },
  { id: '6', name: 'Sara', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara' },
  { id: '7', name: 'Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo' },
  { id: '8', name: 'Scholar', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Kris' },
  { id: '9', name: 'Tech Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=GradelyBot' },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const currentPreviewAvatar = customAvatarUrl.trim()
    || avatar
    || user.avatar
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'user')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (cleanName.length < 2) {
      setError('Please provide your full name (at least 2 characters).');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (newPassword.trim().length > 0) {
      if (newPassword.trim().length < 8) {
        setError('New password must be at least 8 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const finalAvatar = customAvatarUrl.trim() || avatar || undefined;
      const res = await api.updateProfile({
        name: cleanName,
        email: cleanEmail,
        avatar: finalAvatar,
        newPassword: newPassword.trim() ? newPassword.trim() : undefined,
      });

      if (res.user) {
        updateUser(res.user);
        setSuccess('Profile updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-[#0D1525] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0284C7]/20 border border-[#0284C7]/40 flex items-center justify-center text-[#38BDF8]">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Edit Profile & Account</h2>
              <p className="text-xs text-slate-400">Update your personal details, credentials, and avatar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Avatar Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Profile Avatar
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-[#0284C7] overflow-hidden shadow-glow flex items-center justify-center">
                  <img
                    src={currentPreviewAvatar}
                    alt={name || 'Avatar'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'user')}`;
                    }}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0284C7] flex items-center justify-center text-white shadow">
                  <Camera className="w-3 h-3" />
                </div>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <p className="text-xs font-semibold text-white">Choose an Avatar Preset</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {AVATAR_PRESETS.map((p) => {
                    const isSelected = avatar === p.url && !customAvatarUrl;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setAvatar(p.url);
                          setCustomAvatarUrl('');
                        }}
                        className={`w-9 h-9 rounded-xl border p-0.5 transition overflow-hidden relative ${
                          isSelected
                            ? 'border-[#38BDF8] ring-2 ring-[#0284C7]/50 bg-[#0284C7]/20 scale-105'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-800/40'
                        }`}
                        title={p.name}
                      >
                        <img src={p.url} alt={p.name} className="w-full h-full object-contain" />
                        {isSelected && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#0284C7] rounded-full flex items-center justify-center text-white">
                            <Check className="w-2 h-2" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="Or enter custom image URL (https://...)"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-[#0284C7] focus:outline-none text-white placeholder-slate-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Account Information
            </label>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 focus:border-[#0284C7] focus:outline-none text-white"
                  placeholder="e.g. Romel Cabiling"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 focus:border-[#0284C7] focus:outline-none text-white"
                  placeholder="e.g. user@gradely.edu"
                />
              </div>
            </div>
          </div>

          {/* Change Password (Optional) */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Change Password (Optional)
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Leave blank if you do not want to change your existing password.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 focus:border-[#0284C7] focus:outline-none text-white"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {newPassword.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 focus:border-[#0284C7] focus:outline-none text-white"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white flex items-center gap-2 shadow-lg shadow-[#0284C7]/20 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
