import { createClient } from '@supabase/supabase-js';

const DAYS_BEFORE_LIST = [7, 3, 1];

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function pushLineMessage(lineUserId, text) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error('Missing LINE_CHANNEL_ACCESS_TOKEN');

  const resp = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text }],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`LINE push failed: ${resp.status} ${resp.statusText} ${errText}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method Not Allowed' });

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) return json(res, 500, { ok: false, error: 'Missing SUPABASE_URL (or VITE_SUPABASE_URL)' });
  if (!serviceKey) return json(res, 500, { ok: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' });

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const today = new Date();
  const windowStart = ymd(addDays(today, 1));
  const windowEnd = ymd(addDays(today, 7));

  // profiles: { user_id, line_user_id, line_reminders_enabled }
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id,line_user_id,line_reminders_enabled')
    .eq('line_reminders_enabled', true)
    .not('line_user_id', 'is', null);
  if (profilesError) return json(res, 500, { ok: false, error: profilesError.message });

  const userIds = profiles.map((p) => p.user_id);
  if (userIds.length === 0) return json(res, 200, { ok: true, sent: 0, reason: 'no linked users' });

  // tasks: due_date は date または timestamptz を想定（いずれでも ymd で比較できるよう、date範囲で絞る）
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id,user_id,title,subject,due_date,completed')
    .in('user_id', userIds)
    .eq('completed', false)
    .gte('due_date', windowStart)
    .lte('due_date', windowEnd);
  if (tasksError) return json(res, 500, { ok: false, error: tasksError.message });

  const profileByUser = new Map(profiles.map((p) => [p.user_id, p]));

  let sent = 0;
  const errors = [];

  for (const task of tasks) {
    const p = profileByUser.get(task.user_id);
    if (!p?.line_user_id) continue;

    const due = new Date(task.due_date);
    if (Number.isNaN(due.getTime())) continue;

    // 何日前か（ローカル日付ベース）
    const todayYmd = ymd(today);
    const dueYmd = ymd(due);
    const diffDays = Math.round((new Date(dueYmd).getTime() - new Date(todayYmd).getTime()) / (1000 * 60 * 60 * 24));
    if (!DAYS_BEFORE_LIST.includes(diffDays)) continue;

    // 重複送信防止
    const { data: already, error: alreadyError } = await supabase
      .from('task_reminders')
      .select('id')
      .eq('user_id', task.user_id)
      .eq('task_id', task.id)
      .eq('days_before', diffDays)
      .maybeSingle();
    if (alreadyError) {
      errors.push({ taskId: task.id, error: alreadyError.message });
      continue;
    }
    if (already) continue;

    const subjectPart = task.subject ? `（${task.subject}）` : '';
    const msg = `【課題リマインド】\n「${task.title}」${subjectPart}\n提出まであと${diffDays}日（締切: ${dueYmd}）`;

    try {
      await pushLineMessage(p.line_user_id, msg);
      sent++;
      await supabase.from('task_reminders').insert({
        user_id: task.user_id,
        task_id: task.id,
        days_before: diffDays,
        sent_at: new Date().toISOString(),
      });
    } catch (e) {
      errors.push({ taskId: task.id, error: e?.message || String(e) });
    }
  }

  return json(res, 200, { ok: true, sent, errors });
}

