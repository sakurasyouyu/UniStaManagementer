import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { getEffectiveDayIndex, getAnnualEvents, getClassIteration } from '../utils/academicCalendar';
import { getTimetable } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const dayFullNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timetable, setTimetable] = useState([]);
  const events = getAnnualEvents();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const iter = getClassIteration(currentDate);
      const currentSemester = (iter && iter.semester === '後期') ? 'second' : 'first';
      setTimetable(await getTimetable(user.id, 2, currentSemester));
    };
    load();
  }, [currentDate, user]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  // 当月の日付のみ（モバイルリスト用）
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Navigation header (shared)
  const navHeader = (
    <header className="page-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
      <div>
        <h1 className="page-title">Calendar</h1>
        <p className="page-subtitle">月間スケジュール・授業・行事</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '12px' }}>
        <button onClick={prevMonth} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}><ChevronLeft size={20} /></button>
        <span style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '120px', textAlign: 'center' }}>
          {format(currentDate, 'yyyy年 MM月')}
        </span>
        <button onClick={nextMonth} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}><ChevronRight size={20} /></button>
      </div>
    </header>
  );

  if (isMobile) {
    // ===== モバイル: 縦スクロールの日付リスト =====
    return (
      <div className="animate-fade-in">
        {navHeader}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {monthDays.map((day, idx) => {
            const isTodayDate = isToday(day);
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayOfWeek = day.getDay(); // 0=Sun, 6=Sat
            const dailyEvents = events.filter(e => e.date === dateStr);
            const effectiveDayIdx = getEffectiveDayIndex(day);
            const iterationInfo = getClassIteration(day);
            const dailyClasses = effectiveDayIdx !== null
              ? timetable.filter(c => c.day === effectiveDayIdx).sort((a, b) => a.period - b.period)
              : [];

            const hasContent = dailyEvents.length > 0 || dailyClasses.length > 0 || isTodayDate;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // 授業も行事もない平日は小さく表示
            if (!hasContent && !isWeekend) {
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 12px', borderRadius: '8px', opacity: 0.4 }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', minWidth: '36px' }}>
                    {format(day, 'd')}日 <span style={{ fontSize: '12px' }}>({dayNames[dayOfWeek]})</span>
                  </span>
                  {iterationInfo?.iteration && effectiveDayIdx !== null && (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.7 }}>第{iterationInfo.iteration}回</span>
                  )}
                </div>
              );
            }

            return (
              <div key={idx} className="glass-card" style={{
                padding: '12px 16px',
                borderLeft: isTodayDate ? '4px solid var(--accent-primary)' : isWeekend ? `4px solid ${dayOfWeek === 0 ? '#ef4444' : '#3b82f6'}` : '4px solid transparent',
                background: isTodayDate ? 'rgba(99, 102, 241, 0.08)' : 'var(--card-bg)',
              }}>
                {/* 日付ヘッダー */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: (dailyEvents.length > 0 || dailyClasses.length > 0) ? '10px' : '0' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: isTodayDate ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                    color: isTodayDate ? '#fff' : (dayOfWeek === 0 ? '#ef4444' : dayOfWeek === 6 ? '#3b82f6' : 'var(--text-primary)'),
                    fontWeight: 'bold', fontSize: '14px', flexShrink: 0
                  }}>
                    {format(day, 'd')}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: isTodayDate ? 'bold' : 'normal', color: dayOfWeek === 0 ? '#ef4444' : dayOfWeek === 6 ? '#3b82f6' : 'var(--text-primary)' }}>
                    {dayFullNames[dayOfWeek]}
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {iterationInfo?.iteration && effectiveDayIdx !== null && (
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(167,139,250,0.3)', letterSpacing: '0.05em' }}>
                        {['月','火','水','木','金'][effectiveDayIdx]}{iterationInfo.iteration}
                      </span>
                    )}
                    {isTodayDate && (
                      <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>今日</span>
                    )}
                  </div>
                </div>

                {/* 行事ラベル */}
                {dailyEvents.map((ev, i) => (
                  <div key={`ev-${i}`} style={{
                    fontSize: '13px', padding: '6px 10px', borderRadius: '6px', marginBottom: '6px',
                    background: ev.type === 'holiday' ? 'rgba(16, 185, 129, 0.15)' : ev.type === 'exam' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                    color: ev.type === 'holiday' ? '#34d399' : ev.type === 'exam' ? '#f87171' : '#c084fc',
                    fontWeight: 'bold'
                  }}>
                    {ev.title}
                  </div>
                ))}

                {/* 授業リスト */}
                {dailyClasses.map(cls => (
                  <div key={cls.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '6px 10px', borderRadius: '6px', marginBottom: '4px',
                    background: 'rgba(255,255,255,0.04)',
                    borderLeft: '3px solid var(--accent-primary)'
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--accent-secondary)', fontWeight: 'bold', minWidth: '32px' }}>{cls.period}限</span>
                    <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{cls.subject}</span>
                  </div>
                ))}

                {/* 休講情報 */}
                {effectiveDayIdx === null && iterationInfo?.info && dailyEvents.length === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{iterationInfo.info}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== デスクトップ: 月間グリッドカレンダー =====
  return (
    <div className="animate-fade-in">
      {navHeader}

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--glass-border)' }}>
          {dayNames.map((day, idx) => (
            <div key={idx} style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: idx === 0 ? '#ef4444' : idx === 6 ? '#3b82f6' : 'var(--text-primary)', fontSize: '14px' }}>
              {day}
            </div>
          ))}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const dateStr = format(day, 'yyyy-MM-dd');
            const dailyEvents = events.filter(e => e.date === dateStr);
            const effectiveDayIdx = getEffectiveDayIndex(day);
            const dailyClasses = effectiveDayIdx !== null 
              ? timetable.filter(c => c.day === effectiveDayIdx).sort((a, b) => a.period - b.period) 
              : [];
            const iterationInfo = getClassIteration(day);
            const hasClasses = dailyClasses.length > 0;

            return (
              <div key={idx} style={{
                minHeight: '130px',
                padding: '8px',
                borderRight: (idx % 7 !== 6) ? '1px solid var(--glass-border)' : 'none',
                borderBottom: '1px solid var(--glass-border)',
                background: isTodayDate ? 'rgba(56, 189, 248, 0.05)' : isCurrentMonth ? 'transparent' : 'rgba(0,0,0,0.2)',
                opacity: isCurrentMonth ? 1 : 0.5,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: isTodayDate ? 'var(--accent-primary)' : 'transparent',
                    color: isTodayDate ? '#fff' : (day.getDay() === 0 ? '#ef4444' : day.getDay() === 6 ? '#3b82f6' : 'var(--text-primary)'),
                    fontWeight: isTodayDate ? 'bold' : 'normal',
                    fontSize: '14px'
                  }}>
                    {format(day, 'd')}
                  </span>
                  {iterationInfo && iterationInfo.iteration && effectiveDayIdx !== null && (
                    <span style={{
                      fontSize: '11px', fontWeight: 'bold',
                      color: '#a78bfa',
                      background: 'rgba(167,139,250,0.12)',
                      padding: '2px 6px', borderRadius: '8px',
                      border: '1px solid rgba(167,139,250,0.3)',
                      letterSpacing: '0.05em'
                    }}>
                      {['月','火','水','木','金'][effectiveDayIdx]}{iterationInfo.iteration}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
                  {dailyEvents.map((ev, i) => (
                     <div key={`ev-${i}`} style={{
                       fontSize: '11px', padding: '3px 6px', borderRadius: '4px',
                       background: ev.type === 'holiday' ? 'rgba(16, 185, 129, 0.2)' : ev.type === 'exam' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                       color: ev.type === 'holiday' ? '#34d399' : ev.type === 'exam' ? '#f87171' : '#c084fc',
                       fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                     }}>
                       {ev.title}
                     </div>
                  ))}
                  {dailyClasses.map((cls) => (
                    <div key={cls.id} style={{
                      fontSize: '11px', padding: '4px 6px', borderRadius: '4px',
                      background: 'rgba(255,255,255,0.05)', borderLeft: '2px solid var(--accent-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      display: 'flex', gap: '4px'
                    }}>
                      <span style={{ opacity: 0.7 }}>{cls.period}限</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls.subject}</span>
                    </div>
                  ))}
                  {effectiveDayIdx === null && iterationInfo && iterationInfo.info && dailyEvents.length === 0 && (
                    <div style={{ fontSize: '11px', padding: '2px 4px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                       {iterationInfo.info}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
