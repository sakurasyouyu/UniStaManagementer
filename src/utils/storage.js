const TIMETABLE_KEY = "uni_timetable";
const TASKS_KEY = "uni_tasks";
const ATTENDANCE_KEY = "uni_attendance";
const BELONGINGS_KEY = "uni_belongings";

const defaultTimetable = [
  // Monday
  { id: "mon-1", day: 0, period: 1, subject: "コンピュータネットワーク", teacher: "野口 靖浩", room: "共通講義棟３１", credits: 2.0, code: "IN012160060" },
  { id: "mon-5", day: 0, period: 5, subject: "論理回路", teacher: "塩見 彰睦", room: "情１３", credits: 2.0, code: "IN012160040" },
  
  // Tuesday
  { id: "tue-1", day: 1, period: 1, subject: "プログラミング方法論", teacher: "塩見 彰睦", room: "情１３", credits: 2.0, code: "IN002160050" },

  // Wednesday
  { id: "wed-1", day: 2, period: 1, subject: "モデリング", teacher: "尾張 正樹 他", room: "共通講義棟３１", credits: 1.0, code: "IN012160100" },
  { id: "wed-2", day: 2, period: 2, subject: "日本国憲法", teacher: "原田 伸一朗", room: "情１３", credits: 2.0, code: "LA011170060" },
  { id: "wed-3", day: 2, period: 3, subject: "オートマトンと言語理論", teacher: "尾張 正樹", room: "情１３", credits: 2.0, code: "IN012160010" },
  { id: "wed-4", day: 2, period: 4, subject: "アルゴリズムとデータ構造", teacher: "小暮 悟 他", room: "共通講義棟２１", credits: 2.0, code: "IN012260050" },
  { id: "wed-5", day: 2, period: 5, subject: "アルゴリズムとデータ構造", teacher: "小暮 悟 他", room: "共通講義棟２１", credits: 2.0, code: "IN012260050" },

  // Thursday
  { id: "thu-2", day: 3, period: 2, subject: "情報理論", teacher: "杉浦 彰彦", room: "情１３", credits: 2.0, code: "IN002160010" },
  { id: "thu-3", day: 3, period: 3, subject: "(中等) 発達と学習", teacher: "金子 泰之", room: "工５－２１", credits: 2.0, code: "LA011170030" },

  // Friday
  { id: "fri-1", day: 4, period: 1, subject: "微分積分学 I", teacher: "新谷 誠", room: "共通講義棟３１", credits: 2.0, code: "LA012170050" },
  { id: "fri-2", day: 4, period: 2, subject: "線形代数学 I", teacher: "新谷 誠", room: "共通講義棟３１", credits: 2.0, code: "LA012170050" },
  { id: "fri-5", day: 4, period: 5, subject: "信号処理基礎", teacher: "青木 徹 他", room: "工３－３１", credits: 2.0, code: "IN012160050" }
];

export const getTimetable = () => {
  const data = localStorage.getItem(TIMETABLE_KEY);
  if (data) {
    return JSON.parse(data);
  }
  // 初回起動時はデフォルトを保存して返す
  localStorage.setItem(TIMETABLE_KEY, JSON.stringify(defaultTimetable));
  return defaultTimetable;
};

export const saveClass = (classData) => {
  const timetable = getTimetable();
  const existingIndex = timetable.findIndex(c => c.id === classData.id);
  if (existingIndex >= 0) {
    timetable[existingIndex] = classData;
  } else {
    timetable.push(classData);
  }
  localStorage.setItem(TIMETABLE_KEY, JSON.stringify(timetable));
};

export const deleteClass = (id) => {
  const timetable = getTimetable().filter(c => c.id !== id);
  localStorage.setItem(TIMETABLE_KEY, JSON.stringify(timetable));
};

// --- Tasks ---
export const getTasks = () => {
  const data = localStorage.getItem(TASKS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTask = (task) => {
  const tasks = getTasks();
  if (task.id) {
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) tasks[idx] = task;
    else tasks.push(task);
  } else {
    tasks.push({ ...task, id: Math.random().toString(36).substring(2, 9), createdAt: new Date().toISOString() });
  }
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const deleteTask = (id) => {
  const tasks = getTasks().filter(t => t.id !== id);
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

// --- Attendance ---
export const getAttendance = () => {
  const data = localStorage.getItem(ATTENDANCE_KEY);
  return data ? JSON.parse(data) : {}; // { "mon-1": { attended: 5, absent: 1, late: 0 } }
};

export const toggleAttendance = (classId, type) => {
  // type: 'attended' | 'absent' | 'late'
  const attendance = getAttendance();
  if (!attendance[classId]) {
    attendance[classId] = { attended: 0, absent: 0, late: 0 };
  }
  attendance[classId][type] += 1;
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance));
};

export const resetAttendance = (classId) => {
  const attendance = getAttendance();
  if (attendance[classId]) {
    attendance[classId] = { attended: 0, absent: 0, late: 0 };
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance));
  }
};

// --- Belongings ---
export const getBelongings = () => {
  const data = localStorage.getItem(BELONGINGS_KEY);
  return data ? JSON.parse(data) : {}; // { "mon-1": ["PC", "教科書A"] }
};

export const saveBelongings = (classId, items) => {
  const belongings = getBelongings();
  belongings[classId] = items;
  localStorage.setItem(BELONGINGS_KEY, JSON.stringify(belongings));
};
