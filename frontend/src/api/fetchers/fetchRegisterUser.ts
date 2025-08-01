// /features/auth/api/fetchRegisterUser.ts

type RegisterUserResponse = {
  name: string;
  // 他にAPIの返すプロパティがあればここに追加
};

export async function fetchRegisterUser(accessToken: string): Promise<string> {
  console.log('[fetchRegisterUser] called');

  if (!accessToken) {
    console.error('[fetchRegisterUser] ❌ トークンがありません');
    throw new Error('トークンがありません');
  }

  const fetchUrl = `${import.meta.env.VITE_API_BASE_URL}/users/register`;

  console.log(
    '[fetchRegisterUser] リクエスト送信開始: accessToken(先頭のみ) →',
    accessToken.slice(0, 10) + '...',
  );

  let response: Response;
  try {
    response = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
  } catch (err) {
    console.error('[fetchRegisterUser] fetch自体が失敗:', err);
    throw new Error('API呼び出し失敗: ' + err);
  }

  console.log('[fetchRegisterUser] レスポンス status:', response.status);

  const text = await response.text();
  console.log('[fetchRegisterUser] レスポンス body:', text);

  if (response.status === 409) {
    console.warn('[fetchRegisterUser] 既にユーザー登録済み (409)');
    throw new Error('409: 既にユーザーは登録済みです');
  }

  if (!response.ok) {
    console.error('[fetchRegisterUser] レスポンスがNG:', response.status, text);
    throw new Error(text);
  }

  let data: RegisterUserResponse;
  try {
    data = JSON.parse(text) as RegisterUserResponse;
  } catch (e) {
    console.error('[fetchRegisterUser] レスポンスJSONパース失敗:', e, text);
    throw new Error('APIレスポンスのJSONパースエラー');
  }

  console.log('[fetchRegisterUser] 登録完了 data:', data);

  return data.name;
}
