import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Wrench,
  Package,
  Search,
  ShieldAlert,
  HelpCircle,
  Check,
  Trash2,
  Keyboard,
  Zap,
  Megaphone,
  MessageSquare,
} from 'lucide-react';
import { PlantCall, PlantLine, CallReason } from '../types';
import { PlantAnnouncement, PlantDirectMessage } from '../services/plantSync';

interface LineViewProps {
  line: PlantLine;
  activeCall: PlantCall | undefined;
  onCallAdmin: (reason: CallReason, note: string) => void;
  onCancelCall: (callId: string) => void;
  onResolveCall: (callId: string) => void;
  onClearLineHistory: () => void;
  recentLineCalls: PlantCall[];
  activeAnnouncement?: PlantAnnouncement | null;
  onDismissAnnouncement?: () => void;
  activeDirectMessage?: PlantDirectMessage | null;
  onDismissDirectMessage?: () => void;
}

const REASONS: { id: CallReason; label: string; shortcutKey: string; icon: any; color: string }[] = [
  { id: 'BREAKDOWN', label: 'Machine Breakdown / Jam', shortcutKey: '1', icon: Wrench, color: 'hover:border-red-500 hover:bg-red-950/40 text-red-400' },
  { id: 'MATERIAL', label: 'Material Shortage', shortcutKey: '2', icon: Package, color: 'hover:border-amber-500 hover:bg-amber-950/40 text-amber-400' },
  { id: 'QUALITY', label: 'Quality / Inspection', shortcutKey: '3', icon: Search, color: 'hover:border-blue-500 hover:bg-blue-950/40 text-blue-400' },
  { id: 'SAFETY', label: 'Safety Hazard / Stop', shortcutKey: '4', icon: ShieldAlert, color: 'hover:border-rose-500 hover:bg-rose-950/40 text-rose-400' },
  { id: 'GENERAL', label: 'General Help Needed', shortcutKey: '5', icon: HelpCircle, color: 'hover:border-slate-500 hover:bg-slate-800/40 text-slate-300' },
];

export const LineView: React.FC<LineViewProps> = ({
  line,
  activeCall,
  onCallAdmin,
  onCancelCall,
  onResolveCall,
  onClearLineHistory,
  recentLineCalls,
  activeAnnouncement,
  onDismissAnnouncement,
  activeDirectMessage,
  onDismissDirectMessage,
}) => {
  const [selectedReason, setSelectedReason] = useState<CallReason>('GENERAL');
  const [quickNote, setQuickNote] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [confirmClearLine, setConfirmClearLine] = useState(false);
  const [isSpaceActive, setIsSpaceActive] = useState(false);

  // Global Keyboard Shortcuts for Hands-Free Emergency Signaling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      // ESC: If input is focused, blur it. If in CALLING state, cancel call.
      if (e.key === 'Escape') {
        if (isInputFocused && target) {
          target.blur();
          return;
        }
        if (activeCall && activeCall.status === 'CALLING') {
          e.preventDefault();
          onCancelCall(activeCall.id);
          return;
        }
      }

      // If user is actively typing in a text field, do not hijack space or number keys
      if (isInputFocused) return;

      // Space or Enter: Hands-free trigger or resolve
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault(); // Prevent page scroll
        setIsSpaceActive(true);
        setTimeout(() => setIsSpaceActive(false), 250);

        if (!activeCall || activeCall.status === 'RESOLVED') {
          // Trigger emergency help call
          onCallAdmin(selectedReason, quickNote.trim());
          setQuickNote('');
        } else if (activeCall.status === 'ACKNOWLEDGED') {
          // Resolve call
          onResolveCall(activeCall.id);
        }
        return;
      }

      // Quick reason selection via 1-5 keys
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const keyMap: Record<string, CallReason> = {
          '1': 'BREAKDOWN',
          '2': 'MATERIAL',
          '3': 'QUALITY',
          '4': 'SAFETY',
          '5': 'GENERAL',
        };
        const mapped = keyMap[e.key];
        if (mapped) {
          e.preventDefault();
          setSelectedReason(mapped);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        setIsSpaceActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeCall, selectedReason, quickNote, onCallAdmin, onCancelCall, onResolveCall]);

  // Auto reset clear confirmation after 4 seconds
  useEffect(() => {
    if (confirmClearLine) {
      const timer = setTimeout(() => setConfirmClearLine(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [confirmClearLine]);

  const handleClearLineClick = () => {
    if (!confirmClearLine) {
      setConfirmClearLine(true);
    } else {
      onClearLineHistory();
      setConfirmClearLine(false);
    }
  };

  // Timer for active call
  useEffect(() => {
    if (!activeCall || activeCall.status === 'RESOLVED') {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(activeCall.timestamp).getTime();
    const update = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeCall]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCallClick = () => {
    onCallAdmin(selectedReason, quickNote.trim());
    setQuickNote('');
  };

  const isCalling = activeCall && activeCall.status === 'CALLING';
  const isAcknowledged = activeCall && activeCall.status === 'ACKNOWLEDGED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Line Indicator Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-black text-xl">
            {line.number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {line.name}
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Production Line
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400">
            Status: <span className={isCalling ? 'text-red-400 font-bold' : isAcknowledged ? 'text-blue-400 font-bold' : 'text-emerald-400 font-bold'}>
              {isCalling ? 'Calling Admin' : isAcknowledged ? 'Admin On Way' : 'Normal Operations'}
            </span>
          </div>
        </div>
      </div>

      {/* Direct Individual Message from Admin specifically to this Line */}
      {activeDirectMessage && (() => {
        const msgText = activeDirectMessage.message.toLowerCase();
        const isStop = msgText.includes('stop scanning');
        const isStart = msgText.includes('start scanning');
        const isServerDown = msgText.includes('server down');
        const isWait = msgText.includes('wait') && !isServerDown;

        const containerStyle = isStop
          ? 'bg-gradient-to-r from-red-600/40 via-red-950/70 to-red-600/40 border-2 border-red-500 shadow-2xl shadow-red-950/80 ring-2 ring-red-500/50'
          : isStart
          ? 'bg-gradient-to-r from-emerald-600/40 via-emerald-950/70 to-emerald-600/40 border-2 border-emerald-500 shadow-2xl shadow-emerald-950/80 ring-2 ring-emerald-500/50'
          : isServerDown
          ? 'bg-gradient-to-r from-purple-600/40 via-purple-950/70 to-red-600/40 border-2 border-purple-500 shadow-2xl shadow-purple-950/80 ring-2 ring-purple-500/50'
          : isWait
          ? 'bg-gradient-to-r from-amber-600/40 via-amber-950/70 to-amber-600/40 border-2 border-amber-500 shadow-2xl shadow-amber-950/80 ring-2 ring-amber-500/50'
          : 'bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-blue-500/30 border-2 border-blue-500 shadow-2xl';

        const badgeBg = isStop
          ? 'bg-red-600 text-white'
          : isStart
          ? 'bg-emerald-600 text-white'
          : isServerDown
          ? 'bg-purple-600 text-white'
          : isWait
          ? 'bg-amber-500 text-slate-950'
          : 'bg-blue-500 text-white';

        const iconBg = isStop
          ? 'bg-red-600'
          : isStart
          ? 'bg-emerald-600'
          : isServerDown
          ? 'bg-purple-600'
          : isWait
          ? 'bg-amber-500 text-slate-950'
          : 'bg-blue-600';

        const buttonBg = isStop
          ? 'bg-red-600 hover:bg-red-500'
          : isStart
          ? 'bg-emerald-600 hover:bg-emerald-500'
          : isServerDown
          ? 'bg-purple-600 hover:bg-purple-500'
          : isWait
          ? 'bg-amber-600 hover:bg-amber-500'
          : 'bg-blue-600 hover:bg-blue-500';

        return (
          <div className={`${containerStyle} rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-4 animate-pulse`}>
            <div className="flex items-start gap-3.5">
              <div className={`p-3 ${iconBg} text-white rounded-xl shrink-0 mt-0.5 shadow-lg`}>
                {isStop ? (
                  <span className="text-2xl leading-none">🛑</span>
                ) : isStart ? (
                  <span className="text-2xl leading-none">✅</span>
                ) : isServerDown ? (
                  <span className="text-2xl leading-none">⚠️</span>
                ) : isWait ? (
                  <span className="text-2xl leading-none">⏳</span>
                ) : (
                  <MessageSquare className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded font-black text-[10px] font-mono uppercase tracking-wider shadow-sm ${badgeBg}`}>
                    DIRECT INSTRUCTION FOR {line.name.toUpperCase()}
                  </span>
                  {activeDirectMessage.formattedTime && (
                    <span className="text-[11px] text-slate-300 font-mono font-bold">
                      Sent at {activeDirectMessage.formattedTime}
                    </span>
                  )}
                </div>
                <p className="text-lg sm:text-2xl font-black text-white mt-1.5 leading-snug break-words tracking-tight">
                  "{activeDirectMessage.message}"
                </p>
              </div>
            </div>
            {onDismissDirectMessage && (
              <button
                onClick={onDismissDirectMessage}
                className={`px-4 py-2 rounded-xl ${buttonBg} text-white font-black text-xs cursor-pointer shrink-0 transition shadow-lg`}
              >
                Acknowledge / Dismiss
              </button>
            )}
          </div>
        );
      })()}

      {/* Broadcast Announcement Alert Card for this Line */}
      {activeAnnouncement && (() => {
        const msgText = activeAnnouncement.message.toLowerCase();
        const isStop = msgText.includes('stop scanning');
        const isStart = msgText.includes('start scanning');
        const isServerDown = msgText.includes('server down');
        const isWait = msgText.includes('wait') && !isServerDown;

        const borderStyle = isStop
          ? 'border-red-500 bg-red-950/60'
          : isStart
          ? 'border-emerald-500 bg-emerald-950/60'
          : isServerDown
          ? 'border-purple-500 bg-purple-950/60'
          : 'border-amber-500/70 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-yellow-500/20';

        return (
          <div className={`${borderStyle} border-2 rounded-2xl p-4 shadow-xl flex items-start justify-between gap-3 animate-pulse`}>
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shrink-0 mt-0.5 shadow-md">
                {isStop ? <span>🛑</span> : isStart ? <span>✅</span> : isServerDown ? <span>⚠️</span> : <Megaphone className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] font-mono uppercase tracking-wider">
                    ADMIN BROADCAST TO ALL LINES
                  </span>
                  {activeAnnouncement.formattedTime && (
                    <span className="text-[11px] text-amber-300/80 font-mono">
                      {activeAnnouncement.formattedTime}
                    </span>
                  )}
                </div>
                <p className="text-base sm:text-lg font-black text-white mt-1 leading-snug">
                  "{activeAnnouncement.message}"
                </p>
              </div>
            </div>
            {onDismissAnnouncement && (
              <button
                onClick={onDismissAnnouncement}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-amber-200 border border-amber-500/40 cursor-pointer shrink-0 transition"
              >
                Dismiss
              </button>
            )}
          </div>
        );
      })()}

      {/* Hands-Free Shortcut Helper Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <div className="p-1.5 bg-red-500/20 text-red-400 rounded-lg">
            <Keyboard className="w-3.5 h-3.5" />
          </div>
          <span className="uppercase tracking-wider text-[11px]">Hands-Free Hotkeys:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <kbd className={`px-2 py-0.5 rounded font-black text-xs shadow-sm transition ${
              isSpaceActive ? 'bg-red-500 text-white scale-110 ring-2 ring-red-400' : 'bg-slate-800 border border-slate-700 text-amber-300'
            }`}>SPACE</kbd>
            <span className="text-slate-300">Trigger Help Call</span>
          </span>

          <span className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-blue-300 font-bold text-xs shadow-sm">1 - 5</kbd>
            <span className="text-slate-300">Select Reason</span>
          </span>

          <span className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-rose-300 font-bold text-xs shadow-sm">ESC</kbd>
            <span className="text-slate-300">Cancel Call</span>
          </span>
        </div>
      </div>

      {/* STATE 1: CALLING - Waiting for Admin */}
      {isCalling && (
        <div className="bg-gradient-to-b from-red-950/80 via-slate-900 to-slate-950 border-2 border-red-500 rounded-3xl p-8 sm:p-12 text-center shadow-2xl shadow-red-950/80 animate-pulse-border">
          <div className="inline-flex p-4 bg-red-600 rounded-full text-white shadow-xl shadow-red-600/50 mb-4 animate-bounce">
            <Bell className="w-12 h-12" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <div className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-red-400 text-xs font-mono font-bold uppercase tracking-wider">
              Help Request Sent
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              CALLING ADMIN...
            </h1>
            <p className="text-base text-red-300">
              Alarm sound & visual alert sent to <strong className="text-white">Admin</strong>.
            </p>
          </div>

          {/* Reason Badge */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-red-800/80 text-sm font-semibold text-white">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Reason: {activeCall.reasonLabel}</span>
            {activeCall.message && (
              <span className="text-slate-400 font-normal ml-2 italic">"{activeCall.message}"</span>
            )}
          </div>

          {/* Time Elapsed */}
          <div className="mt-6 flex items-center justify-center gap-2 text-red-400 font-mono text-xl font-bold">
            <Clock className="w-5 h-5 animate-spin text-red-400" />
            <span>Calling for {formatTimer(elapsedSeconds)}</span>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => onCancelCall(activeCall.id)}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-slate-400" />
              <span>Cancel Call</span>
              <kbd className="ml-1 text-[10px] px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono text-slate-400">ESC</kbd>
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: ACKNOWLEDGED - Admin is on the way! */}
      {isAcknowledged && (
        <div className="bg-gradient-to-b from-blue-950/80 via-slate-900 to-slate-950 border-2 border-blue-500 rounded-3xl p-8 sm:p-12 text-center shadow-2xl shadow-blue-950/80">
          <div className="inline-flex p-4 bg-blue-600 rounded-full text-white shadow-xl shadow-blue-600/50 mb-4">
            <CheckCircle2 className="w-12 h-12 animate-pulse" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <div className="inline-block px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full text-blue-400 text-xs font-mono font-bold uppercase tracking-wider">
              Admin Responding
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ADMIN IS ON THE WAY!
            </h1>
            <p className="text-base text-blue-200">
              Acknowledged by <strong className="text-white">Admin</strong> at{' '}
              {activeCall.acknowledgedAt
                ? new Date(activeCall.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now'}.
            </p>
          </div>

          <div className="mt-6 inline-block bg-slate-950/90 border border-blue-800/80 px-4 py-2.5 rounded-xl text-sm text-slate-300">
            Admin has been notified for: <strong className="text-white">{activeCall.reasonLabel}</strong>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => onResolveCall(activeCall.id)}
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-950/60 transition flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>Issue Resolved / Clear Line</span>
              <kbd className="ml-1.5 text-[10px] px-2 py-0.5 bg-emerald-950/80 border border-emerald-400/50 rounded font-mono text-emerald-200">SPACE</kbd>
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: NORMAL - Big "CALL ADMIN" Button */}
      {!isCalling && !isAcknowledged && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          {/* Main Huge Single Call Button */}
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">
              Press Button or Hit Spacebar for Help
            </p>

            <button
              onClick={handleCallClick}
              className={`group relative w-full sm:w-80 sm:h-80 mx-auto aspect-square rounded-full bg-gradient-to-br from-red-600 via-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-2xl shadow-red-900/80 active:scale-95 transition duration-150 flex flex-col items-center justify-center p-6 border-4 border-red-400/40 cursor-pointer select-none ${
                isSpaceActive ? 'scale-95 ring-4 ring-red-400 shadow-red-500' : ''
              }`}
            >
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-25 pointer-events-none" />

              <div className="p-4 bg-white/10 rounded-full mb-3 group-hover:scale-110 transition duration-200">
                <Bell className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md text-white" />
              </div>

              <span className="text-2xl sm:text-3xl font-black tracking-tight uppercase leading-none drop-shadow">
                CALL ADMIN
              </span>
              <span className="text-xs sm:text-sm font-semibold opacity-90 mt-2 tracking-wide text-red-100">
                PRESS FOR HELP
              </span>

              {/* Hands-Free Spacebar Badge */}
              <div className="mt-3 flex items-center gap-1.5 px-3.5 py-1 bg-black/40 rounded-full border border-red-400/40 text-[11px] font-mono text-red-100 shadow-inner">
                <kbd className="px-2 py-0.5 rounded bg-red-950 border border-red-400/60 font-black text-amber-300 text-[10px]">SPACEBAR</kbd>
                <span className="font-semibold">Hit Space to Call</span>
              </div>

              <span className="text-xs font-mono text-red-200 mt-2 bg-black/20 px-3 py-0.5 rounded-full">
                {line.name}
              </span>
            </button>
          </div>

          {/* Quick Reason Selection (Optional 1-tap categorization) */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Reason for Help:</span>
              <span className="text-slate-500">Selected: {REASONS.find(r => r.id === selectedReason)?.label}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReason(r.id)}
                    className={`p-3 pt-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center relative ${
                      isSelected
                        ? 'bg-red-950/60 border-red-500 text-white shadow-md ring-1 ring-red-500'
                        : `bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white ${r.color}`
                    }`}
                  >
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-mono px-1 rounded bg-black/50 border border-slate-800 text-slate-400">
                      {r.shortcutKey}
                    </span>
                    <Icon className="w-4 h-4 mt-1" />
                    <span className="truncate w-full">{r.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Optional Note input */}
            <div className="pt-2">
              <input
                type="text"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Optional short note (e.g. Conveyor belt stopped, need materials...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Recent Calls Log for this Line */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Recent {line.name} Activity</span>
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 hidden sm:inline">Live Line Log</span>
            {recentLineCalls.length > 0 && (
              confirmClearLine ? (
                <button
                  onClick={handleClearLineClick}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold border border-red-400 flex items-center gap-1 cursor-pointer animate-pulse"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Click to Confirm Clear</span>
                </button>
              ) : (
                <button
                  onClick={handleClearLineClick}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800 flex items-center gap-1 cursor-pointer transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              )
            )}
          </div>
        </div>

        {recentLineCalls.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">
            No recent calls. Line is operating smoothly.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 text-xs">
            {recentLineCalls.slice(0, 4).map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      c.status === 'CALLING'
                        ? 'bg-red-500 animate-ping'
                        : c.status === 'ACKNOWLEDGED'
                        ? 'bg-blue-400'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-white">{c.reasonLabel}</span>
                    {c.message && <span className="text-slate-400 ml-2 italic text-[11px] truncate">"{c.message}"</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
                  <span>{c.formattedTime || new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono uppercase text-[10px] ${
                      c.status === 'CALLING'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : c.status === 'ACKNOWLEDGED'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
