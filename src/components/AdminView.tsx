import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Bell,
  CheckCircle2,
  Clock,
  Radio,
  Volume2,
  VolumeX,
  Check,
  Send,
  Layers,
  Trash2,
  MessageSquare,
  X,
  Sparkles,
} from 'lucide-react';
import { PlantCall, PlantLine } from '../types';
import { PLANT_LINES } from '../constants/initialData';
import { PlantDirectMessage } from '../services/plantSync';

interface AdminViewProps {
  allCalls: PlantCall[];
  onAcknowledgeCall: (callId: string) => void;
  onResolveCall: (callId: string) => void;
  onBroadcastMessage: (message: string) => void;
  onClearHistory: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTestSound: () => void;
  directMessages?: Record<string, PlantDirectMessage>;
  onSendDirectMessage?: (lineId: string, message: string) => void;
  onDismissDirectMessage?: (lineId: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  allCalls,
  onAcknowledgeCall,
  onResolveCall,
  onBroadcastMessage,
  onClearHistory,
  soundEnabled,
  onToggleSound,
  onTestSound,
  directMessages = {},
  onSendDirectMessage,
  onDismissDirectMessage,
}) => {
  const [broadcastText, setBroadcastText] = useState('');
  const [nowTime, setNowTime] = useState(Date.now());
  const [confirmClear, setConfirmClear] = useState(false);
  const [openMessageLineId, setOpenMessageLineId] = useState<string | null>(null);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const toggleMessageInput = (lineId: string) => {
    setOpenMessageLineId((prev) => (prev === lineId ? null : lineId));
  };

  const handleSendDirect = (lineId: string, text: string) => {
    if (!text.trim() || !onSendDirectMessage) return;
    onSendDirectMessage(lineId, text.trim());
    setOpenMessageLineId(null);
  };

  const handleSendCustom = (lineId: string) => {
    const text = customInputs[lineId] || '';
    if (!text.trim() || !onSendDirectMessage) return;
    onSendDirectMessage(lineId, text.trim());
    setCustomInputs((prev) => ({ ...prev, [lineId]: '' }));
    setOpenMessageLineId(null);
  };

  // Auto reset clear confirmation after 4 seconds
  useEffect(() => {
    if (confirmClear) {
      const timer = setTimeout(() => setConfirmClear(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [confirmClear]);

  const handleClearHistoryClick = () => {
    if (!confirmClear) {
      setConfirmClear(true);
    } else {
      onClearHistory();
      setConfirmClear(false);
    }
  };

  // Update timer every second for calling durations
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter calls
  const callingCalls = allCalls.filter((c) => c.status === 'CALLING');
  const acknowledgedCalls = allCalls.filter((c) => c.status === 'ACKNOWLEDGED');

  const getCallingDuration = (timestamp: string) => {
    const diff = Math.max(0, Math.floor((nowTime - new Date(timestamp).getTime()) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    onBroadcastMessage(broadcastText.trim());
    setBroadcastText('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Urgent Alert Banner if ANY Line is Calling Admin */}
      {callingCalls.length > 0 && (
        <div className="bg-red-600 border-2 border-red-400 text-white rounded-2xl p-4 sm:p-5 shadow-2xl shadow-red-950/80 animate-pulse flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-black/30 rounded-xl text-white shrink-0">
              <Bell className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase bg-black/40 px-2 py-0.5 rounded font-black tracking-wider">
                  ACTION REQUIRED
                </span>
                <span className="text-sm font-bold text-red-100">
                  {callingCalls.length} {callingCalls.length === 1 ? 'Line' : 'Lines'} Calling for Help!
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                {callingCalls.map((c) => `${c.lineName} (${c.reasonLabel})`).join(', ')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {callingCalls.map((call) => (
              <button
                key={call.id}
                onClick={() => onAcknowledgeCall(call.id)}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-red-700 font-extrabold rounded-xl shadow text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition"
              >
                <Check className="w-4 h-4" />
                <span>Acknowledge {call.lineName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Admin Quick Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600/20 border border-red-500/40 rounded-xl text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Admin Control
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Monitoring Production Lines 1 - 5
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle & Test */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Alarm Sound: ON' : 'Alarm Sound: MUTED'}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'bg-red-950/40 text-red-400 border-red-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Siren ON' : 'Muted'}</span>
          </button>

          <button
            onClick={onTestSound}
            title="Test alarm tone"
            className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition cursor-pointer"
          >
            Test Alarm
          </button>
        </div>
      </div>

      {/* 5 Plant Lines Grid (SCADA / Overview Board) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Production Lines (5 Lines)</span>
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Normal
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" /> Calling
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Responding
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {PLANT_LINES.map((line) => {
            // Find active call for this line
            const activeCall = allCalls.find(
              (c) => c.lineId === line.id && (c.status === 'CALLING' || c.status === 'ACKNOWLEDGED')
            );

            const isCalling = activeCall?.status === 'CALLING';
            const isAcknowledged = activeCall?.status === 'ACKNOWLEDGED';

            return (
              <div
                key={line.id}
                className={`rounded-2xl p-4 border transition flex flex-col justify-between shadow-lg relative overflow-hidden ${
                  isCalling
                    ? 'bg-red-950/70 border-red-500 shadow-red-950/80 ring-2 ring-red-500/60'
                    : isAcknowledged
                    ? 'bg-blue-950/60 border-blue-500 shadow-blue-950/80'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Line Card Header */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isCalling
                            ? 'bg-red-500 animate-ping'
                            : isAcknowledged
                            ? 'bg-blue-400'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <h4 className="text-sm font-extrabold text-white">
                        {line.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleMessageInput(line.id)}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          openMessageLineId === line.id
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                            : directMessages[line.id]
                            ? 'bg-blue-950/90 text-blue-300 border-blue-500/50 hover:bg-blue-900/60'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                        }`}
                        title={`Individual message to ${line.name}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        {directMessages[line.id] && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                        )}
                      </button>

                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                          isCalling
                            ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                            : isAcknowledged
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {isCalling ? 'CALLING' : isAcknowledged ? 'ON WAY' : 'OK'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Direct Message for this specific line */}
                {directMessages[line.id] && openMessageLineId !== line.id && (() => {
                  const msgText = directMessages[line.id].message.toLowerCase();
                  const isStop = msgText.includes('stop scanning');
                  const isStart = msgText.includes('start scanning');
                  const isServerDown = msgText.includes('server down');
                  const isWait = msgText.includes('wait') && !isServerDown;

                  const cardStyle = isStop
                    ? 'bg-red-950/80 border-red-500/80 text-red-100 shadow-red-950/50'
                    : isStart
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-100 shadow-emerald-950/50'
                    : isServerDown
                    ? 'bg-purple-950/80 border-purple-500/80 text-purple-100 shadow-purple-950/50'
                    : isWait
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-100 shadow-amber-950/50'
                    : 'bg-blue-950/70 border-blue-500/40 text-blue-100';

                  const badgeColor = isStop
                    ? 'text-red-300'
                    : isStart
                    ? 'text-emerald-300'
                    : isServerDown
                    ? 'text-purple-300'
                    : isWait
                    ? 'text-amber-300'
                    : 'text-blue-300';

                  return (
                    <div className={`my-2.5 p-2.5 rounded-xl border text-xs shadow-inner transition ${cardStyle}`}>
                      <div className="flex items-center justify-between text-[10px] opacity-90 font-mono">
                        <span className={`flex items-center gap-1 font-bold ${badgeColor}`}>
                          <Send className="w-3 h-3" /> Note to {line.name}:
                        </span>
                        {directMessages[line.id].formattedTime && (
                          <span className="opacity-80">{directMessages[line.id].formattedTime}</span>
                        )}
                      </div>
                      <p className="text-white text-xs font-bold mt-1.5 break-words leading-relaxed flex items-center gap-1.5">
                        {isStop && <span>🛑</span>}
                        {isStart && <span>✅</span>}
                        {isServerDown && <span>⚠️</span>}
                        {isWait && <span>⏳</span>}
                        <span>"{directMessages[line.id].message}"</span>
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10 text-[10px]">
                        <button
                          onClick={() => toggleMessageInput(line.id)}
                          className="text-white/80 hover:text-white font-bold cursor-pointer underline"
                        >
                          Change
                        </button>
                        {onDismissDirectMessage && (
                          <button
                            onClick={() => onDismissDirectMessage(line.id)}
                            className="text-white/60 hover:text-red-300 font-medium cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Individual Message Composer (Expands inline in card) */}
                {openMessageLineId === line.id && (
                  <div className="my-2.5 p-3 rounded-xl bg-slate-950 border border-blue-500/70 text-xs space-y-2.5 shadow-xl animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-blue-600/20 text-blue-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-extrabold text-white text-xs">
                          Message {line.name}
                        </span>
                      </div>
                      <button
                        onClick={() => setOpenMessageLineId(null)}
                        className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
                        title="Close"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick 1-tap presets for this line */}
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">Quick Presets:</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { text: 'Please wait', color: 'bg-amber-950/70 hover:bg-amber-600 border-amber-600/50 text-amber-200 hover:text-white', icon: '⏳' },
                          { text: 'Please stop scanning', color: 'bg-red-950/70 hover:bg-red-600 border-red-600/50 text-red-200 hover:text-white', icon: '🛑' },
                          { text: 'You can start scanning', color: 'bg-emerald-950/70 hover:bg-emerald-600 border-emerald-600/50 text-emerald-200 hover:text-white', icon: '✅' },
                          { text: 'Server down please wait', color: 'bg-purple-950/70 hover:bg-purple-600 border-purple-600/50 text-purple-200 hover:text-white', icon: '⚠️' },
                        ].map((preset) => (
                          <button
                            key={preset.text}
                            type="button"
                            onClick={() => handleSendDirect(line.id, preset.text)}
                            className={`text-[10px] px-2 py-1.5 rounded-lg border transition cursor-pointer text-left font-semibold flex items-center gap-1.5 ${preset.color}`}
                          >
                            <span>{preset.icon}</span>
                            <span className="truncate">{preset.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Message Input */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <input
                        type="text"
                        value={customInputs[line.id] || ''}
                        onChange={(e) => setCustomInputs((prev) => ({ ...prev, [line.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendCustom(line.id);
                          }
                        }}
                        placeholder={`Type note to ${line.name}...`}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSendCustom(line.id)}
                        disabled={!customInputs[line.id]?.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition shadow-md shadow-blue-600/30 flex items-center justify-center cursor-pointer shrink-0"
                        title="Send message"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Call Alert Information inside card */}
                {activeCall && (
                  <div className="my-3 pt-3 border-t border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span className="text-amber-400 truncate">{activeCall.reasonLabel}</span>
                    </div>

                    {activeCall.message && (
                      <p className="text-[11px] text-slate-300 italic line-clamp-2 bg-black/30 p-1.5 rounded">
                        "{activeCall.message}"
                      </p>
                    )}

                    <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1">
                      <span>Elapsed:</span>
                      <strong className={isCalling ? 'text-red-400 font-bold' : 'text-blue-400'}>
                        {getCallingDuration(activeCall.timestamp)}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 space-y-1.5">
                  {isCalling && (
                    <button
                      onClick={() => onAcknowledgeCall(activeCall.id)}
                      className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>On My Way</span>
                    </button>
                  )}

                  {isAcknowledged && (
                    <button
                      onClick={() => onResolveCall(activeCall.id)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}

                  {!activeCall && openMessageLineId !== line.id && !directMessages[line.id] && (
                    <button
                      onClick={() => toggleMessageInput(line.id)}
                      className="w-full py-1.5 px-2 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>Message {line.name}</span>
                    </button>
                  )}

                  {!activeCall && (openMessageLineId === line.id || directMessages[line.id]) && (
                    <div className="text-center py-0.5 text-[10px] text-emerald-400 font-medium">
                      Operating Normally
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Broadcast Message to All 5 Lines */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Broadcast Announcement to All 5 Lines</span>
          </h3>
          <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Alerts all 5 lines + desktop popup
          </span>
        </div>

        {/* Quick Announcement Presets */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { text: 'Please wait', color: 'bg-amber-950/60 hover:bg-amber-600 text-amber-200 hover:text-white border-amber-600/40', icon: '⏳' },
            { text: 'Please stop scanning', color: 'bg-red-950/60 hover:bg-red-600 text-red-200 hover:text-white border-red-600/40', icon: '🛑' },
            { text: 'You can start scanning', color: 'bg-emerald-950/60 hover:bg-emerald-600 text-emerald-200 hover:text-white border-emerald-600/40', icon: '✅' },
            { text: 'Server down please wait', color: 'bg-purple-950/60 hover:bg-purple-600 text-purple-200 hover:text-white border-purple-600/40', icon: '⚠️' },
          ].map((preset) => (
            <button
              key={preset.text}
              type="button"
              onClick={() => setBroadcastText(preset.text)}
              className={`text-[11px] px-3 py-1.5 rounded-lg border transition cursor-pointer font-semibold flex items-center gap-1.5 ${preset.color}`}
            >
              <span>{preset.icon}</span>
              <span>{preset.text}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSendBroadcast} className="flex gap-2">
          <input
            type="text"
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="Type plant announcement to broadcast to all line operators..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast</span>
          </button>
        </form>
      </div>

      {/* Call History Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Plant Help Call History</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Log of calls, response times, and resolutions
            </p>
          </div>

          {confirmClear ? (
            <button
              onClick={handleClearHistoryClick}
              className="text-xs px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold border border-red-400 flex items-center gap-1.5 cursor-pointer transition animate-pulse"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Click to Confirm Clear All</span>
            </button>
          ) : (
            <button
              onClick={handleClearHistoryClick}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800 flex items-center gap-1.5 cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Line</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Details</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allCalls.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-slate-400 text-[11px]">
                    {c.formattedTime || new Date(c.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3 font-bold text-white">{c.lineName}</td>
                  <td className="p-3 font-semibold text-amber-400">{c.reasonLabel}</td>
                  <td className="p-3 text-slate-400 max-w-xs truncate">{c.message || '-'}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase ${
                        c.status === 'CALLING'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : c.status === 'ACKNOWLEDGED'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {c.status === 'CALLING' && (
                      <button
                        onClick={() => onAcknowledgeCall(c.id)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-bold cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}
                    {c.status === 'ACKNOWLEDGED' && (
                      <button
                        onClick={() => onResolveCall(c.id)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                    {c.status === 'RESOLVED' && (
                      <span className="text-[10px] text-slate-400">
                        Resolved
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
