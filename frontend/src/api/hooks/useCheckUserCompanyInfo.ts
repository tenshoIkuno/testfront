// src/api/useCheckUserCompanyInfo.ts
import { useCallback } from 'react';
import { fetchCheckUserCompanyInfo } from '../fetchers/fetchCheckUserCompanyInfo';

export function useCheckUserCompanyInfo() {
  return useCallback(async (accessToken: string): Promise<boolean | '不明'> => {
    try {
      const result = await fetchCheckUserCompanyInfo(accessToken);
      return result;
    } catch (err) {
      console.error('所属情報チェックエラー:', err);
      return '不明';
    }
  }, []);
}
