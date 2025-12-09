
import { AuditLog } from '../types';

const AUDIT_KEY = 'panchatantra_audit_logs';

export const getAuditLogs = (): AuditLog[] => {
  try {
    const data = localStorage.getItem(AUDIT_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load audit logs", error);
    return [];
  }
};

export const logTransaction = (
  type: 'Story' | 'Image' | 'Audio',
  detail: string,
  usage?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }
) => {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type,
    detail,
    promptTokens: usage?.promptTokenCount || 0,
    responseTokens: usage?.candidatesTokenCount || 0,
    totalTokens: usage?.totalTokenCount || 0
  };

  try {
    const logs = getAuditLogs();
    // Keep only last 50 transactions to manage storage
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error("Failed to save audit log", error);
  }
};

export const clearAuditLogs = () => {
    localStorage.removeItem(AUDIT_KEY);
};
