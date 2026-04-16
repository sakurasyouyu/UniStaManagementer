import React, { useEffect, useState } from 'react';
import liff from '@line/liff';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

const LineLink = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileRow, setProfileRow] = useState(null);
  const [error, setError] = useState('');

  const liffId = import.meta.env.VITE_LIFF_ID;

  const loadProfile = async () => {
    if (!user) return;
    const { data, error: e } = await supabase
      .from('profiles')
      .select('user_id,line_user_id,line_reminders_enabled')
      .eq('user_id', user.id)
      .maybeSingle();
    if (e) throw e;
    setProfileRow(data || { user_id: user.id, line_user_id: null, line_reminders_enabled: false });
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!user) return;
      setError('');
      setLoading(true);
      try {
        await loadProfile();
      } catch (e) {
        if (mounted) setError(e?.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const ensureLiffReady = async () => {
    if (!liffId) throw new Error('VITE_LIFF_ID が未設定です（VercelのProduction 環境変数を確認してください）');
    await liff.init({ liffId });
    if (!liff.isLoggedIn()) {
      // LINEアプリ内/外に関係なくログインを促す
      liff.login({ redirectUri: window.location.href });
      return false; // リダイレクトされる
    }
    return true;
  };

  const handleConnect = async () => {
    setError('');
    setSaving(true);
    try {
      const ready = await ensureLiffReady();
      if (!ready) return;
      const p = await liff.getProfile();
      const lineUserId = p?.userId;
      if (!lineUserId) throw new Error('LINE userId の取得に失敗しました');

      const next = {
        user_id: user.id,
        line_user_id: lineUserId,
        line_reminders_enabled: true,
        updated_at: new Date().toISOString(),
      };
      const { error: upsertError } = await supabase.from('profiles').upsert(next);
      if (upsertError) throw upsertError;

      setProfileRow((prev) => ({ ...(prev || {}), ...next }));
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    setError('');
    setSaving(true);
    try {
      const next = {
        user_id: user.id,
        line_user_id: null,
        line_reminders_enabled: false,
        updated_at: new Date().toISOString(),
      };
      const { error: upsertError } = await supabase.from('profiles').upsert(next);
      if (upsertError) throw upsertError;
      setProfileRow((prev) => ({ ...(prev || {}), ...next }));
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (enabled) => {
    if (!user) return;
    setError('');
    setSaving(true);
    try {
      const next = {
        user_id: user.id,
        line_user_id: profileRow?.line_user_id || null,
        line_reminders_enabled: enabled,
        updated_at: new Date().toISOString(),
      };
      const { error: upsertError } = await supabase.from('profiles').upsert(next);
      if (upsertError) throw upsertError;
      setProfileRow((prev) => ({ ...(prev || {}), ...next }));
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const connected = !!profileRow?.line_user_id;

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">LINE連携</h1>
        <p className="page-subtitle">課題の締切リマインド（7日前/3日前/1日前）をLINEに送信します</p>
      </header>

      <div className="glass-card" style={{ maxWidth: '760px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>読み込み中...</p>
        ) : (
          <>
            {error && (
              <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.10)', color: '#fca5a5', whiteSpace: 'pre-wrap' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                LIFF ID設定: {liffId ? 'あり' : 'なし'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>連携状態</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {connected ? '連携済み' : '未連携'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {!connected ? (
                    <button className="btn-primary" onClick={handleConnect} disabled={saving}>
                      {saving ? '連携中...' : 'LINE連携する'}
                    </button>
                  ) : (
                    <button className="btn-secondary" onClick={handleDisconnect} disabled={saving}>
                      {saving ? '解除中...' : '連携を解除'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>リマインド通知</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    連携済みの場合、毎日チェックして該当する課題を通知します
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: connected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={!!profileRow?.line_reminders_enabled}
                    disabled={!connected || saving}
                    onChange={(e) => handleToggleEnabled(e.target.checked)}
                  />
                  有効
                </label>
              </div>

              {connected && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  LINE userId: <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace' }}>{profileRow.line_user_id}</span>
                </div>
              )}

              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                - この画面は、LINEのLIFFから開くと自動で `userId` を取得できます。<br />
                - LIFFの設定（`VITE_LIFF_ID`）が必要です。
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LineLink;

