import React from 'react';
import {
  ShieldAlert,
  Monitor,
  Volume2,
  VolumeX,
  BellRing,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { PlantLine } from '../types';
import { PLANT_LINES } from '../constants/initialData';

interface PlantHeaderProps {
  currentRoleId: string | null; // 'admin' or 'line-1' .. 'line-5'
  onOpenRoleSelect: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTestSound: () => void;
  notificationPermission: NotificationPermission;
  onRequestNotifications: () => void;
  onTestDesktopNotification: () => void;
  callingCount: number;
}

export const PlantHeader: React.FC<PlantHeaderProps> = ({
  currentRoleId,
  onOpenRoleSelect,
  soundEnabled,
  onToggleSound,
  onTestSound,
  notificationPermission,
  onRequestNotifications,
  onTestDesktopNotification,
  callingCount,
}) => {
  const isAdmin = currentRoleId === 'admin';
  const currentLine = PLANT_LINES.find((s) => s.id === currentRoleId);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600 rounded-xl shadow-lg shadow-red-600/30 text-white shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-white">
                PlantAlert
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                5 LINES & ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Production Help Alert System
            </p>
          </div>
        </div>

        {/* Center: Computer Role Selection Box Trigger */}
        <div>
          <button
            onClick={onOpenRoleSelect}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isAdmin
                ? 'bg-amber-950/60 border-amber-600 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                : currentLine
                ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-750'
                : 'bg-red-900/60 border-red-500 text-white animate-pulse'
            }`}
          >
            <Monitor className={`w-3.5 h-3.5 ${isAdmin ? 'text-amber-400' : 'text-blue-400'}`} />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block font-normal leading-none">
                This Computer:
              </span>
              <span className="truncate max-w-[130px] sm:max-w-[180px] block font-extrabold">
                {isAdmin ? 'Admin' : currentLine ? currentLine.name : 'Select Line / Admin'}
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-300 ml-1">
              Switch
            </span>
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {/* Desktop Notifications Status / Activation */}
          {notificationPermission === 'granted' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-400 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="hidden sm:inline font-bold">Desktop Alerts ON</span>
              <button
                onClick={onTestDesktopNotification}
                className="text-[10px] sm:ml-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer font-bold"
                title="Send test desktop notification"
              >
                Test
              </button>
            </div>
          ) : notificationPermission === 'denied' ? (
            <button
              onClick={onRequestNotifications}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs shadow-md transition cursor-pointer"
              title="Desktop notifications are blocked or in preview frame. Click to view instructions & enable"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Desktop Alerts Setup</span>
              <span className="sm:hidden">Alerts</span>
            </button>
          ) : (
            <button
              onClick={onRequestNotifications}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
              title="Enable desktop notifications for instant fast help"
            >
              <BellRing className="w-3.5 h-3.5 animate-bounce shrink-0" />
              <span className="hidden sm:inline">Enable Desktop Alerts</span>
              <span className="sm:hidden">Enable Alerts</span>
            </button>
          )}

          {/* Sound Alarm Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Alarm Sound: Enabled' : 'Alarm Sound: Muted'}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'bg-red-950/40 text-red-400 border-red-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
