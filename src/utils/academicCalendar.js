import { format } from 'date-fns';

// ============================================================
// 国民の祝日・大学独自の休業日（全曜日対象）
// ============================================================
// 【注意】以下の日付は通常の祝日と異なる扱い:
//  - 1/4(月), 1/5(火) → 冬季休業明け授業日 → リストに含めない
//  - 10/30(金), 11/6(金), 1/15(金) → 金曜授業のみ休講
//    （その日は金曜日なので「全授業休講」と同義）
// ============================================================
const holidays = [
  // 前期（4月〜9月）
  '2026-04-29', // 昭和の日【水】
  '2026-05-04', // みどりの日【月】
  '2026-05-05', // こどもの日【火】
  '2026-05-06', // 振替休日【水】
  '2026-07-20', // 海の日【月】（祝日のため休講）

  // 後期（10月〜3月）
  '2026-09-21', // 敬老の日
  '2026-09-22', // 国民の休日
  '2026-09-23', // 秋分の日
  '2026-10-12', // スポーツの日【月】
  '2026-10-30', // 大学祭（静岡）のため金曜休講【金】
  '2026-11-03', // 文化の日【火】
  '2026-11-06', // テクノフェスタ・大学祭（浜松）のため金曜休講【金】
  '2026-11-23', // 勤労感謝の日【月】
  // 冬季休業（12/28〜1/1）
  '2026-12-28', // 月
  '2026-12-29', // 火
  '2026-12-30', // 水
  '2026-12-31', // 木
  '2027-01-01', // 元日【金】
  // ※1/4(月), 1/5(火) は授業実施のためリストに含めない
  '2027-01-11', // 成人の日【月】
  '2027-01-15', // 大学入学共通テスト設営のため金曜休講【金】
  '2027-02-11', // 建国記念の日【木】
  '2027-02-23', // 天皇誕生日
  '2027-03-20', // 春分の日
  '2027-03-22', // 振替休日
];

// ============================================================
// 特別な曜日授業日
// ある日に別の曜日のカリキュラムを実施する日程
// 書式: 'YYYY-MM-DD': JS曜日番号（1=月, 2=火, 3=水, 4=木, 5=金）
// ============================================================
const specialClasses = {
  '2026-05-07': 3, // 木曜日に水曜授業を実施（4/29・5/6の水曜休講補填）
  '2026-07-17': 1, // 金曜日に月曜授業を実施（月14）
  '2026-12-25': 3, // 金曜日に水曜授業を実施（水曜12回→13回補填）
};

// ============================================================
// 授業なし期間（試験期間・長期休暇）
// ============================================================
// 【前期 授業終了日の検証】（各曜日15回目）
//  金: 7/17（前期最速・金1=4/10スタート）  木: 7/30（前期最遅）
//  月: 7/27（7/20は授業実施により月14→7/20, 月15→7/27）
//  火: 7/28  水: 7/29（5/7の振替授業により正常化）
//   → 全曜日の最遅: 木曜 7/30 ∴ 7/31から授業なし
//
// 【後期 授業終了日の検証】（各曜日15回目）
//  木: 1/14  水: 1/13（12/25の水曜振替で補填）  金: 2/12（試験）
//  火: 1/26  月: 2/8
//   → 全曜日の最遅: 金曜 2/12 ∴ 2/13から授業なし
// ============================================================
const noClassPeriods = [
  {
    // ※前期は 7/31(金) が金曜第15回（授業/試験期間）に該当するため、授業なし開始は 8/1 とする
    start: '2026-08-01',
    end: '2026-09-30',
    label: '前期試験・夏季休暇',
    type: 'break',
  },
  {
    start: '2027-02-13',
    end: '2027-03-31',
    label: '後期試験・春季休暇',
    type: 'break',
  },
];

// 学期定義
// 前期は 4/13（月）週から開始（※金曜の第1回は 4/17）
const semesters = {
  first:  { name: '前期', start: '2026-04-13', end: '2026-09-30' },
  second: { name: '後期', start: '2026-10-01', end: '2027-03-31' },
};

// ============================================================
// 年間行事
// ============================================================
export const annualEvents = [
  { date: '2026-04-04', title: '入学式 静岡・浜松', type: 'ceremony' },
  { date: '2026-04-06', title: '健康診断', type: 'other' },
  { date: '2026-04-13', title: '前期授業開始（月1）', type: 'academic' },
  { date: '2026-04-14', title: '前期授業開始（火1）', type: 'academic' },
  { date: '2026-04-15', title: '前期授業開始（水1）', type: 'academic' },
  { date: '2026-04-16', title: '前期授業開始（木1）', type: 'academic' },
  { date: '2026-04-17', title: '前期授業開始（金1）', type: 'academic' },
  { date: '2026-05-07', title: '水曜授業を実施（木曜日・水3）', type: 'other' },
  { date: '2026-05-26', title: '全学一斉地震防災訓練', type: 'other' },
  { date: '2026-07-17', title: '月曜授業 第14回（※金曜日に月曜授業を実施）', type: 'academic' },
  { date: '2026-07-20', title: '海の日（祝日のため休講）', type: 'holiday' },
  { date: '2026-07-27', title: '月曜授業 第15回（前期最終）', type: 'academic' },
  { date: '2026-07-28', title: '火曜授業 第15回（前期最終）', type: 'academic' },
  { date: '2026-07-29', title: '水曜授業 第15回（前期最終）', type: 'academic' },
  { date: '2026-07-30', title: '木曜授業 第15回（前期最終）', type: 'academic' },
  { date: '2026-07-31', title: '金曜授業 第15回（授業/試験期間）', type: 'academic' },
  { date: '2026-08-01', title: '前期試験・夏季休業開始', type: 'holiday' },
  { date: '2026-10-01', title: '後期授業開始（木1）', type: 'academic' },
  { date: '2026-10-02', title: '後期授業開始（金1）', type: 'academic' },
  { date: '2026-10-05', title: '後期授業開始（月1）', type: 'academic' },
  { date: '2026-10-06', title: '後期授業開始（火1）', type: 'academic' },
  { date: '2026-10-07', title: '後期授業開始（水1）', type: 'academic' },
  { date: '2026-10-30', title: '大学祭（静岡）→金曜休講', type: 'holiday' },
  { date: '2026-11-06', title: 'テクノフェスタ・大学祭（浜松）→金曜休講', type: 'holiday' },
  { date: '2026-11-07', title: 'テクノフェスタ・大学祭（浜松）', type: 'event' },
  { date: '2026-12-25', title: '金曜日に水曜授業を実施（水13）', type: 'other' },
  { date: '2026-12-28', title: '冬季休業（〜1/1）', type: 'holiday' },
  { date: '2027-01-04', title: '後期授業再開（月11）', type: 'academic' },
  { date: '2027-01-14', title: '木曜授業 第15回（後期最終）', type: 'academic' },
  { date: '2027-01-15', title: '共通テスト設営→金曜休講', type: 'holiday' },
  { date: '2027-01-31', title: '後期期末試験開始', type: 'exam' },
  { date: '2027-02-08', title: '月曜授業 第15回（後期最終）', type: 'academic' },
  { date: '2027-02-12', title: '金曜授業 第15回（後期最終・試験）', type: 'exam' },
  { date: '2027-02-13', title: '後期試験・春季休暇', type: 'holiday' },
];

export const getAnnualEvents = () => annualEvents;

// ============================================================
// ユーティリティ
// ============================================================
const getNoClassPeriod = (dateStr) => {
  for (const p of noClassPeriods) {
    if (dateStr >= p.start && dateStr <= p.end) return p;
  }
  return null;
};

/**
 * その日の時間割上の曜日インデックスを返す (0:月 〜 4:金)
 * 休日・授業なし期間・土日は null
 */
export const getEffectiveDayIndex = (targetDate) => {
  const d = new Date(targetDate);
  const tStr = format(d, 'yyyy-MM-dd');

  if (getNoClassPeriod(tStr)) return null;
  if (holidays.includes(tStr)) return null;

  // specialClasses がある場合はその曜日で上書き
  const dow = specialClasses[tStr] !== undefined ? specialClasses[tStr] : d.getDay();
  if (dow === 0 || dow === 6) return null;

  return dow - 1; // 1(月)→0, 5(金)→4
};

/**
 * 指定日が「前期/後期の第N回目授業」かを返す
 *  通常授業日: { semester, iteration: N }  (N: 1〜15)
 *  15回終了後: { semester, info: '授業終了（試験期間）', isExamPeriod: true }
 *  授業なし期間: { semester, info: '...', isExamPeriod: true }
 *  祝日・休講: { semester, info: '休講（祝祭日等）' }
 *  授業期間外: null
 */
export const getClassIteration = (targetDate) => {
  const d = new Date(targetDate);
  // タイムゾーンに依存しないよう、ローカル日付文字列で比較する
  // （CalendarViewはローカルDateオブジェクトを渡すため、UTCタイムスタンプ比較だと
  //   JST午前0時 = UTC前日15時となり、学期初日が「学期外」と誤判定されるバグを防ぐ）
  const tStr = format(d, 'yyyy-MM-dd');

  let semesterStartStr = null;
  let semesterName = null;

  if (tStr >= semesters.first.start && tStr <= semesters.first.end) {
    semesterStartStr = semesters.first.start;
    semesterName = semesters.first.name;
  } else if (tStr >= semesters.second.start && tStr <= semesters.second.end) {
    semesterStartStr = semesters.second.start;
    semesterName = semesters.second.name;
  } else {
    return null;
  }

  // 授業なし期間（試験・長期休暇）
  const noClass = getNoClassPeriod(tStr);
  if (noClass) {
    return { semester: semesterName, info: noClass.label, isExamPeriod: true };
  }

  // 休日・休講日
  if (holidays.includes(tStr)) {
    return { semester: semesterName, info: '休講（祝祭日等）' };
  }

  // 対象曜日（特別日程は上書き）
  const targetDow = specialClasses[tStr] !== undefined ? specialClasses[tStr] : d.getDay();
  if (targetDow === 0 || targetDow === 6) return null;

  // 学期開始〜対象日まで同じ曜日をカウント
  // （授業なし期間・祝日・土日・specialClass上書き 考慮）
  // 文字列比較でループすることでタイムゾーンの影響を排除
  let count = 0;
  let cur = new Date(semesterStartStr);

  while (format(cur, 'yyyy-MM-dd') <= tStr) {
    const curStr = format(cur, 'yyyy-MM-dd');

    if (!getNoClassPeriod(curStr) && !holidays.includes(curStr)) {
      const curDow = specialClasses[curStr] !== undefined ? specialClasses[curStr] : cur.getDay();
      if (curDow >= 1 && curDow <= 5 && curDow === targetDow) {
        count++;
      }
    }

    cur.setDate(cur.getDate() + 1);
  }

  // 15回完了後は試験/授業終了として扱う
  if (count > 15) {
    return { semester: semesterName, info: '授業終了（試験期間）', isExamPeriod: true };
  }

  return { semester: semesterName, iteration: count };
};
