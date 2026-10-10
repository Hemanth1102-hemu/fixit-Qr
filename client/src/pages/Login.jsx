import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  Lock, 
  Mail, 
  AlertCircle, 
  ArrowRight, 
  Shield, 
  Wrench, 
  GraduationCap, 
  CheckCircle2,
  Building,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

export function Login() {
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requestedRole, setRequestedRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const isSrmistEmail = (val) => val.trim().toLowerCase().endsWith('@srmist.edu.in');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    // Client-side domain validation guidance
    if (!isSrmistEmail(email)) {
      setError('Institutional requirement: Please enter a verified SRMIST email address ending in @srmist.edu.in');
      return;
    }

    setLoading(true);

    if (isRegisterMode) {
      try {
        const res = await apiRequest('/me/register', {
          method: 'POST',
          body: JSON.stringify({
            full_name: fullName,
            email,
            password,
            requested_role: requestedRole
          })
        });
        setSuccessNotice(res.message || 'Account registered! Please sign in with your credentials.');
        setIsRegisterMode(false);
      } catch (err) {
        setError(err.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        await signIn(email, password);
        navigate('/');
      } catch (err) {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsRegisterMode(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md">
            <QrCode className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 text-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            SRM Institute of Science & Technology
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">
            FixIt QR Campus Maintenance
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Rapid QR equipment reporting & work order management for SRMIST classrooms and laboratories
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200 rounded-2xl sm:px-10 space-y-5">

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-stone-200 pb-2 gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setError(''); }}
              className={`pb-1 transition ${!isRegisterMode ? 'border-b-2 border-amber-600 text-amber-900' : 'text-stone-400 hover:text-stone-700'}`}
            >
              Sign In with SRMIST ID
            </button>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setError(''); }}
              className={`pb-1 transition ${isRegisterMode ? 'border-b-2 border-amber-600 text-amber-900' : 'text-stone-400 hover:text-stone-700'}`}
            >
              Register New Account
            </button>
          </div>

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleSubmit}>
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name (As per SRMIST ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="block w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Institutional Role
                  </label>
                  <select
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value)}
                    className="block w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="student">Student (B.Tech / M.Tech / PhD)</option>
                    <option value="faculty">Faculty / Department Staff</option>
                  </select>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    * Technician and administrative permissions require authorization from estate office.
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                SRMIST Official Email
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
                  placeholder="name_dept@srmist.edu.in"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-mono"
                />
              </div>
              <span className="text-[10px] text-stone-500 block mt-1">
                Must end with <strong className="text-amber-800">@srmist.edu.in</strong>
              </span>
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
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Processing...' : (isRegisterMode ? 'Create SRMIST Account' : 'Sign In to Campus Portal')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Institutional Role Demo Shortcuts */}
          <div className="pt-4 border-t border-stone-100">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
              Verified SRMIST Accounts (For Evaluation & Demo)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoFill('student@srmist.edu.in', 'StudentPass123!')}
                className="p-2 text-left rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/60 transition"
              >
                <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                  <span>SRM Student</span>
                </div>
                <span className="text-[10px] text-stone-500 font-mono block mt-0.5 truncate">student@srmist.edu.in</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('faculty@srmist.edu.in', 'FacultyPass123!')}
                className="p-2 text-left rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/60 transition"
              >
                <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-900" />
                  <span>SRM Faculty</span>
                </div>
                <span className="text-[10px] text-stone-500 font-mono block mt-0.5 truncate">faculty@srmist.edu.in</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('tech.elec@srmist.edu.in', 'TechPass123!')}
                className="p-2 text-left rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/60 transition"
              >
                <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                  <Wrench className="w-3.5 h-3.5 text-amber-700" />
                  <span>Maintenance Staff</span>
                </div>
                <span className="text-[10px] text-stone-500 font-mono block mt-0.5 truncate">tech.elec@srmist.edu.in</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('estate.admin@srmist.edu.in', 'AdminPass123!')}
                className="p-2 text-left rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/60 transition"
              >
                <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                  <Shield className="w-3.5 h-3.5 text-amber-800" />
                  <span>Estate Admin</span>
                </div>
                <span className="text-[10px] text-stone-500 font-mono block mt-0.5 truncate">estate.admin@srmist.edu.in</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
