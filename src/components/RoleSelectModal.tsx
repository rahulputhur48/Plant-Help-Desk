import React from 'react';
import { Shield, Monitor, CheckCircle, ArrowRight } from 'lucide-react';
import { PLANT_LINES } from '../constants/initialData';

interface RoleSelectModalProps {
  isOpen: boolean;
  currentRole: string | null;
  onSelectRole: (role: string) => void;
  onClose?: () => void;
  isInitialSetup?: boolean;
}

export const RoleSelectModal: React.FC<RoleSelectModalProps> = ({
  isOpen,
  currentRole,
  onSelectRole,
  onClose,
  isInitialSetup = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-red-600/20 border border-red-500/40 rounded-2xl text-red-400 mb-1">
            <Monitor className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Select Computer Setup
          </h2>
          <p className="text-xs text-slate-400">
            Choose whether this computer is for the <strong className="text-white">Admin</strong> or one of the <strong className="text-white">5 Production Lines</strong>:
          </p>
        </div>

        {/* Options List */}
        <div className="space-y-2.5">
          {/* Admin Option */}
          <button
            onClick={() => onSelectRole('admin')}
            className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
              currentRole === 'admin'
                ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/50 text-white'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Admin</span>
                  <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    Supervisor
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Monitors all 5 lines, receives alarm notifications & calls
                </div>
              </div>
            </div>
            {currentRole === 'admin' ? (
              <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
            )}
          </button>

          {/* Section Divider */}
          <div className="pt-2 pb-1 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 px-1">
            Production Lines (1 - 5)
          </div>

          {/* Line 1 - 5 Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PLANT_LINES.map((line) => {
              const isSelected = currentRole === line.id;
              return (
                <button
                  key={line.id}
                  onClick={() => onSelectRole(line.id)}
                  className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-red-950/60 border-red-500 ring-2 ring-red-500/50 text-white'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center font-black text-sm shrink-0">
                      {line.number}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-white truncate">
                        {line.name}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800">
          <span>Saved on this computer</span>
          {!isInitialSetup && onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
