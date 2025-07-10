const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const LINE_CHANNEL_ID = 2007711472;
const LINE_CHANNEL_SECRET = 'af69ac093a6180476fbcf5e678e65696';
const LINE_REDIRECT_URI = 'https://tray3forse-linebakugeki.netlify.app/.netlify/functions/callback';
const LINE_MESSAGING_CHANNEL_TOKEN = 'kmPQskBIeKSQmwwFBxBlyXY+ZOZdDlzAgBiKitT8xtgX3B+bGO4fK+0pUswEP2p6l8ObOzM3mY1KTzTJkXMlpl7wavulHH93ty3FwuJz28/jnTVAsA4p7HdHXkBAgAtNSmfPXBFQWUimBcRNq/AFUgdB04t89/1O/w1cDnyilFU=';

// Supabase 接続情報（環境変数で管理が理想）
const SUPABASE_URL = 'https://bteklaezhlfmjylybrlh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZWtsYWV6aGxmbWp5bHlicmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMTEzNDYsImV4cCI6MjA2NTg4NzM0Nn0.8YP7M1soC5NpuuhgtmDUB2cL2y6W3yfmL4rgSxaS0TE'; // ⚠️ サーバー専用

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

exports.handler = async (event) => {
  const code = event.queryStringParameters.code;

  try {
    // ① アクセストークン取得
    const tokenRes = await axios.post('https://api.line.me/oauth2/v2.1/token', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: LINE_REDIRECT_URI,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenRes.data.access_token;

    // ② ユーザー情報取得（LINE Login用）
    const profileRes = await axios.get('https://api.line.me/oauth2/v2.1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const userId = profileRes.data.sub;

    // ③ Supabaseに保存（重複チェック）
    const { data: existingUser, error: selectError } = await supabase
      .from('line_users')
      .select('*')
      .eq('line_user_id', userId)
      .single();

    if (!existingUser) {
      const { error: insertError } = await supabase
        .from('line_users')
        .insert([{ line_user_id: userId }]);

      if (insertError) throw insertError;
    }

    // ④ Botからメッセージ送信
    await axios.post('https://api.line.me/v2/bot/message/push', {
      to: userId,
      messages: [{ type: 'text', text: 'こんにちは！ログインありがとう😊' }]
    }, {
      headers: {
        Authorization: `Bearer ${LINE_MESSAGING_CHANNEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // ⑤ リダイレクト
    return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: `
    <script>
      window.location.href = 'https://tray3forse-linebakugeki.netlify.app/top.html';
    </script>
    <p>認証成功！リダイレクト中...</p>
  `
};

  } catch (err) {
    console.error('エラー:', err.response?.data || err.message);
    return {
      statusCode: 500,
      body: 'エラーが発生しました'
    };
  }
};