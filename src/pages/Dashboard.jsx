import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, MapPin, BookOpen, User, CheckCircle, AlertCircle } from 'lucide-react';
import { getTimetable, getTasks } from '../utils/storage';

const periodTimes = {
  1: { label: '1・2時限', time: '08:40 - 10:10' },
  2: { label: '3・4時限', time: '10:20 - 11:50' },
  3: { label: '5・6時限', time: '12:45 - 14:15' },
  4: { label: '7・8時限', time: '14:25 - 15:55' },
  5: { label: '9・10時限', time: '16:05 - 17:35' },
};

const Dashboard = () => {
  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  
  useEffect(() => {
    const timetable = getTimetable();
    const tasks = getTasks();
    
    // JS dates: 0: Sun, 1: Mon, ... 6: Sat
    // Our timetable day: 0: Mon, ... 4: Fri
    const jsDay = new Date().getDay();
    let currentDayIndex = jsDay - 1;
    // If weekend, show monday's classes as preview
    if (currentDayIndex < 0 || currentDayIndex > 4) {
      currentDayIndex = 0; 
    }
    
    const todays = timetable.filter(c => c.day === currentDayIndex).sort((a, b) => a.period - b.period);
    setTodayClasses(todays);
    
    const pending = tasks.filter(t => !t.completed)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
      
    setUpcomingTasks(pending);
  }, []);

  const todayStr = format(new Date(), 'yyyy年MM月dd日');
  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
  const dayOfWeek = dayNames[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{todayStr} ({dayOfWeek}) の予定とタスク</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Today's Classes */}
        <section className="glass-card">
          <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--accent-primary)" />
            今日の時間割
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {todayClasses.length > 0 ? todayClasses.map(cls => (
              <div key={cls.id} style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                background: 'rgba(255,255,255,0.03)',
                borderLeft: '4px solid var(--accent-primary)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-secondary)'}}>{periodTimes[cls.period]?.label}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)'}}>{periodTimes[cls.period]?.time}</span>
                </div>
                <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>{cls.subject}</h3>
                
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> {cls.room}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={14} /> {cls.teacher}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <BookOpen size={14} /> {cls.credits}単位
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                今日の授業はありません 🎉
              </div>
            )}
          </div>
        </section>

        {/* Tasks */}
        <section className="glass-card">
          <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} color="var(--success)" />
            直近の課題
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingTasks.length > 0 ? upcomingTasks.map(task => {
              const isUrgent = new Date(task.dueDate) < new Date(Date.now() + 86400000 * 2); // Less than 2 days
              return (
                <div key={task.id} style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.03)',
                  border: isUrgent ? '1px solid var(--danger)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  {isUrgent ? <AlertCircle size={20} color="var(--danger)" style={{ flexShrink: 0 }} /> : <BookOpen size={20} color="var(--accent-secondary)" style={{ flexShrink: 0 }}/>}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>{task.title}</h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>科目: {task.subject}</p>
                    <p style={{ fontSize: '12px', color: isUrgent ? 'var(--danger)' : 'var(--text-secondary)', marginTop: '8px' }}>
                      締切: {format(new Date(task.dueDate), 'yyyy/MM/dd HH:mm')}
                    </p>
                  </div>
                </div>
              )
            }) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                直近の課題はありません。素晴らしい！
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
