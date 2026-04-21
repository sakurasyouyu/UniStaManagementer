import React, { useState, useEffect } from 'react';
import { getTimetable, updateAttendance, getAttendance, getMemos, saveMemo, saveClass, deleteClass } from '../utils/storage';
import { MapPin, User, FileText, X, Trash2, Plus, Minus, ChevronRight } from 'lucide-react';
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

const days = ['月', '火', '水', '木', '金'];
const periods = [
  { id: 1, label: '1・2時限' },
  { id: 2, label: '3・4時限' },
  { id: 3, label: '5・6時限' },
  { id: 4, label: '7・8時限' },
  { id: 5, label: '9・10時限' }
];

const dayLabels = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];

const Timetable = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [timetable, setTimetable] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [memos, setMemos] = useState({});
  
  const [selectedYear, setSelectedYear] = useState(2);
  const [selectedSemester, setSelectedSemester] = useState('first');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // { day, period, classData }

  // Modal Editing States
  const [editSubject, setEditSubject] = useState('');
  const [editTeacher, setEditTeacher] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [editSyllabusUrl, setEditSyllabusUrl] = useState('');

  const loadData = async () => {
    if (!user) return;
    setTimetable(await getTimetable(user.id, selectedYear, selectedSemester));
    setAttendanceData(await getAttendance(user.id));
    setMemos(await getMemos(user.id));
  };

  useEffect(() => {
     
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedSemester, user]);

  const handleAttendance = async (classId, type, amount) => {
    await updateAttendance(user.id, classId, type, amount);
    setAttendanceData(await getAttendance(user.id));
  };

  const handleSaveMemo = async (classId) => {
    await saveMemo(user.id, classId, editMemo);
    setMemos(await getMemos(user.id));
    alert("メモを保存しました");
  };

  const handleSaveClass = async () => {
    if (!editSubject.trim()) {
      alert('科目名を入力してください');
      return;
    }
    try {
      const newClass = {
        id: selectedSlot.classData ? selectedSlot.classData.id : undefined,
        year: selectedYear,
        semester: selectedSemester,
        day: selectedSlot.day,
        period: selectedSlot.period,
        subject: editSubject,
        teacher: editTeacher,
        room: editRoom,
        syllabusUrl: editSyllabusUrl,
        credits: selectedSlot.classData ? selectedSlot.classData.credits : 2.0
      };
      await saveClass(user.id, newClass);
      await loadData();
      setModalOpen(false);
    } catch (e) {
      console.error(e);
      alert(`保存に失敗しました。\n${e?.message || e}`);
    }
  };

  const handleDeleteClass = async () => {
    if (selectedSlot.classData && window.confirm("本当にこの授業を削除しますか？")) {
      await deleteClass(user.id, selectedSlot.classData.id);
      await loadData();
      setModalOpen(false);
    }
  };

  const openSlot = (dayIndex, periodId) => {
    const cls = timetable.find(c => c.day === dayIndex && c.period === periodId);
    setSelectedSlot({ day: dayIndex, period: periodId, classData: cls });
    
    if (cls) {
      setEditSubject(cls.subject || '');
      setEditTeacher(cls.teacher || '');
      setEditRoom(cls.room || '');
      setEditSyllabusUrl(cls.syllabusUrl || '');
      setEditMemo(memos[cls.id] || '');
    } else {
      setEditSubject('');
      setEditTeacher('');
      setEditRoom('');
      setEditSyllabusUrl('');
      setEditMemo('');
    }
    setModalOpen(true);
  };

  const getClass = (dayIndex, periodId) => {
    return timetable.find(c => c.day === dayIndex && c.period === periodId);
  };

  return (
    <>
      <div className="animate-fade-in" style={{ position: 'relative' }}>
      <header className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h1 className="page-title">Timetable</h1>
          <p className="page-subtitle">学期ごとの時間割（セルをクリックして詳細や出席・メモを管理できます）</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y} style={{ color: '#000' }}>{y}年</option>)}
          </select>

          <select 
            value={selectedSemester} 
            onChange={(e) => setSelectedSemester(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <option value="first" style={{ color: '#000' }}>前期</option>
            <option value="second" style={{ color: '#000' }}>後期</option>
          </select>
        </div>
      </header>

      {/* ===== モバイル: 曜日ごと縦リスト ===== */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '16px' }}>
          {days.map((day, dayIdx) => {
            const dayClasses = timetable
              .filter(c => c.day === dayIdx)
              .sort((a, b) => a.period - b.period);
            return (
              <div key={dayIdx} className="glass-card" style={{ padding: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }}>{day}</span>
                  {dayLabels[dayIdx]}
                </h2>
                {dayClasses.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {dayClasses.map(cls => (
                      <div key={cls.id}
                        onClick={() => openSlot(dayIdx, cls.period)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', borderLeft: '3px solid var(--accent-primary)', cursor: 'pointer', transition: 'background 0.2s' }}
                        onTouchStart={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onTouchEnd={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      >
                        <div style={{ flexShrink: 0, minWidth: '56px', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--accent-secondary)', fontWeight: 'bold', display: 'block' }}>{periods.find(p => p.id === cls.period)?.label}</span>
                          {(attendanceData[cls.id]?.attended > 0) && (
                            <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 4px', borderRadius: '4px' }}>出席×{attendanceData[cls.id].attended}</span>
                          )}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '4px', wordBreak: 'break-word' }}>{cls.subject}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {cls.teacher && <span style={{ display: 'flex', alignItems: 'center', gap: '2px'}}><User size={11}/>{cls.teacher}</span>}
                            {cls.room && <span style={{ display: 'flex', alignItems: 'center', gap: '2px'}}><MapPin size={11}/>{cls.room}</span>}
                          </p>
                        </div>
                        <ChevronRight size={18} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                      </div>
                    ))}
                    {/* 授業のない時限を追加できるボタン */}
                    {periods.filter(p => !dayClasses.find(c => c.period === p.id)).map(p => (
                      <button key={p.id}
                        onClick={() => openSlot(dayIdx, p.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '12px', width: '100%' }}
                      >
                        <Plus size={14} />
                        {p.label} を追加
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                    授業なし
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {periods.map(p => (
                        <button key={p.id} onClick={() => openSlot(dayIdx, p.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '12px', width: '100%' }}>
                          <Plus size={14} /> {p.label} を追加
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ===== デスクトップ: 表形式 ===== */
        <div style={{ overflowX: 'auto', paddingBottom: '32px' }}>
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
                    return (
                      <td key={dayIdx}
                          onClick={() => openSlot(dayIdx, period.id)}
                          style={{ padding: '8px', borderBottom: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', width: '18%', verticalAlign: 'top', cursor: 'pointer', transition: 'background 0.2s', background: 'transparent' }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {cls ? (
                          <div style={{ padding: '8px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ fontSize: '14px', color: '#60a5fa', marginBottom: '8px', wordBreak: 'break-word' }}>{cls.subject}</h4>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12}/> {cls.teacher}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {cls.room}</div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: '100%', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)' }}>
                            <Plus size={24} />
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
      )}
      </div>

      {modalOpen && selectedSlot && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '40px 16px', overflowY: 'auto', zIndex: 100, backdropFilter: 'blur(4px)' }}
             onClick={() => setModalOpen(false)}>
          <div style={{ width: '100%', maxWidth: '500px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', flexShrink: 0 }}
               onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>
                {days[selectedSlot.day]}曜 {selectedSlot.period}限の授業
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>科目名</label>
              <input type="text" value={editSubject} onChange={e => setEditSubject(e.target.value)} placeholder="未登録"
                     style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', marginBottom: '16px' }} />

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>教員名</label>
                  <input type="text" value={editTeacher} onChange={e => setEditTeacher(e.target.value)} placeholder="未登録"
                         style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>教室</label>
                  <input type="text" value={editRoom} onChange={e => setEditRoom(e.target.value)} placeholder="未登録"
                         style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>シラバスURL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={editSyllabusUrl} onChange={e => setEditSyllabusUrl(e.target.value)} placeholder="https://..."
                         style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }} />
                  {editSyllabusUrl && (
                    <a href={editSyllabusUrl.startsWith('http') ? editSyllabusUrl : `https://${editSyllabusUrl}`} target="_blank" rel="noopener noreferrer" 
                       style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>
                      開く
                    </a>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleSaveClass} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>保存する</button>
                {selectedSlot.classData && (
                  <button onClick={handleDeleteClass} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--danger)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', cursor: 'pointer' }}>
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>

            {selectedSlot.classData && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '24px 0' }}/>
                
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    出欠管理
                  </h3>
                  <div className="modal-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    
                    {/* 出席 */}
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#10b981', marginBottom: '8px' }}>出席</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => handleAttendance(selectedSlot.classData.id, 'attended', -1)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', cursor: 'pointer' }}><Minus size={16}/></button>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{(attendanceData[selectedSlot.classData.id] || {}).attended || 0}</span>
                        <button onClick={() => handleAttendance(selectedSlot.classData.id, 'attended', 1)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', cursor: 'pointer' }}><Plus size={16}/></button>
                      </div>
                    </div>

                    {/* 遅刻 */}
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '8px' }}>遅刻</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => handleAttendance(selectedSlot.classData.id, 'late', -1)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', cursor: 'pointer' }}><Minus size={16}/></button>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{(attendanceData[selectedSlot.classData.id] || {}).late || 0}</span>
                        <button onClick={() => handleAttendance(selectedSlot.classData.id, 'late', 1)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', cursor: 'pointer' }}><Plus size={16}/></button>
                      </div>
                    </div>

                    {/* 欠席 */}
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px' }}>欠席</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => handleAttendance(selectedSlot.classData.id, 'absent', -1)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}><Minus size={16}/></button>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{(attendanceData[selectedSlot.classData.id] || {}).absent || 0}</span>
                        <button onClick={() => handleAttendance(selectedSlot.classData.id, 'absent', 1)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}><Plus size={16}/></button>
                      </div>
                    </div>

                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} /> メモ・備考
                  </h3>
                  <textarea 
                    value={editMemo} 
                    onChange={e => setEditMemo(e.target.value)} 
                    placeholder="授業のメモや持ち物、テスト範囲などを記入できます"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', minHeight: '100px', resize: 'vertical', marginBottom: '12px' }}
                  />
                  <button onClick={() => handleSaveMemo(selectedSlot.classData.id)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent-secondary)', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
                    メモを保存する
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default Timetable;
