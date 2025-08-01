/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from 'react';
import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { fetchRegisterUser } from '../api/fetchers/fetchRegisterUser';
import { fetchCheckUserCompanyInfo } from '../api/fetchers/fetchCheckUserCompanyInfo';
import { AuthLogger, sharedAuthLogger, AuthLog } from '../lib/authLogger';

const msalConfig = {
  auth: {
    clientId: '0982a016-8393-490b-9e3e-adad5af40f7b',
    authority:
      'https://aichanb2c.b2clogin.com/aichanb2c.onmicrosoft.com/B2C_1_signin',
    knownAuthorities: ['aichanb2c.b2clogin.com'],
    redirectUri: 'http://localhost:5173/',
  },
  cache: { cacheLocation: 'localStorage' },
};

const loginRequest = {
  scopes: [
    'https://aichanb2c.onmicrosoft.com/254e00d0-c8a6-4d51-87de-69315e691a49/access_user',
  ],
};

const msalInstance = new PublicClientApplication(msalConfig);

interface UserData {
  name: string;
  email: string;
  department_name: string;
  company_id: number; // ★追加
  department_id: number; // ★追加
}

interface AuthResult {
  accessToken: string | null;
  userData: UserData | null;
  registerName: string | null;
  loading: boolean;
  status: string;
  logout: () => void;
  registerError: string | null;
  companyStatus: boolean | null;
  authLogs: AuthLog[];
  downloadLogs: () => void;
}

export default function useAuthRedirect(
  logger: AuthLogger = sharedAuthLogger,
): AuthResult {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [registerName, setRegisterName] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [companyStatus, setCompanyStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('初期化中...');
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);

  const addLog = useCallback(
    (step: string, detail: string, data?: any) => {
      logger.add(step, detail, data);
      setAuthLogs([...logger.getLogs()]);
    },
    [logger],
  );

  useEffect(() => {
    let canceled = false;
    const run = async () => {
      setLoading(true);
      setStatus('認証処理開始...');
      addLog('Init', '認証フロー開始');
      try {
        await msalInstance.initialize();
        addLog('MSAL', 'MSAL初期化完了');

        const redirectResult = await msalInstance.handleRedirectPromise();
        if (redirectResult) {
          msalInstance.setActiveAccount(redirectResult.account);
          addLog(
            'MSAL',
            'リダイレクトアカウントセット',
            redirectResult.account,
          );
        }

        let account = msalInstance.getActiveAccount();
        if (!account) {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length === 0) {
            setStatus('ログイン画面へリダイレクト');
            addLog('認証', '認証なし→ログイン画面へリダイレクト');
            setLoading(true);
            await msalInstance.loginRedirect(loginRequest);
            return;
          }
          account = accounts[0];
          msalInstance.setActiveAccount(account);
        }

        setStatus('アクセストークン取得...');
        const tokenResponse = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: account as AccountInfo,
        });
        setAccessToken(tokenResponse.accessToken);
        addLog('認証', 'アクセストークン取得', tokenResponse);
        setStatus('認証成功（トークン取得）');
      } catch (e) {
        addLog('エラー', '認証例外→ログインリダイレクト', e);
        setStatus('認証エラー');
        setLoading(true);
        await msalInstance.loginRedirect(loginRequest);
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    run();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let canceled = false;

    const fetchAllUserData = async () => {
      setLoading(true);
      setRegisterError(null);
      setRegisterName(null);
      setCompanyStatus(null);

      const fetchUserInfo = async (): Promise<UserData | null> => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/users`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            },
          );

          if (!res.ok) {
            const text = await res.text();
            console.warn('[fetchUserInfo] レスポンスNG:', res.status, text);
            addLog('ユーザー取得', `失敗: ${res.status}`, text);
            return null;
          }

          const data = await res.json();
          return data;
        } catch (err) {
          console.error('[fetchUserInfo] ユーザー取得例外:', err);
          addLog('ユーザー取得', '例外発生', err);
          return null;
        }
      };

      setStatus('ユーザー情報取得...');
      addLog('ユーザー取得', 'API呼び出し開始', { accessToken });

      let user = await fetchUserInfo();

      if (!user) {
        setStatus('ユーザー未登録→登録');
        addLog('登録', 'register-user API実行');
        try {
          const name = await fetchRegisterUser(accessToken);
          setRegisterName(name);
          user = await fetchUserInfo();
          if (!user) throw new Error('ユーザー登録後の情報取得失敗');
        } catch (err) {
          setRegisterError(String(err));
          setStatus('ユーザー登録失敗→リダイレクト');
          addLog('登録', 'ユーザー登録失敗', err);
          setLoading(false);
          await msalInstance.loginRedirect(loginRequest);
          return;
        }
      }

      setUserData(user!);
      setStatus('ユーザー認証OK');

      setStatus('会社情報取得...');
      try {
        const company = await fetchCheckUserCompanyInfo(
          accessToken,
          user!.company_id,
          user!.department_id,
        );
        setCompanyStatus(company);
        setStatus(`会社情報: ${company}`);
        addLog('会社情報', '取得OK', company);
      } catch (err) {
        setCompanyStatus(null);
        setRegisterError(String(err));
        setStatus('会社情報取得失敗');
        addLog('会社情報', '取得失敗', err);
      }

      if (!canceled) setLoading(false);
    };

    fetchAllUserData();
    return () => {
      canceled = true;
    };
  }, [accessToken]);

  const logout = useCallback(() => {
    addLog('ログアウト', 'リダイレクト');
    msalInstance.logoutRedirect({
      postLogoutRedirectUri: 'http://localhost:5173/',
    });
  }, [addLog]);

  const downloadLogs = useCallback(() => {
    logger.download();
  }, [logger]);

  return {
    accessToken,
    userData,
    registerName,
    loading,
    status,
    logout,
    registerError,
    companyStatus,
    authLogs,
    downloadLogs,
  };
}
