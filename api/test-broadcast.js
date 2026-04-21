/* global process */
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return json(res, 500, { error: 'Missing LINE_CHANNEL_ACCESS_TOKEN' });
  }

  try {
    const resp = await fetch('https://api.line.me/v2/bot/message/broadcast', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ type: 'text', text: '【UniSta】テスト通知です！システムからLINEへのメッセージ送信に成功しました🎉' }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`LINE API failed: ${resp.status} ${errText}`);
    }

    return json(res, 200, { ok: true, message: 'Broadcast sent successfully!' });
  } catch (e) {
    return json(res, 500, { ok: false, error: e?.message || String(e) });
  }
}
