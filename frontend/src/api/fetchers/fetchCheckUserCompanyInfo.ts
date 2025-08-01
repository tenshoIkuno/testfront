// /src/api/fetchCheckUserCompanyInfo.ts

/**
 * ユーザーの会社情報（企業ID・部署ID）を更新するAPI
 * @param accessToken 認証トークン
 * @param company_id  企業ID（必須）
 * @param department_id 部署ID（必須）
 * @returns サーバー応答に含まれるstatus（boolean型を想定）
 */
export async function fetchCheckUserCompanyInfo(
  accessToken: string,
  company_id: number,
  department_id: number,
): Promise<boolean> {
  if (!accessToken) throw new Error('トークンがありません');
  if (company_id == null || department_id == null)
    throw new Error('company_id, department_id は必須です');

  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const url = `${API_BASE}/users`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company_id,
      department_id,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || '会社情報の更新に失敗しました');
  }

  const data = await response.json();
  // サンプル: { "message": "success", "user_id": 0, "company_id": 1, "department_id": 2 }
  // 必要に応じて data.message などをreturnしてください
  return data.status ?? true; // ←"status"プロパティがなければtrueを返すなど調整
}
