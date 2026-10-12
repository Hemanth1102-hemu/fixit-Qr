import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Bell, 
  LogOut, 
  Key, 
  Building2, 
  CheckCircle2, 
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SupervisorHeader } from '../../components/supervisor/SupervisorHeader';

export function SupervisorProfile() {
  const { profile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyUrgent, setNotifyUrgent] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <SupervisorHeader 
        title="Supervisor Account & Security"
        subtitle="Manage verified institutional profile details, security credentials, and escalation alert preferences."
        breadcrumbs={[{ label: 'Profile' }]}
      />

      {savedNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Profile preferences updated successfully.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Card: Account Card */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-2xs space-y-5 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-2xl ring-8 ring-amber-50">
            {profile?.full_name ? profile.full_name[0].toUpperCase() : 'S'}
          </div>

          <div>
            <h3 className="text-base font-bold text-stone-900">{profile?.full_name || 'Supervisor'}</h3>
            <p className="text-xs text-stone-500 font-mono mt-0.5">{profile?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Verified Supervisor
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 text-left space-y-2 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-stone-400">Institution:</span>
              <span className="font-semibold text-stone-800">SRMIST Chennai</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-400">Department:</span>
              <span className="font-semibold text-stone-800">Estate Operations</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-400">Account Status:</span>
              <span className="font-semibold text-emerald-700">Active & Authorized</span>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full py-2.5 px-4 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition flex items-center justify-center gap-2 border border-rose-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Securely
          </button>
        </div>

        {/* Right 2 Cols: Profile Form & Notification Preferences */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Identity & Contact Form */}
          <form onSubmit={handleSavePreferences} className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <User className="w-4 h-4 text-stone-600" />
              Institutional Identity Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Full Name</label>
                <input 
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Institutional Email (Verified)</label>
                <div className="relative">
                  <input 
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full bg-stone-100 border border-stone-200 rounded-xl p-2.5 text-stone-500 font-mono cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">Managed by SRMIST Single Sign-On</p>
              </div>
            </div>

            {/* Notification Rules */}
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <h4 className="text-xs font-bold text-stone-700 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                Operational Notification Preferences
              </h4>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-stone-700">Receive email notification when technician submits completion review</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={notifyUrgent}
                    onChange={(e) => setNotifyUrgent(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-stone-700">Immediate alert when urgent complaint exceeds SLA target</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition shadow-2xs"
              >
                Save Preferences
              </button>
            </div>
          </form>

          {/* Security & Access Notice */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 text-xs text-stone-600 space-y-2">
            <h4 className="font-bold text-stone-800 flex items-center gap-2">
              <Key className="w-4 h-4 text-stone-600" />
              Role & Permission Governance
            </h4>
            <p className="leading-relaxed">
              Supervisor roles are provisioned by the SRMIST Estate Office. Under campus security policy, role escalation, account permissions, and database credentials cannot be self-modified from this interface.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
