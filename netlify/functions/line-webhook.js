const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// 環境変数から読み込み
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const events = body.events || [];

    for (const e of events) {
      if (e.type === 'follow') {
        const lineUserId = e.source?.userId;
        if (!lineUserId) continue;

        // 既に登録されているか確認
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('line_user_id', lineUserId)
          .maybeSingle();

        if (existing) continue;

        // LINEのプロフィールAPIから取得
        const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
          headers: {
            Authorization: `Bearer ${LINE_TOKEN}`
          }
        });

        const profile = await profileRes.json();

        // Supabaseに保存
        const { error } = await supabase.from('users').insert([
          {
            line_user_id: lineUserId,
            display_name: profile.displayName,
            picture_url: profile.pictureUrl,
            status_message: profile.statusMessage
          }
        ]);

        if (error) {
          console.error('Supabase insert error:', error);
        }
      }
    }

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('Webhook error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
