import { useState, useEffect } from 'react';
import {
  PlantCall,
  CallReason,
} from './types';
import {
  getCurrentRoleId,
  setCurrentRoleId,
  loadStoredPlantCalls,
  saveStoredPlantCalls,
  loadStoredAnnouncement,
  saveStoredAnnouncement,
  PlantAnnouncement,
  PlantDirectMessage,
  loadStoredDirectMessages,
  saveStoredDirectMessages,
  getPlantBroadcastChannel,
  broadcastPlantEvent,
  PlantChannelMessage,
  getLineById,
} from './services/plantSync';
import { PLANT_LINES } from './constants/initialData';
import { notificationService } from './services/notifications';
import { PlantHeader } from './components/PlantHeader';
import { LineView } from './components/LineView';
import { AdminView } from './components/AdminView';
import { RoleSelectModal } from './components/RoleSelectModal';
import { DesktopNotificationModal } from './components/DesktopNotificationModal';
import { BellRing, ShieldAlert, X, Megaphone, AlertTriangle, MessageSquare } from 'lucide-react';

export default function App() {
  // Current role/computer line: 'admin' or 'line-1' .. 'line-5' or null
  const [currentRoleId, setRoleIdState] = useState<string | null>(getCurrentRoleId);

  // Modal state for role selection box
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(() => {
    // Open selection box automatically if not selected yet
    return !getCurrentRoleId();
  });

  // Modal state for desktop notification configuration and help
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isReminderBannerDismissed, setIsReminderBannerDismissed] = useState<boolean>(false);

  // Plant Calls History
  const [calls, setCalls] = useState<PlantCall[]>(loadStoredPlantCalls);

  // Active Broadcast Announcement (from Admin to all lines)
  const [activeAnnouncement, setActiveAnnouncement] = useState<PlantAnnouncement | null>(loadStoredAnnouncement);

  // Active Individual Messages from Admin to specific lines: Record<lineId, PlantDirectMessage>
  const [directMessages, setDirectMessages] = useState<Record<string, PlantDirectMessage>>(loadStoredDirectMessages);

  // Notifications & Sound
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    notificationService.getNotificationPermission()
  );

  // Urgent incoming banner alert for Admin
  const [urgentIncomingCall, setUrgentIncomingCall] = useState<PlantCall | null>(null);

  // Persist calls to local storage
  useEffect(() => {
    saveStoredPlantCalls(calls);
  }, [calls]);

  // Persist direct messages to local storage
  useEffect(() => {
    saveStoredDirectMessages(directMessages);
  }, [directMessages]);

  // Tab Title Alerting for hands-free and minimized background alerts
  useEffect(() => {
    const callingCall = calls.find((c) => c.status === 'CALLING');
    const myDirectMessage = currentRoleId ? directMessages[currentRoleId] : null;
    if (callingCall) {
      notificationService.startTitleAlert(`🚨 ${callingCall.lineName} CALLING - PlantAlert`);
    } else if (myDirectMessage) {
      notificationService.startTitleAlert(`📩 NOTE FOR ${myDirectMessage.lineName.toUpperCase()} - PlantAlert`);
    } else if (activeAnnouncement) {
      notificationService.startTitleAlert(`📢 ANNOUNCEMENT - PlantAlert`);
    } else {
      notificationService.stopTitleAlert();
    }

    return () => {
      notificationService.stopTitleAlert();
    };
  }, [calls, activeAnnouncement, directMessages, currentRoleId]);

  // Set active role / line for this PC
  const handleSelectRole = (roleId: string) => {
    setRoleIdState(roleId);
    setCurrentRoleId(roleId);
    setIsRoleModalOpen(false);
  };

  // Cross-tab / Cross-computer real-time sync via BroadcastChannel
  useEffect(() => {
    const channel = getPlantBroadcastChannel();
    if (!channel) return;

    const handleMessage = (e: MessageEvent<PlantChannelMessage>) => {
      const msg = e.data;
      if (!msg || !msg.type) return;

      if (msg.type === 'NEW_CALL') {
        setCalls((prev) => {
          const exists = prev.some((c) => c.id === msg.call.id);
          return exists ? prev : [msg.call, ...prev];
        });

        // If currently in Admin view, sound the alarm immediately!
        if (currentRoleId === 'admin') {
          notificationService.playPlantAdminAlarm();
          notificationService.showSystemNotification(`🚨 HELP REQUESTED: ${msg.call.lineName}`, {
            body: `${msg.call.reasonLabel}${msg.call.message ? ` - ${msg.call.message}` : ''}`,
          });
          setUrgentIncomingCall(msg.call);
        }
      } else if (msg.type === 'CALL_ACKNOWLEDGED') {
        setCalls((prev) =>
          prev.map((c) =>
            c.id === msg.callId
              ? {
                  ...c,
                  status: 'ACKNOWLEDGED',
                  acknowledgedBy: msg.adminName,
                  acknowledgedAt: msg.timestamp,
                }
              : c
          )
        );

        // If this computer is that line, chime positive confirmation!
        const targetCall = calls.find((c) => c.id === msg.callId);
        if (targetCall && targetCall.lineId === currentRoleId) {
          notificationService.playAckChime();
          notificationService.showSystemNotification(`✅ ADMIN ON THE WAY`, {
            body: `Admin has acknowledged your call and is on the way to ${targetCall.lineName}.`,
          });
        }
      } else if (msg.type === 'CALL_RESOLVED') {
        setCalls((prev) =>
          prev.map((c) =>
            c.id === msg.callId
              ? {
                  ...c,
                  status: 'RESOLVED',
                  resolvedBy: msg.adminName,
                  resolvedAt: msg.timestamp,
                }
              : c
          )
        );
        const targetCall = calls.find((c) => c.id === msg.callId);
        if (targetCall && targetCall.lineId === currentRoleId) {
          notificationService.playResolvedChime();
        }
      } else if (msg.type === 'CALL_CANCELLED') {
        setCalls((prev) =>
          prev.map((c) =>
            c.id === msg.callId ? { ...c, status: 'RESOLVED', resolvedBy: 'Cancelled by Line' } : c
          )
        );
      } else if (msg.type === 'CLEAR_HISTORY') {
        if (msg.lineId) {
          setCalls((prev) => prev.filter((c) => c.lineId !== msg.lineId));
        } else {
          setCalls([]);
          setUrgentIncomingCall(null);
        }
      } else if (msg.type === 'BROADCAST_ANNOUNCEMENT') {
        setActiveAnnouncement(msg.announcement);
        saveStoredAnnouncement(msg.announcement);

        // Sound factory announcement chime for all line users!
        notificationService.playAnnouncementChime();

        // Deliver high-priority desktop notification
        notificationService.showSystemNotification(`📢 PLANT ANNOUNCEMENT FROM ADMIN`, {
          body: msg.announcement.message,
          tag: `announcement-${msg.announcement.id}`,
          requireInteraction: true,
        });
      } else if (msg.type === 'DISMISS_ANNOUNCEMENT') {
        setActiveAnnouncement(null);
        saveStoredAnnouncement(null);
      } else if (msg.type === 'DIRECT_LINE_MESSAGE') {
        setDirectMessages((prev) => ({
          ...prev,
          [msg.directMessage.lineId]: msg.directMessage,
        }));

        // If this terminal is the target line, alert immediately!
        if (currentRoleId === msg.directMessage.lineId) {
          notificationService.playAnnouncementChime();
          notificationService.showSystemNotification(`📩 NOTE FROM ADMIN FOR ${msg.directMessage.lineName}`, {
            body: msg.directMessage.message,
            tag: `direct-${msg.directMessage.id}`,
            requireInteraction: true,
          });
        }
      } else if (msg.type === 'DISMISS_DIRECT_MESSAGE') {
        setDirectMessages((prev) => {
          const next = { ...prev };
          delete next[msg.lineId];
          return next;
        });
      }
    };

    channel.addEventListener('message', handleMessage);
    return () => {
      channel.removeEventListener('message', handleMessage);
    };
  }, [currentRoleId, calls]);

  // Current line metadata (if set)
  const currentLine = currentRoleId ? getLineById(currentRoleId) : undefined;

  // Active call for current line
  const activeLineCall = calls.find(
    (c) => c.lineId === currentRoleId && (c.status === 'CALLING' || c.status === 'ACKNOWLEDGED')
  );

  // Line recent calls
  const lineRecentCalls = currentRoleId
    ? calls.filter((c) => c.lineId === currentRoleId)
    : [];

  // Action: Line calls Admin (1-Click)
  const handleCallAdmin = (reason: CallReason, note: string) => {
    if (!currentLine) return;

    const reasonLabels: Record<CallReason, string> = {
      BREAKDOWN: 'Machine Breakdown / Jam',
      MATERIAL: 'Material Shortage',
      QUALITY: 'Quality / Inspection',
      SAFETY: 'Safety Hazard / Stop',
      GENERAL: 'General Help Needed',
    };

    const newCall: PlantCall = {
      id: `call-${Date.now().toString().slice(-6)}`,
      lineId: currentLine.id,
      lineNumber: currentLine.number,
      lineName: currentLine.name,
      reason,
      reasonLabel: reasonLabels[reason] || 'Help Needed',
      message: note || `${reasonLabels[reason]} on ${currentLine.name}`,
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'CALLING',
    };

    // Update local state immediately
    setCalls((prev) => [newCall, ...prev]);

    // Broadcast across all plant computers/tabs
    broadcastPlantEvent({ type: 'NEW_CALL', call: newCall });

    // Sound local confirmation tone
    notificationService.playEmergencyAlarm('HIGH');
  };

  // Action: Cancel call from line
  const handleCancelCall = (callId: string) => {
    setCalls((prev) =>
      prev.map((c) =>
        c.id === callId ? { ...c, status: 'RESOLVED', resolvedBy: 'Cancelled by Line' } : c
      )
    );
    if (currentRoleId) {
      broadcastPlantEvent({ type: 'CALL_CANCELLED', callId, lineId: currentRoleId });
    }
  };

  // Action: Admin Acknowledges call ("On My Way")
  const handleAcknowledgeCall = (callId: string) => {
    const adminName = 'Admin';
    const timestamp = new Date().toISOString();

    setCalls((prev) =>
      prev.map((c) =>
        c.id === callId ? { ...c, status: 'ACKNOWLEDGED', acknowledgedBy: adminName, acknowledgedAt: timestamp } : c
      )
    );

    // Play acknowledge sound
    notificationService.playAckChime();

    // Broadcast to line computer
    broadcastPlantEvent({ type: 'CALL_ACKNOWLEDGED', callId, adminName, timestamp });

    // Clear incoming urgent alert banner if this was it
    if (urgentIncomingCall?.id === callId) {
      setUrgentIncomingCall(null);
    }
  };

  // Action: Resolve Call (by Admin or Line)
  const handleResolveCall = (callId: string) => {
    const adminName = 'Admin';
    const timestamp = new Date().toISOString();

    setCalls((prev) =>
      prev.map((c) =>
        c.id === callId ? { ...c, status: 'RESOLVED', resolvedBy: adminName, resolvedAt: timestamp } : c
      )
    );

    notificationService.playResolvedChime();
    broadcastPlantEvent({ type: 'CALL_RESOLVED', callId, adminName, timestamp });
  };

  // Action: Admin Broadcast announcement to all 5 lines
  const handleBroadcastMessage = (message: string) => {
    const timestamp = new Date().toISOString();
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const announcementId = `bc-${Date.now().toString().slice(-6)}`;

    const announcement: PlantAnnouncement = {
      id: announcementId,
      message,
      timestamp,
      formattedTime,
    };

    const broadcastCall: PlantCall = {
      id: announcementId,
      lineId: 'all',
      lineNumber: 0,
      lineName: 'All Lines',
      reason: 'GENERAL',
      reasonLabel: 'Plant Announcement',
      message,
      timestamp,
      formattedTime,
      status: 'RESOLVED',
    };

    setCalls((prev) => [broadcastCall, ...prev]);
    setActiveAnnouncement(announcement);
    saveStoredAnnouncement(announcement);

    // Broadcast across all connected computers and tabs
    broadcastPlantEvent({ type: 'BROADCAST_ANNOUNCEMENT', announcement });

    // Local tones & desktop notification
    notificationService.playAnnouncementChime();
    notificationService.showSystemNotification(`📢 BROADCAST SENT TO ALL LINES`, {
      body: message,
      tag: `announcement-${announcementId}`,
    });
  };

  // Dismiss active announcement
  const handleDismissAnnouncement = () => {
    const currentId = activeAnnouncement?.id;
    setActiveAnnouncement(null);
    saveStoredAnnouncement(null);
    if (currentId) {
      broadcastPlantEvent({ type: 'DISMISS_ANNOUNCEMENT', announcementId: currentId });
    }
  };

  // Send Individual Message to a specific production line
  const handleSendDirectMessage = (lineId: string, messageText: string) => {
    const targetLine = getLineById(lineId);
    const lineName = targetLine ? targetLine.name : `Line ${lineId.replace('line-', '')}`;
    const timestamp = new Date().toISOString();
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const directMessage: PlantDirectMessage = {
      id: `dm-${Date.now().toString().slice(-6)}`,
      lineId,
      lineName,
      message: messageText.trim(),
      timestamp,
      formattedTime,
    };

    setDirectMessages((prev) => ({ ...prev, [lineId]: directMessage }));
    broadcastPlantEvent({ type: 'DIRECT_LINE_MESSAGE', directMessage });
    notificationService.playAckChime();
  };

  // Dismiss / Clear Individual Message for a specific line
  const handleDismissDirectMessage = (lineId: string) => {
    const current = directMessages[lineId];
    setDirectMessages((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
    if (current) {
      broadcastPlantEvent({ type: 'DISMISS_DIRECT_MESSAGE', lineId, messageId: current.id });
    }
  };

  // Clear all call history (Admin)
  const handleClearHistory = () => {
    setCalls([]);
    saveStoredPlantCalls([]);
    setUrgentIncomingCall(null);
    broadcastPlantEvent({ type: 'CLEAR_HISTORY' });
  };

  // Clear single line call history (Line User)
  const handleClearLineHistory = (lineId: string) => {
    setCalls((prev) => {
      const updated = prev.filter((c) => c.lineId !== lineId);
      saveStoredPlantCalls(updated);
      return updated;
    });
    broadcastPlantEvent({ type: 'CLEAR_HISTORY', lineId });
  };

  // Sound Controls
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    notificationService.setSoundEnabled(next);
  };

  const handleTestSound = () => {
    notificationService.playPlantAdminAlarm();
  };

  const handleRequestNotifications = async () => {
    // If already granted, send confirmation test alert
    if (notificationPermission === 'granted') {
      handleTestDesktopNotification();
      return;
    }

    try {
      const res = await notificationService.requestNotificationPermission();
      setNotificationPermission(res);

      if (res === 'granted') {
        notificationService.playAckChime();
        notificationService.showSystemNotification('🔔 PlantAlert Desktop Alerts Enabled!', {
          body: 'You will receive immediate alerts and broadcasts on your desktop.',
        });
      } else {
        // If denied, blocked, or in an embedded preview frame, open the helper modal immediately
        setIsNotificationModalOpen(true);
      }
    } catch {
      setIsNotificationModalOpen(true);
    }
  };

  const handleTestDesktopNotification = async () => {
    let perm = notificationPermission;
    if (perm !== 'granted') {
      perm = await notificationService.requestNotificationPermission();
      setNotificationPermission(perm);
      if (perm !== 'granted') {
        // Play local simulation alert and open helper modal
        notificationService.playPlantAdminAlarm();
        notificationService.startTitleAlert('🔔 TEST ALERT: PlantAlert Ready');
        setTimeout(() => notificationService.stopTitleAlert(), 4000);
        setIsNotificationModalOpen(true);
        return;
      }
    }

    notificationService.playAckChime();
    notificationService.startTitleAlert('🔔 PlantAlert Desktop Alerts Active');
    setTimeout(() => notificationService.stopTitleAlert(), 4000);
    notificationService.showSystemNotification(`🔔 PlantAlert Fast Help Active`, {
      body: `Desktop alerts are working properly for ${currentLine ? currentLine.name : 'Admin'}.`,
    });
  };

  const callingCount = calls.filter((c) => c.status === 'CALLING').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Top Plant Header */}
      <PlantHeader
        currentRoleId={currentRoleId}
        onOpenRoleSelect={() => setIsRoleModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onTestSound={handleTestSound}
        notificationPermission={notificationPermission}
        onRequestNotifications={handleRequestNotifications}
        onTestDesktopNotification={handleTestDesktopNotification}
        callingCount={callingCount}
      />

      {/* High Visibility Plant Announcement Banner */}
      {activeAnnouncement && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 px-4 py-3.5 shadow-2xl border-b-2 border-amber-600">
          <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-slate-950 text-amber-400 rounded-xl shrink-0 animate-pulse">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono uppercase text-[10px] font-black bg-slate-950 text-amber-300 px-2 py-0.5 rounded tracking-wider">
                    BROADCAST ANNOUNCEMENT TO ALL LINES
                  </span>
                  {activeAnnouncement.formattedTime && (
                    <span className="text-[11px] font-bold text-slate-800">
                      Sent at {activeAnnouncement.formattedTime}
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base font-black text-slate-950 tracking-tight mt-0.5 break-words">
                  "{activeAnnouncement.message}"
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissAnnouncement}
              className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer transition shrink-0 ml-2 shadow"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* High Alert Incoming Flash Banner for Admin */}
      {currentRoleId === 'admin' && urgentIncomingCall && (
        <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between shadow-2xl animate-bounce">
          <div className="flex items-center gap-3 max-w-5xl mx-auto flex-1">
            <div className="p-1.5 bg-black/30 rounded-lg shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs sm:text-sm font-bold truncate">
              <span className="font-mono uppercase bg-black/40 px-2 py-0.5 rounded mr-2">
                INCOMING CALL
              </span>
              <span>{urgentIncomingCall.lineName}: {urgentIncomingCall.reasonLabel}</span>
              {urgentIncomingCall.message && <span className="font-normal opacity-90 ml-2">"{urgentIncomingCall.message}"</span>}
            </div>
          </div>
          <button
            onClick={() => setUrgentIncomingCall(null)}
            className="p-1 hover:bg-black/20 rounded cursor-pointer ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* Permission Request Reminder Banner */}
        {notificationPermission !== 'granted' && !isReminderBannerDismissed && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <BellRing className={`w-4 h-4 ${notificationPermission === 'default' ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <span className="font-bold text-white block sm:inline">
                  {notificationPermission === 'denied'
                    ? 'Desktop alerts need setup / permission.'
                    : 'Enable desktop notifications for fast emergency signaling.'}
                </span>{' '}
                <span className="text-slate-400 text-[11px] block sm:inline mt-0.5 sm:mt-0">
                  {notificationService.isInIframe()
                    ? 'Click to open setup or launch in dedicated tab to allow OS popups.'
                    : 'Receive instant visual alerts & sound chimes even when tab is minimized.'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRequestNotifications}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition cursor-pointer shadow-md shadow-amber-500/20"
              >
                {notificationPermission === 'denied' ? 'Desktop Alerts Setup' : 'Enable Desktop Alerts'}
              </button>
              <button
                onClick={() => setIsReminderBannerDismissed(true)}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg cursor-pointer"
                title="Dismiss reminder"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: ADMIN VIEW */}
        {currentRoleId === 'admin' && (
          <AdminView
            allCalls={calls}
            onAcknowledgeCall={handleAcknowledgeCall}
            onResolveCall={handleResolveCall}
            onBroadcastMessage={handleBroadcastMessage}
            onClearHistory={handleClearHistory}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onTestSound={handleTestSound}
            directMessages={directMessages}
            onSendDirectMessage={handleSendDirectMessage}
            onDismissDirectMessage={handleDismissDirectMessage}
          />
        )}

        {/* VIEW 2: LINE VIEW (Line 1 to Line 5) */}
        {currentRoleId && currentRoleId !== 'admin' && currentLine && (
          <LineView
            line={currentLine}
            activeCall={activeLineCall}
            onCallAdmin={handleCallAdmin}
            onCancelCall={handleCancelCall}
            onResolveCall={handleResolveCall}
            onClearLineHistory={() => handleClearLineHistory(currentLine.id)}
            recentLineCalls={lineRecentCalls}
            activeAnnouncement={activeAnnouncement}
            onDismissAnnouncement={handleDismissAnnouncement}
            activeDirectMessage={directMessages[currentLine.id] || null}
            onDismissDirectMessage={() => handleDismissDirectMessage(currentLine.id)}
          />
        )}

        {/* VIEW 3: NO ROLE SELECTED YET -> Centered Welcome & Selection Screen */}
        {!currentRoleId && (
          <div className="max-w-xl mx-auto py-12 text-center space-y-6">
            <div className="inline-flex p-4 bg-red-600/20 border border-red-500/40 rounded-3xl text-red-400">
              <ShieldAlert className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white tracking-tight">
                Select This Computer's Setup
              </h1>
              <p className="text-sm text-slate-400">
                Please select whether this terminal is the <strong className="text-white">Admin</strong> or one of the <strong className="text-white">5 Production Lines</strong>.
              </p>
            </div>

            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-red-950/80 transition cursor-pointer"
            >
              Open Selection Box
            </button>
          </div>
        )}
      </main>

      {/* Role Selection Box Modal (Opens on launch or when clicking Switch) */}
      <RoleSelectModal
        isOpen={isRoleModalOpen}
        currentRole={currentRoleId}
        onSelectRole={handleSelectRole}
        onClose={() => setIsRoleModalOpen(false)}
        isInitialSetup={!currentRoleId}
      />

      {/* Desktop Notification Help & Setup Modal */}
      <DesktopNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        permission={notificationPermission}
        onPermissionChange={(newPerm) => setNotificationPermission(newPerm)}
        onTestNotification={handleTestDesktopNotification}
      />
    </div>
  );
}
