const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// === 設定（セキュアな環境では .env に分離すべき） ===
const SUPABASE_URL = 'https://bteklaezhlfmjylybrlh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZWtsYWV6aGxmbWp5bHlicmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMTEzNDYsImV4cCI6MjA2NTg4NzM0Nn0.8YP7M1soC5NpuuhgtmDUB2cL2y6W3yfmL4rgSxaS0TE';
const LINE_MESSAGING_CHANNEL_TOKEN = 'kmPQskBIeKSQmwwFBxBlyXY+ZOZdDlzAgBiKitT8xtgX3B+bGO4fK+0pUswEP2p6l8ObOzM3mY1KTzTJkXMlpl7wavulHH93ty3FwuJz28/jnTVAsA4p7HdHXkBAgAtNSmfPXBFQWUimBcRNq/AFUgdB04t89/1O/w1cDnyilFU=';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === メイン関数 ===
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { message } = JSON.parse(event.body);

    if (!message || typeof message !== 'string') {
      return { statusCode: 400, body: 'メッセージが無効です' };
    }

    // Supabase から全ユーザーの ID を取得
    const { data: users, error } = await supabase
      .from('line_users')        // ← テーブル名をあなたの実際のものに合わせて変更可能
      .select('line_user_id');   // ← カラム名も実際に使っているものに合わせてください

    if (error) throw error;
    if (!users || users.length === 0) {
      return { statusCode: 200, body: 'ユーザーが見つかりませんでした。' };
    }

    // 各ユーザーにメッセージ送信
    for (const user of users) {
      await axios.post('https://api.line.me/v2/bot/message/push', {
        to: user.line_user_id,
        messages: [{ type: 'text', text: message }]
      }, {
        headers: {
          Authorization: `Bearer ${LINE_MESSAGING_CHANNEL_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    }

    return {
      statusCode: 200,
      body: '全ユーザーにメッセージを送信しました。'
    };

  } catch (err) {
    console.error('送信エラー:', err.response?.data || err.message);
    return {
      statusCode: 500,
      body: 'メッセージ送信中にエラーが発生しました。'
    };
  }
};