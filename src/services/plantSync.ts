import { PlantCall, PlantLine } from '../types';
import { INITIAL_CALLS, PLANT_LINES } from '../constants/initialData';

const STORAGE_PLANT_CALLS_KEY = 'plant_calls_v5';
const STORAGE_CURRENT_ROLE_KEY = 'plant_current_role_v3';
const STORAGE_ANNOUNCEMENT_KEY = 'plant_active_announcement_v2';
const STORAGE_DIRECT_MESSAGES_KEY = 'plant_direct_messages_v2';

export interface PlantAnnouncement {
  id: string;
  message: string;
  timestamp: string;
  formattedTime?: string;
}

export interface PlantDirectMessage {
  id: string;
  lineId: string; // 'line-1' .. 'line-5'
  lineName: string;
  message: string;
  timestamp: string;
  formattedTime?: string;
}

// Dummy call IDs to strictly ignore/purge
const DUMMY_CALL_IDS = new Set(['call-101', 'call-102', 'call-103']);

export type PlantChannelMessage = 
  | { type: 'NEW_CALL'; call: PlantCall }
  | { type: 'CALL_ACKNOWLEDGED'; callId: string; adminName: string; timestamp: string }
  | { type: 'CALL_RESOLVED'; callId: string; adminName: string; timestamp: string }
  | { type: 'CALL_CANCELLED'; callId: string; lineId: string }
  | { type: 'CLEAR_HISTORY'; lineId?: string }
  | { type: 'BROADCAST_ANNOUNCEMENT'; announcement: PlantAnnouncement }
  | { type: 'DISMISS_ANNOUNCEMENT'; announcementId: string }
  | { type: 'DIRECT_LINE_MESSAGE'; directMessage: PlantDirectMessage }
  | { type: 'DISMISS_DIRECT_MESSAGE'; lineId: string; messageId: string };

// Singleton BroadcastChannel for multi-window / multi-computer instant sync
let channel: BroadcastChannel | null = null;

export function getPlantBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return null;
  }
  if (!channel) {
    channel = new BroadcastChannel('plant_line_admin_channel_v3');
  }
  return channel;
}

export function broadcastPlantEvent(msg: PlantChannelMessage) {
  try {
    const ch = getPlantBroadcastChannel();
    if (ch) {
      ch.postMessage(msg);
    }
  } catch (e) {
    console.warn('Broadcast channel error:', e);
  }
}

/**
 * Clean up legacy storage keys from previous versions that contained dummy calls
 */
function purgeLegacyDummyStorage(): void {
  try {
    const legacyKeys = ['plant_calls_v1', 'plant_calls_v2', 'plant_calls_v3', 'plant_calls_v4', 'plant_calls_storage_v2'];
    for (const key of legacyKeys) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore in restricted environments
  }
}

/**
 * Load stored plant calls from localStorage
 */
export function loadStoredPlantCalls(): PlantCall[] {
  try {
    purgeLegacyDummyStorage();

    const raw = localStorage.getItem(STORAGE_PLANT_CALLS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any dummy alerts
      return parsed.filter((c) => c && c.id && !DUMMY_CALL_IDS.has(c.id));
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredPlantCalls(calls: PlantCall[]): void {
  try {
    const cleanCalls = calls.filter((c) => c && c.id && !DUMMY_CALL_IDS.has(c.id));
    localStorage.setItem(STORAGE_PLANT_CALLS_KEY, JSON.stringify(cleanCalls));
  } catch (e) {
    console.warn('Could not save plant calls:', e);
  }
}

/**
 * Current Role/Line configuration on this computer:
 * Returns null if user hasn't selected yet, or 'admin', 'line-1' .. 'line-5'
 */
export function getCurrentRoleId(): string | null {
  try {
    return localStorage.getItem(STORAGE_CURRENT_ROLE_KEY);
  } catch {
    return null;
  }
}

export function setCurrentRoleId(roleId: string | null): void {
  try {
    if (roleId) {
      localStorage.setItem(STORAGE_CURRENT_ROLE_KEY, roleId);
    } else {
      localStorage.removeItem(STORAGE_CURRENT_ROLE_KEY);
    }
  } catch (e) {
    console.warn('Could not save role ID:', e);
  }
}

export function getLineById(id: string): PlantLine | undefined {
  return PLANT_LINES.find((s) => s.id === id);
}

export function loadStoredAnnouncement(): PlantAnnouncement | null {
  try {
    const raw = localStorage.getItem(STORAGE_ANNOUNCEMENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredAnnouncement(announcement: PlantAnnouncement | null): void {
  try {
    if (announcement) {
      localStorage.setItem(STORAGE_ANNOUNCEMENT_KEY, JSON.stringify(announcement));
    } else {
      localStorage.removeItem(STORAGE_ANNOUNCEMENT_KEY);
    }
  } catch (e) {
    console.warn('Could not save announcement:', e);
  }
}

export function loadStoredDirectMessages(): Record<string, PlantDirectMessage> {
  try {
    const raw = localStorage.getItem(STORAGE_DIRECT_MESSAGES_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveStoredDirectMessages(messages: Record<string, PlantDirectMessage>): void {
  try {
    localStorage.setItem(STORAGE_DIRECT_MESSAGES_KEY, JSON.stringify(messages));
  } catch (e) {
    console.warn('Could not save direct messages:', e);
  }
}

