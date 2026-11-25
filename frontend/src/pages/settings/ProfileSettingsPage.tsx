import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
} from 'lucide-react';

export const ProfileSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordStatus({
        type: 'error',
        message: 'New password must be at least 8 characters long.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: 'error',
        message: 'New passwords do not match. Please verify.',
      });
      return;
    }

    setIsSubmitting(true);
    setPasswordStatus({ type: null, message: '' });

    try {
      // Simulated secure password change endpoint call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setPasswordStatus({
        type: 'success',
        message: 'Security credentials updated successfully. Please use your new password next time.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordStatus({
        type: 'error',
        message: 'Unable to update password. Please check your current password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Account Profile & Security"
        description="Review personal credentials, role permissions, and update system authentication settings."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Officer / Admin Profile Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 text-white flex items-center justify-center text-3xl font-black shadow-md mb-4 uppercase">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <h3 className="text-lg font-bold text-slate-900">{user?.fullName}</h3>
          <p className="text-xs font-medium text-slate-500 mb-3">@{user?.username}</p>

          <div className="flex items-center space-x-2 mb-6">
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                user?.role === 'ADMIN'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {user?.role === 'ADMIN' ? 'System Administrator' : 'Traffic Police Officer'}
            </span>
            <StatusBadge status={user?.status || 'ACTIVE'} />
          </div>

          <div className="w-full border-t border-slate-100 pt-4 space-y-3 text-left">
            <div className="flex items-center text-xs text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
              <span className="truncate">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center text-xs text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
              <span>{user?.phone || 'No phone registered'}</span>
            </div>
            <div className="flex items-center text-xs text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
              <span>
                Joined{' '}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : 'Active System User'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Details & Password Update */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity & Department Details */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Authorized System Privileges</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-500 block mb-1">
                  Access Scope
                </span>
                <span className="font-bold text-slate-900">
                  {user?.role === 'ADMIN'
                    ? 'Global System-Wide Authority (All Intersections)'
                    : 'Assigned Crossing Zones & Operational Logs Only'}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-500 block mb-1">
                  Session Token Validity
                </span>
                <span className="font-bold text-slate-900">
                  15 Minutes (Auto-refreshed via 7-day token)
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-500 block mb-1">
                  Department
                </span>
                <span className="font-bold text-slate-900">
                  Wachemo University Highway Division
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-500 block mb-1">
                  Control Node
                </span>
                <span className="font-bold text-slate-900">
                  Hosanna Central Operations Gateway
                </span>
              </div>
            </div>
          </div>

          {/* Password Update Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-slate-700" />
              <span>Update Password Credentials</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Ensure your password is at least 8 characters long with a mix of letters and numbers.
            </p>

            {passwordStatus.type && (
              <div
                className={`p-3.5 rounded-xl border mb-4 text-xs flex items-center space-x-2 ${
                  passwordStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {passwordStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
