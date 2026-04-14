import React, { useState, useEffect } from 'react';
import { getTasks, saveTask, deleteTask, getTimetable } from '../utils/storage';
import { Plus, Trash2, Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', subject: '', dueDate: '', completed: false });

  useEffect(() => {
    setTasks(getTasks());
    setTimetable(getTimetable());
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.dueDate) return;
    saveTask(newTask);
    setTasks(getTasks());
    setIsModalOpen(false);
    setNewTask({ title: '', subject: '', dueDate: '', completed: false });
  };

  const handleDelete = (id) => {
    deleteTask(id);
    setTasks(getTasks());
  };

  const toggleComplete = (task) => {
    saveTask({ ...task, completed: !task.completed });
    setTasks(getTasks());
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Tasks & Assignments</h1>
          <p className="page-subtitle">課題と提出期限の管理</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          新規課題
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tasks.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)' }}>
            <CheckCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            課題は登録されていません。
          </div>
        ) : (
          tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(task => (
            <div key={task.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '24px', opacity: task.completed ? 0.6 : 1, transition: 'all 0.3s' }}>
              
              <button 
                onClick={() => toggleComplete(task)}
                style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', 
                  border: `2px solid ${task.completed ? 'var(--success)' : 'var(--text-secondary)'}`,
                  background: task.completed ? 'var(--success)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', flexShrink: 0
                }}
              >
                {task.completed && <CheckCircle size={20} />}
              </button>

              <div style={{ flex: 1, textDecoration: task.completed ? 'line-through' : 'none' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{task.title}</h3>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  <span>科目: {task.subject || 'その他'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: new Date(task.dueDate) < new Date() && !task.completed ? 'var(--danger)' : 'inherit' }}>
                    <CalendarIcon size={14} /> 
                    {format(new Date(task.dueDate), 'yyyy/MM/dd HH:mm')}
                  </span>
                </div>
              </div>

              <button className="btn-icon" onClick={() => handleDelete(task.id)} style={{ color: 'var(--danger)' }}>
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px' }}>新規課題の追加</h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>課題名</label>
                <input 
                  type="text" 
                  required
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }} 
                  placeholder="例: 第1回レポート"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>関連科目</label>
                <select 
                  value={newTask.subject}
                  onChange={e => setNewTask({...newTask, subject: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: '#1e293b', color: 'white', outline: 'none' }}
                >
                  <option value="">(なし)</option>
                  {[...new Set(timetable.map(c => c.subject))].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>提出期限</label>
                <input 
                  type="datetime-local" 
                  required
                  value={newTask.dueDate}
                  onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', colorScheme: 'dark' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>キャンセル</button>
                <button type="submit" className="btn-primary">追加する</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
