// /src/api/fetchAuthenticateCompanyInfo.ts

export interface Department {
  department_id: number;
  department_name: string;
}

export interface AuthenticateCompanyInfoResponse {
  company_id: number;
  company_name: string;
  departments: Department[];
}

export async function fetchAuthenticateCompanyInfo(
  company_auth_id: string,
): Promise<AuthenticateCompanyInfoResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const url = `${baseUrl}/companies/${encodeURIComponent(company_auth_id)}`;

  const response = await fetch(url, {
    method: 'GET', // GETに変更（認証不要）
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || '会社情報の取得に失敗しました');
  }

  const data = await response.json();
  return data;
}
