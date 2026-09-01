import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Trash2, 
  FileCheck, 
  AlertTriangle, 
  EyeOff, 
  Cpu, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { store } from '../services/store';

export const PrivacySecurityView: React.FC = () => {
  const [retentionDays, setRetentionDays] = useState('7');
  const [purgedMsg, setPurgedMsg] = useState(false);

  const handlePurgeAllData = () => {
    if (confirm('This will wipe all locally stored applications, audit history, and cached metadata. Proceed?')) {
      store.clearData();
      setPurgedMsg(true);
      setTimeout(() => setPurgedMsg(false), 3000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Security, Privacy & Data Isolation</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Our core architecture is designed around zero-retention principles for proprietary iOS intellectual property.
            </p>
          </div>
        </div>
      </div>

      {/* Security Architecture Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs font-mono">
            <EyeOff className="h-4 w-4" />
            <span>Ephemeral Binary Processing</span>
          </div>
          <h3 className="font-bold text-slate-900 text-sm">In-Memory Static Analysis Only</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Uploaded <code className="text-blue-600 font-mono">.ipa</code> and zip packages are decompressed in volatile memory. Binaries are never written to permanent disk storage or shared.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs font-mono">
            <Cpu className="h-4 w-4" />
            <span>Zero AI Model Training</span>
          </div>
          <h3 className="font-bold text-slate-900 text-sm">No LLM Training on Developer Code</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your Swift code, bundle identifiers, and Info.plist metadata are strictly isolated and never ingested into public training sets or shared across developers.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs font-mono">
            <Lock className="h-4 w-4" />
            <span>No Public Share Links</span>
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Access Control & Session Isolation</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Audit results and submission readiness reports remain accessible exclusively to your authenticated account session.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs font-mono">
            <Trash2 className="h-4 w-4" />
            <span>One-Click Permanent Deletion</span>
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Immediate Data Purge</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Deleting an application immediately erases all associated audit logs, extracted metadata, and recorded notes.
          </p>
        </div>

      </div>

      {/* Retention Settings & Danger Zone */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900 font-display">Retention & Data Management</h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
          <div>
            <div className="font-bold text-slate-900">Auto-Delete Uploaded Build Artifacts</div>
            <div className="text-slate-500 text-[11px] mt-0.5">Automatically clear extracted inspection payloads after:</div>
          </div>
          <select
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-mono cursor-pointer"
          >
            <option value="1">24 Hours</option>
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
            <option value="0">Immediately after audit</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-red-600 text-xs font-mono">Danger Zone: Wipe Local App Data</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Reset all application records, audits, and custom notes back to fresh demo baseline.
            </p>
          </div>

          <button
            onClick={handlePurgeAllData}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 text-xs font-bold font-mono transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Purge All Local Data</span>
          </button>
        </div>

        {purgedMsg && (
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Local data purged and reset successfully.</span>
          </div>
        )}
      </div>

    </div>
  );
};
