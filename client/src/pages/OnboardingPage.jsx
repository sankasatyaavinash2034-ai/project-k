import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, ShieldCheck, CreditCard, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export function OnboardingPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.profile?.fullName || user?.name || '',
    registrationNumber: user?.profile?.registrationNumber || '',
    rollNumber: user?.profile?.rollNumber || '',
    phoneNumber: user?.profile?.phoneNumber || '',
    paymentReference: user?.profile?.paymentReference || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.fullName.trim()) return setErrorMsg('Full Name is required.');
    if (!formData.registrationNumber.trim()) return setErrorMsg('Registration Number is required.');
    if (!formData.rollNumber.trim()) return setErrorMsg('Roll Number is required.');
    if (!formData.phoneNumber.trim()) return setErrorMsg('Phone Number is required.');

    try {
      setSubmitting(true);
      await updateProfile(formData);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Liquid Light Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-xl w-full bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/80 relative z-10">
        {/* Specular Top Edge */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-red-600 to-red-700 flex items-center justify-center text-white shadow-xl shadow-red-600/30 ring-1 ring-white/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
              Complete Profile <Sparkles className="w-4 h-4 text-amber-400" />
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Step 1 of 2 — Required for Event Registration & Round Access
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/70 border border-red-500/40 rounded-2xl backdrop-blur-md flex items-start gap-3 text-red-300 text-xs">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-300">Validation Error</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Tony Stark"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20 backdrop-blur-md transition duration-150"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Registration Number */}
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                Reg Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="e.g. REG-2026-9042"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20 backdrop-blur-md transition duration-150 font-mono"
                required
              />
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                Roll Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                placeholder="e.g. 21CS8045"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20 backdrop-blur-md transition duration-150 font-mono"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20 backdrop-blur-md transition duration-150 font-mono"
              required
            />
          </div>

          {/* Payment Reference */}
          <div className="pt-3 border-t border-white/10">
            <label className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
              <CreditCard className="w-4 h-4 text-amber-400" />
              Event Payment Reference / UPI Ref ID (Optional)
            </label>
            <input
              type="text"
              name="paymentReference"
              value={formData.paymentReference}
              onChange={handleChange}
              placeholder="e.g. UPI-9988221100 or TXN-40291"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 backdrop-blur-md transition duration-150 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Enter your UPI transaction reference ID if required by your event organizers.
            </p>
          </div>

          {/* Submit Action Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-red-600 via-red-700 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-xl shadow-red-600/30 border border-white/20 active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving Profile...
                </>
              ) : (
                <>
                  Save Profile & Continue to Dashboard <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified profile records persist in MongoDB Atlas Cloud.
        </p>
      </div>
    </div>
  );
}
