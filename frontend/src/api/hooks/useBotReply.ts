export default function useBotReply() {
  return async (): Promise<string[]> => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const apiBase = import.meta.env.VITE_API_TABLE_BASE_URL;
      const res = await fetch(`${apiBase}/getData`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ ProductNum: 4, Day: 3 }),
      });

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        return [data[0].InquiryDetail];
      }

      if (data?.InquiryDetail) {
        return [data.InquiryDetail];
      }

      return ['ボットの返答が見つかりませんでした。'];
    } catch (error) {
      console.error('Bot応答取得エラー:', error);
      return ['エラー：Botの返答が取得できませんでした。'];
    }
  };
}
