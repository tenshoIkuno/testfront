// features/auth/api/useRegisterUser.ts
import { useCallback } from 'react';
import { fetchRegisterUser } from '../fetchers/fetchRegisterUser';

export function useRegisterUser() {
  return useCallback(async (accessToken: string) => {
    try {
      if (!accessToken) {
        throw new Error('トークンがありません（useRegisterUser）');
      }

      console.log(
        '🪪 registerUser に渡された accessToken:',
        accessToken.slice(0, 10) + '...',
      );
      const name = await fetchRegisterUser(accessToken);

      alert('✅ SQLにユーザー登録完了：' + name);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('❌ 登録APIエラー:', err.message);

        if (err.message.includes('409')) {
          alert('⚠️ 既にユーザーは登録済みです');
        } else if (
          err.message.includes('トークンに必要な情報が不足しています')
        ) {
          alert(
            '❌ 登録エラー: トークンに必要な情報が不足しています（Azure B2Cのclaim設定を確認してください）',
          );
        } else {
          alert('登録エラー: ' + err.message);
        }
      } else {
        alert('登録エラー: 不明なエラーが発生しました');
      }
    }
  }, []);
}
