
import React, { useEffect, useState } from 'react';
import { X, FileText, Activity, Trash2 } from 'lucide-react';
import { AuditLog } from '../types';
import { getAuditLogs, clearAuditLogs } from '../services/auditService';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLogs(getAuditLogs());
    }
  }, [isOpen]);

  const handleClear = () => {
      clearAuditLogs();
      setLogs([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4 font-['Fredoka']">
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl p-6 relative shadow-2xl animate-fadeIn flex flex-col">
        
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                    <Activity size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-800">Token Audit Logs</h2>
                    <p className="text-gray-500 font-medium text-sm">Track Gemini API usage per transaction</p>
                </div>
            </div>
            
            <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        <div className="flex-1 overflow-auto border rounded-xl border-gray-200">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider border-b">Time</th>
                        <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider border-b">Type</th>
                        <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider border-b">Detail</th>
                        <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider border-b text-right">Input</th>
                        <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider border-b text-right">Output</th>
                        <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider border-b text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {logs.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-12 text-center text-gray-400 font-medium">
                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                No transactions recorded yet.
                            </td>
                        </tr>
                    ) : (
                        logs.map((log) => (
                            <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="p-4 text-gray-600 font-mono text-sm">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide
                                        ${log.type === 'Story' ? 'bg-purple-100 text-purple-700' : ''}
                                        ${log.type === 'Image' ? 'bg-green-100 text-green-700' : ''}
                                        ${log.type === 'Audio' ? 'bg-orange-100 text-orange-700' : ''}
                                    `}>
                                        {log.type}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-700 font-medium max-w-xs truncate" title={log.detail}>
                                    {log.detail}
                                </td>
                                <td className="p-4 text-right text-gray-500 font-mono">{log.promptTokens}</td>
                                <td className="p-4 text-right text-gray-500 font-mono">{log.responseTokens}</td>
                                <td className="p-4 text-right font-bold text-gray-800 font-mono">{log.totalTokens}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-400 font-medium">
                Showing last {logs.length} transactions
            </div>
            <button 
                onClick={handleClear}
                className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg font-bold transition-colors"
            >
                <Trash2 size={18} />
                Clear Logs
            </button>
        </div>
      </div>
    </div>
  );
};
