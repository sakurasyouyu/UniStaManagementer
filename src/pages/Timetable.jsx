import React, { useState, useEffect } from 'react';
import { getTimetable, toggleAttendance, getAttendance } from '../utils/storage';
import { MapPin, User, BookOpen } from 'lucide-react';

const days = ['月', '火', '水', '木', '金'];
const periods = [
  { id: 1, label: '1・2時限' },
  { id: 2, label: '3・4時限' },
  { id: 3, label: '5・6時限' },
  { id: 4, label: '7・8時限' },
  { id: 5, label: '9・10時限' }
];

const Timetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});

  useEffect(() => {
    setTimetable(getTimetable());
    setAttendanceData(getAttendance());
  }, []);

  const handleAttendance = (classId, type) => {
    toggleAttendance(classId, type);
    setAttendanceData(getAttendance());
  };

  const getClass = (dayIndex, periodId) => {
    return timetable.find(c => c.day === dayIndex && c.period === periodId);
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Timetable</h1>
        <p className="page-subtitle">前期時間割（クリックで出欠・持ち物メモを管理）</p>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', background: 'var(--glass-bg)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
          <thead>
            <tr>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', width: '80px' }}></th>
              {days.map((day, idx) => (
                <th key={idx} style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period.id}>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', textAlign: 'center', fontWeight: 'bold', background: 'rgba(0,0,0,0.1)' }}>
                  {period.label}
                </td>
                {days.map((_, dayIdx) => {
                  const cls = getClass(dayIdx, period.id);
                  const attendance = cls ? (attendanceData[cls.id] || { attended: 0, absent: 0, late: 0 }) : null;
                  
                  return (
                    <td key={dayIdx} style={{ padding: '8px', borderBottom: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', width: '18%', verticalAlign: 'top' }}>
                      {cls ? (
                        <div className="glass-card" style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.02)'} }}>
                          <h4 style={{ fontSize: '14px', color: '#60a5fa', marginBottom: '8px', wordBreak: 'break-word' }}>{cls.subject}</h4>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12}/> {cls.teacher}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {cls.room}</div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                            <button onClick={() => handleAttendance(cls.id, 'attended')} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', flex: 1, padding: '4px', borderRadius: '4px', fontSize: '11px' }}>
                              出 {attendance.attended}
                            </button>
                            <button onClick={() => handleAttendance(cls.id, 'late')} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', flex: 1, padding: '4px', borderRadius: '4px', fontSize: '11px' }}>
                              遅 {attendance.late}
                            </button>
                            <button onClick={() => handleAttendance(cls.id, 'absent')} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', flex: 1, padding: '4px', borderRadius: '4px', fontSize: '11px' }}>
                              欠 {attendance.absent}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ height: '100%', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)', fontSize: '24px' }}>
                          -
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Timetable;
