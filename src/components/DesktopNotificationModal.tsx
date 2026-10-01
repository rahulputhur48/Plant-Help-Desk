import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Volume2,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { notificationService } from '../services/notifications';

interface DesktopNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: NotificationPermission;
  onPermissionChange: (newPerm: NotificationPermission) => void;
  onTestNotification: () => void;
}

export const DesktopNotificationModal: React.FC<DesktopNotificationModalProps> = ({
  isOpen,
  onClose,
  permission,
  onPermissionChange,
  onTestNotification,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const isIframe = notificationService.isInIframe();
  const isSupported = notificationService.isNotificationSupported();

  const handleRequestOrCheck = async () => {
    setIsChecking(true);
    try {
      const res = await notificationService.requestNotificationPermission();
      onPermissionChange(res);
      if (res === 'granted') {
        notificationService.playAckChime();
        notificationService.showSystemNotification('🔔 PlantAlert Desktop Alerts Enabled!', {
          body: 'You will receive real-time popups for calls and broadcast announcements.',
        });
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleTriggerTest = () => {
    setTestSent(true);
    onTestNotification();
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 text-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl border shrink-0 ${
              permission === 'granted'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}
          >
            {permission === 'granted' ? (
              <BellRing className="w-6 h-6 animate-pulse" />
            ) : (
              <Bell className="w-6 h-6" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Desktop Alerts & Fast Help Setup
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Receive instant desktop sound and visual alerts when production lines call for help.
            </p>
          </div>
        </div>

        {/* Current Status Badge */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-medium">Browser Notification Status:</span>
          {permission === 'granted' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active & Granted
            </span>
          ) : permission === 'denied' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/80 text-red-400 border border-red-500/40 font-bold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              Blocked in Browser
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-400 border border-amber-500/40 font-bold text-[11px]">
              <Bell className="w-3.5 h-3.5" />
              Pending Permission
            </span>
          )}
        </div>

        {/* Specific Case Guidance */}
        {permission !== 'granted' && (
          <div className="space-y-3">
            {/* If inside iframe, explain the sandbox limitation and provide 1-tap open */}
            {isIframe && (
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/60 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-300">
                  <ExternalLink className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>Preview Environment Detected</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Web browsers (Chrome/Edge/Safari) restrict system desktop notification popups inside embedded preview frames. To enable true native OS desktop notifications, open the app in a standalone tab:
                </p>
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open App in Dedicated Tab
                </a>
              </div>
            )}

            {/* If denied, give instructions to unblock */}
            {permission === 'denied' && (
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>How to Unblock in Your Browser</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>
                    Click the <strong>Site Settings</strong> or <strong>Padlock / Tune icon (🎚️)</strong> on the left side of your browser address bar.
                  </li>
                  <li>
                    Look for <strong>Notifications</strong> and change it from <em>Block</em> to <strong>Allow</strong>.
                  </li>
                  <li>
                    Click the button below to re-check or reload this page.
                  </li>
                </ol>
              </div>
            )}

            {/* If default (not yet prompted) */}
            {permission === 'default' && !isIframe && (
              <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700 text-xs text-slate-300 leading-relaxed">
                Click <strong>"Allow"</strong> when your browser prompts to approve desktop notifications.
              </div>
            )}
          </div>
        )}

        {/* Built-in In-App Alert Highlights (Guaranteed Fallback) */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <Volume2 className="w-4 h-4" />
            <span>In-App High-Priority Alerts (Always Active)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Even without browser OS popups, PlantAlert automatically triggers:
          </p>
          <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
            <li>High-volume industrial alarms & multi-tone chimes (Web Audio)</li>
            <li>Real-time multi-window synchronization via BroadcastChannel</li>
            <li>Flashing browser tab titles (<code>🚨 Line X Calling</code>)</li>
            <li>Prominent full-screen banners & red visual pulses</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Test Alert Button */}
          <button
            onClick={handleTriggerTest}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
            title="Test sound alarm and desktop notification"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{testSent ? 'Alert Triggered! 🔔' : 'Test Sound & Alert'}</span>
          </button>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2 ml-auto">
            {permission !== 'granted' ? (
              <button
                onClick={handleRequestOrCheck}
                disabled={isChecking}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Checking...' : permission === 'denied' ? 'Re-check Permission' : 'Enable Desktop Alerts'}</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                All Set
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
