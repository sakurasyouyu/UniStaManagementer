import React from 'react';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

const events = [
  { date: '2026-04-04', title: '入学式 静岡・浜松', type: 'ceremony' },
  { date: '2026-04-06', title: '健康診断', type: 'other' },
  { date: '2026-04-13', title: '前期授業開始', type: 'academic' },
  { date: '2026-07-27', title: '前期期末試験（〜8/3）', type: 'exam' },
  { date: '2026-08-10', title: '夏季一斉休業（〜8/14）', type: 'holiday' },
  { date: '2026-10-01', title: '後期授業開始', type: 'academic' },
  { date: '2026-11-07', title: 'テクノフェスタ・大学祭', type: 'event' },
  { date: '2026-12-26', title: '冬季休業（〜1/5）', type: 'holiday' },
  { date: '2027-02-01', title: '後期期末試験', type: 'exam' }
];

const CalendarView = () => {
  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Yearly Schedule</h1>
        <p className="page-subtitle">令和8年度 (2026年度) 行事予定表</p>
      </header>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={20} color="var(--accent-primary)" />
          主要な行事リスト
        </h2>

        <div style={{ display: 'grid', gap: '16px' }}>
          {events.map((ev, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              padding: '16px', 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '12px',
              borderLeft: ev.type === 'exam' ? '4px solid var(--danger)' :
                          ev.type === 'holiday' ? '4px solid var(--success)' :
                          ev.type === 'academic' ? '4px solid var(--accent-primary)' :
                          '4px solid var(--text-secondary)'
            }}>
              <div style={{ width: '120px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                {ev.date}
              </div>
              <div style={{ flex: 1, fontSize: '18px' }}>
                {ev.title}
              </div>
              {ev.type === 'exam' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '12px', fontWeight: 'bold' }}>
                  <AlertCircle size={14} /> 試験期間
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
