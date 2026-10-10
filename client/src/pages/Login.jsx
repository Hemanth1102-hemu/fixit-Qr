import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Lock, Mail, AlertCircle, ArrowRight, Shield, Wrench, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md">
            <QrCode className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-stone-900">
          FixIt QR Campus Maintenance
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">
          Sign in to report equipment issues, manage work orders, and review campus repairs
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200 rounded-2xl sm:px-10 space-y-6">

          {!isConfigured && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Supabase Configuration Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Connect your real Supabase project by copying <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env.example</code> to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> and adding your credentials.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Campus Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campus.edu or admin@campus.edu"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Academic Demo Accounts Fill */}
          <div className="pt-4 border-t border-stone-100">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-2">
              Academic Role Demo Credentials
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('student@campus.edu', 'StudentPass123!')}
                className="p-2 text-left rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/60 transition group"
              >
                <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                  <span>Student</span>
                </div>
                <span className="text-[10px] text-stone-400 block mt-0.5">student@campus.edu</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('tech@campus.edu', 'TechPass123!')}
                className="p-2 text-left rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/60 transition group"
              >
                <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                  <Wrench className="w-3.5 h-3.5 text-amber-700" />
                  <span>Technician</span>
                </div>
                <span className="text-[10px] text-stone-400 block mt-0.5">tech@campus.edu</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin@campus.edu', 'AdminPass123!')}
                className="p-2 text-left rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/60 transition group"
              >
                <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                  <Shield className="w-3.5 h-3.5 text-amber-700" />
                  <span>College Admin</span>
                </div>
                <span className="text-[10px] text-stone-400 block mt-0.5">admin@campus.edu</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('sysadmin@campus.edu', 'SysAdminPass123!')}
                className="p-2 text-left rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/60 transition group"
              >
                <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                  <Shield className="w-3.5 h-3.5 text-amber-900" />
                  <span>System Admin</span>
                </div>
                <span className="text-[10px] text-stone-400 block mt-0.5">sysadmin@campus.edu</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
