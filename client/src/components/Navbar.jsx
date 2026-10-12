import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Bell, LogOut, User, Shield, Wrench, GraduationCap, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { ROLE_LABELS } from '../constants/routes';

export function Navbar({ onOpenScanner }) {
  const { user, profile, role, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const roleIcons = {
    student: GraduationCap,
    faculty: GraduationCap,
    technician: Wrench,
    maintenance_admin: Shield,
    admin: Shield,
    supervisor: Shield,
    system_admin: Shield
  };

  const RoleIcon = roleIcons[role] || User;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-stone-900 block leading-tight">FixIt QR</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-700 block">Smart Campus</span>
              </div>
            </Link>
          </div>

          {/* Quick Scan & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/qr-test"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition"
              title="View 5 Campus Test QR Codes"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>5 Test QRs</span>
            </Link>

            {onOpenScanner && (
              <button
                type="button"
                onClick={onOpenScanner}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition"
                title="Scan an equipment QR code"
              >
                <QrCode className="w-4 h-4 text-amber-600" />
                <span>Scan Camera</span>
              </button>
            )}

            {/* Notification Indicator */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-600 ring-2 ring-white"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-900">Campus Notifications</span>
                    <span className="text-[10px] text-stone-400">Recent</span>
                  </div>
                  <div className="px-4 py-3 text-xs text-stone-600 hover:bg-stone-50 transition border-b border-stone-50">
                    <p className="font-medium text-stone-800">System Ready</p>
                    <p className="text-stone-500 text-[11px] mt-0.5">FixIt QR campus maintenance network is operational.</p>
                  </div>
                  <div className="px-4 py-2 text-center">
                    <button 
                      type="button" 
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] font-medium text-amber-700 hover:text-amber-800"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Status */}
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-stone-200">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-semibold text-stone-900 leading-tight">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] font-semibold text-amber-700">
                    {ROLE_LABELS[role] || role?.replace('_', ' ')}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                  <RoleIcon className="w-4 h-4" />
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    navigate('/login');
                  }}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition shadow-sm"
              >
                Sign In
              </Link>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
