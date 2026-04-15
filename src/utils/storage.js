import { supabase } from './supabase';

const defaultTimetable = [
  { id: "mon-1", year: 2, semester: 'first', day: 0, period: 1, subject: "コンピュータネットワーク", teacher: "野口 靖浩", room: "共通講義棟３１", credits: 2.0, code: "IN012160060" },
  { id: "mon-5", year: 2, semester: 'first', day: 0, period: 5, subject: "論理回路", teacher: "塩見 彰睦", room: "情１３", credits: 2.0, code: "IN012160040" },
  { id: "tue-1", year: 2, semester: 'first', day: 1, period: 1, subject: "プログラミング方法論", teacher: "塩見 彰睦", room: "情１３", credits: 2.0, code: "IN002160050" },
  { id: "wed-1", year: 2, semester: 'first', day: 2, period: 1, subject: "モデリング", teacher: "尾張 正樹 他", room: "共通講義棟３１", credits: 1.0, code: "IN012160100" },
  { id: "wed-2", year: 2, semester: 'first', day: 2, period: 2, subject: "日本国憲法", teacher: "原田 伸一朗", room: "情１３", credits: 2.0, code: "LA011170060" },
  { id: "wed-3", year: 2, semester: 'first', day: 2, period: 3, subject: "オートマトンと言語理論", teacher: "尾張 正樹", room: "情１３", credits: 2.0, code: "IN012160010" },
  { id: "wed-4", year: 2, semester: 'first', day: 2, period: 4, subject: "アルゴリズムとデータ構造", teacher: "小暮 悟 他", room: "共通講義棟２１", credits: 2.0, code: "IN012260050" },
  { id: "wed-5", year: 2, semester: 'first', day: 2, period: 5, subject: "アルゴリズムとデータ構造", teacher: "小暮 悟 他", room: "共通講義棟２１", credits: 2.0, code: "IN012260050" },
  { id: "thu-2", year: 2, semester: 'first', day: 3, period: 2, subject: "情報理論", teacher: "杉浦 彰彦", room: "情１３", credits: 2.0, code: "IN002160010" },
  { id: "thu-3", year: 2, semester: 'first', day: 3, period: 3, subject: "(中等) 発達と学習", teacher: "金子 泰之", room: "工５－２１", credits: 2.0, code: "LA011170030" },
  { id: "fri-1", year: 2, semester: 'first', day: 4, period: 1, subject: "微分積分学 I", teacher: "新谷 誠", room: "共通講義棟３１", credits: 2.0, code: "LA012170050" },
  { id: "fri-2", year: 2, semester: 'first', day: 4, period: 2, subject: "線形代数学 I", teacher: "新谷 誠", room: "共通講義棟３１", credits: 2.0, code: "LA012170050" },
  { id: "fri-5", year: 2, semester: 'first', day: 4, period: 5, subject: "信号処理基礎", teacher: "青木 徹 他", room: "工３－３１", credits: 2.0, code: "IN012160050" }
];

// DB行 → JSオブジェクト
const mapFromDB = (row) => ({
  id: row.id,
  year: row.year,
  semester: row.semester,
  day: row.day,
  period: row.period,
  subject: row.subject,
  teacher: row.teacher || '',
  room: row.room || '',
  credits: row.credits,
  code: row.code || '',
  syllabusUrl: row.syllabus_url || '',
});

// JSオブジェクト → DB行
const mapToDB = (cls, userId) => ({
  id: cls.id,
  user_id: userId,
  year: cls.year,
  semester: cls.semester,
  day: cls.day,
  period: cls.period,
  subject: cls.subject,
  teacher: cls.teacher || '',
  room: cls.room || '',
  credits: cls.credits || 2.0,
  code: cls.code || '',
  syllabus_url: cls.syllabusUrl || '',
});

// --- Timetable ---
export const getTimetable = async (userId, year, semester) => {
  const { data, error } = await supabase
    .from('timetable')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('semester', semester);
  if (error) throw error;

  // 初回ログイン時：2年前期のデフォルトデータを投入
  if (data.length === 0 && year === 2 && semester === 'first') {
    const toInsert = defaultTimetable.map(c => mapToDB(c, userId));
    const { data: inserted, error: insertError } = await supabase
      .from('timetable').insert(toInsert).select();
    if (!insertError && inserted) return inserted.map(mapFromDB);
    return [];
  }
  return data.map(mapFromDB);
};

export const saveClass = async (userId, cls) => {
  if (!cls.id) {
    cls.id = `cls-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }
  const row = mapToDB(cls, userId);
  const { error } = await supabase.from('timetable').upsert(row);
  if (error) throw error;
  return cls.id;
};

export const deleteClass = async (userId, classId) => {
  const { error } = await supabase
    .from('timetable').delete()
    .eq('user_id', userId).eq('id', classId);
  if (error) throw error;
};

// --- Attendance ---
export const getAttendance = async (userId) => {
  const { data, error } = await supabase
    .from('attendance').select('*').eq('user_id', userId);
  if (error) throw error;
  const result = {};
  data.forEach(row => {
    result[row.class_id] = { attended: row.attended, late: row.late, absent: row.absent };
  });
  return result;
};

export const updateAttendance = async (userId, classId, type, amount) => {
  const { data } = await supabase
    .from('attendance').select('*')
    .eq('user_id', userId).eq('class_id', classId).maybeSingle();

  const current = data || { attended: 0, late: 0, absent: 0 };
  const newVal = Math.max(0, (current[type] || 0) + amount);

  const { error } = await supabase.from('attendance').upsert({
    user_id: userId,
    class_id: classId,
    attended: type === 'attended' ? newVal : (current.attended || 0),
    late: type === 'late' ? newVal : (current.late || 0),
    absent: type === 'absent' ? newVal : (current.absent || 0),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
};

// --- Memos ---
export const getMemos = async (userId) => {
  const { data, error } = await supabase
    .from('memos').select('*').eq('user_id', userId);
  if (error) throw error;
  const result = {};
  data.forEach(row => { result[row.class_id] = row.content; });
  return result;
};

export const saveMemo = async (userId, classId, content) => {
  const { error } = await supabase.from('memos').upsert({
    user_id: userId,
    class_id: classId,
    content,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
};

// --- Tasks ---
export const getTasks = async (userId) => {
  const { data, error } = await supabase
    .from('tasks').select('*').eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    title: row.title,
    subject: row.subject || '',
    dueDate: row.due_date,
    completed: row.completed,
  }));
};

export const saveTask = async (userId, task) => {
  const row = {
    user_id: userId,
    title: task.title,
    subject: task.subject || '',
    due_date: task.dueDate,
    completed: task.completed || false,
    updated_at: new Date().toISOString(),
  };
  if (task.id) {
    row.id = task.id;
    const { error } = await supabase.from('tasks').upsert(row);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('tasks').insert(row);
    if (error) throw error;
  }
};

export const deleteTask = async (userId, taskId) => {
  const { error } = await supabase.from('tasks').delete()
    .eq('user_id', userId).eq('id', taskId);
  if (error) throw error;
};

// --- Auth helpers ---
export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
