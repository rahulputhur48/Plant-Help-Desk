export type CallReason = 
  | 'GENERAL' 
  | 'BREAKDOWN' 
  | 'MATERIAL' 
  | 'QUALITY' 
  | 'SAFETY';

export type CallStatus = 'CALLING' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface PlantLine {
  id: string; // 'line-1', 'line-2', 'line-3', 'line-4', 'line-5'
  number: number; // 1 to 5
  name: string; // 'Line 1', 'Line 2', etc.
  description?: string;
}

export interface PlantCall {
  id: string;
  lineId: string;
  lineNumber: number;
  lineName: string;
  reason: CallReason;
  reasonLabel: string;
  message: string;
  timestamp: string; // ISO string
  formattedTime?: string;
  status: CallStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}
