const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bteklaezhlfmjylybrlh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZWtsYWV6aGxmbWp5bHlicmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMTEzNDYsImV4cCI6MjA2NTg4NzM0Nn0.8YP7M1soC5NpuuhgtmDUB2cL2y6W3yfmL4rgSxaS0TE';

const supabase = createClient('https://bteklaezhlfmjylybrlh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZWtsYWV6aGxmbWp5bHlicmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMTEzNDYsImV4cCI6MjA2NTg4NzM0Nn0.8YP7M1soC5NpuuhgtmDUB2cL2y6W3yfmL4rgSxaS0TE');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);

    const lineEvent = body.events && body.events[0];
    if (!lineEvent) {
      return { statusCode: 400, body: 'イベント情報がありません' };
    }

    if (lineEvent.type === 'follow') {
      const userId = lineEvent.source.userId;

      // すでに登録済みかチェック
      const { data, error } = await supabase
        .from('line_users')
        .select('line_user_id')
        .eq('line_user_id', userId);

      if (error) throw error;

      if (!data || data.length === 0) {
        // 新規登録
        const { error: insertError } = await supabase
          .from('line_users')
          .insert([{ line_user_id: userId }]);
        if (insertError) throw insertError;
      }

      return { statusCode: 200, body: 'フォローイベント処理完了' };
    }

    return { statusCode: 200, body: '対応しないイベントです' };

  } catch (err) {
    console.error('Webhook処理エラー:', err);
    return { statusCode: 500, body: 'Webhook処理中にエラーが発生しました' };
  }
};