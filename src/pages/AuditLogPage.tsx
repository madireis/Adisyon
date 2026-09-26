import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Activity, Clock, ShieldCheck } from 'lucide-react';
import type { AuditLog } from '@/types/pos';

export default function AuditLogPage() {
  const logs = useLiveQuery(() => db.auditLogs.orderBy('timestamp').reverse().limit(100).toArray()) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto h-full flex flex-col dark:bg-stone-950 dark:text-stone-100">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-800 tracking-tight">Denetim Günlüğü (Audit Log)</h1>
          <p className="text-stone-500 text-sm mt-1">İptaller, indirimler, ödemeler ve kritik operasyonel hareketler</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Kayıt Güvenliği Aktif</span>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 flex-1 overflow-auto p-4 sm:p-6">
        <div className="space-y-6">
          {logs.map((log: AuditLog, idx: number) => (
            <div key={log.id} className="flex gap-4 relative">
              {idx !== logs.length - 1 && (
                <div className="absolute left-[19px] top-10 bottom-[-24px] w-px bg-stone-200"></div>
              )}
              <div className="bg-orange-50 border border-orange-200 p-2 rounded-full h-10 w-10 flex shrink-0 items-center justify-center text-orange-600 z-10">
                <Activity size={18} />
              </div>
              <div className="pt-1 pb-4 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-bold text-stone-900 text-sm">{log.userName}</span>
                  <span className="text-stone-400 text-xs flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(log.timestamp).toLocaleString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                    {log.entityType}
                  </span>
                </div>
                <p className="text-stone-800 text-sm font-semibold">{log.action}</p>
                {log.details && (
                  <div className="mt-1.5 text-xs font-mono bg-stone-50 p-2.5 rounded-xl text-stone-600 border border-stone-200">
                    {log.details}
                  </div>
                )}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-12 text-stone-400 text-sm">
              Henüz sistem denetim kaydı bulunamadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
