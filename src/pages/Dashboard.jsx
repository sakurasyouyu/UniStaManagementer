import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, MapPin, BookOpen, User, CheckCircle, AlertCircle, X, Plus, Minus, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { getTimetable, getTasks, getAttendance, updateAttendance, getMemos, saveMemo, saveTask } from '../utils/storage';
import { getClassIteration } from '../utils/academicCalendar';
import { useAuth } from '../context/AuthContext';

const periodTimes = {
  1: { label: '1・2時限', time: '08:40 - 10:10' },
  2: { label: '3・4時限', time: '10:20 - 11:50' },
  3: { label: '5・6時限', time: '12:45 - 14:15' },
  4: { label: '7・8時限', time: '14:25 - 15:55' },
  5: { label: '9・10時限', time: '16:05 - 17:35' },
};

const Dashboard = () => {
  const { user } = useAuth();
  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  
  // Dashboard Interactions State
  const [attendanceData, setAttendanceData] = useState({});
  const [memos, setMemos] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Modal Edit State
  const [editMemo, setEditMemo] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  
  const loadData = async () => {
    if (!user) return;
    const tasks = await getTasks(user.id);
    const pending = tasks.filter(t => !t.completed)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
    setUpcomingTasks(pending);
    setAttendanceData(await getAttendance(user.id));
    setMemos(await getMemos(user.id));
  };

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const today = new Date();
      const iter = getClassIteration(today);
      const currentSemester = (iter && iter.semester === '後期') ? 'second' : 'first';
      const timetable = await getTimetable(user.id, 2, currentSemester);
      
      const jsDay = today.getDay();
      let currentDayIndex = jsDay - 1;
      if (currentDayIndex < 0 || currentDayIndex > 4) currentDayIndex = 0;
      
      const todays = timetable.filter(c => c.day === currentDayIndex).sort((a, b) => a.period - b.period);
      setTodayClasses(todays);
      await loadData();
    };
    init();
  }, [user]);

  const todayDate = new Date();
  const todayStr = format(todayDate, 'yyyy年MM月dd日');
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const dayOfWeek = dayNames[todayDate.getDay()];
  
  const iterationInfo = getClassIteration(todayDate);

  const openClassModal = (cls) => {
    setSelectedClass(cls);
    setEditMemo(memos[cls.id] || '');
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setModalOpen(true);
  };

  const handleAttendance = async (classId, type, amount) => {
    await updateAttendance(user.id, classId, type, amount);
    await loadData();
  };

  const handleSaveMemo = async (classId) => {
    await saveMemo(user.id, classId, editMemo);
    await loadData();
    alert("メモを保存しました");
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDueDate) return;
    await saveTask(user.id, {
      title: newTaskTitle,
      subject: selectedClass.subject,
      dueDate: newTaskDueDate,
      completed: false
    });
    setNewTaskTitle('');
    setNewTaskDueDate('');
    await loadData();
    alert("課題を追加しました");
  };

  return (
    <>
      <div className="animate-fade-in" style={{ position: 'relative' }}>
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {todayStr} ({dayOfWeek}) の予定とタスク
          {iterationInfo && (
            <span style={{
              fontSize: '14px',
              padding: '4px 10px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontWeight: 'bold',
              color: 'var(--accent-secondary)'
            }}>
              {iterationInfo.info 
                ? `${iterationInfo.semester} - ${iterationInfo.info}` 
                : `${iterationInfo.semester} 第${iterationInfo.iteration}回`}
            </span>
          )}
        </p>
      </header>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Today's Classes */}
        <section className="glass-card">
          <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--accent-primary)" />
            今日の時間割 (クリックで出欠・メモ操作)
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {todayClasses.length > 0 ? todayClasses.map(cls => (
              <div 
                key={cls.id} 
                onClick={() => openClassModal(cls)}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.03)',
                  borderLeft: '4px solid var(--accent-primary)',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
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
                  {(attendanceData[cls.id] && attendanceData[cls.id].attended > 0) && (
                     <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                       出席×{attendanceData[cls.id].attended}
                     </div>
                  )}
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

      {modalOpen && selectedClass && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '40px 16px', overflowY: 'auto', zIndex: 100, backdropFilter: 'blur(4px)' }}
             onClick={() => setModalOpen(false)}>
          <div style={{ width: '100%', maxWidth: '500px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', flexShrink: 0 }}
               onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>
                {selectedClass.subject}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={16} /> {selectedClass.room}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={16} /> {selectedClass.teacher}</div>
            </div>

            {/* 出欠管理 */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                出欠管理
              </h3>
              <div className="modal-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                
                {/* 出席 */}
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#10b981', marginBottom: '8px' }}>出席</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => handleAttendance(selectedClass.id, 'attended', -1)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', cursor: 'pointer' }}><Minus size={16}/></button>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{(attendanceData[selectedClass.id] || {}).attended || 0}</span>
                    <button onClick={() => handleAttendance(selectedClass.id, 'attended', 1)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', cursor: 'pointer' }}><Plus size={16}/></button>
                  </div>
                </div>

                {/* 遅刻 */}
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '8px' }}>遅刻</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => handleAttendance(selectedClass.id, 'late', -1)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', cursor: 'pointer' }}><Minus size={16}/></button>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{(attendanceData[selectedClass.id] || {}).late || 0}</span>
                    <button onClick={() => handleAttendance(selectedClass.id, 'late', 1)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', cursor: 'pointer' }}><Plus size={16}/></button>
                  </div>
                </div>

                {/* 欠席 */}
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px' }}>欠席</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => handleAttendance(selectedClass.id, 'absent', -1)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}><Minus size={16}/></button>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{(attendanceData[selectedClass.id] || {}).absent || 0}</span>
                    <button onClick={() => handleAttendance(selectedClass.id, 'absent', 1)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}><Plus size={16}/></button>
                  </div>
                </div>

              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '24px 0' }}/>
            
            {/* メモ */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} /> メモ・備考
              </h3>
              <textarea 
                value={editMemo} 
                onChange={e => setEditMemo(e.target.value)} 
                placeholder="授業のメモや持ち物、テスト範囲などを記入できます"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', minHeight: '80px', resize: 'vertical', marginBottom: '12px' }}
              />
              <button onClick={() => handleSaveMemo(selectedClass.id)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent-secondary)', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
                メモを保存する
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '24px 0' }}/>

            {/* 課題追加 */}
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={18} /> 新規課題の登録
              </h3>
              <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>課題名</label>
                  <input 
                    type="text" 
                    required
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} 
                    placeholder="例: 第3回 課題レポート"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>提出期限</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', colorScheme: 'dark' }} 
                  />
                </div>
                <button type="submit" style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                  課題を追加
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
