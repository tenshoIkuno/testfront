import React, { useState, useRef, useEffect } from 'react';
import {
  fetchAuthenticateCompanyInfo,
  AuthenticateCompanyInfoResponse,
  Department,
} from '../../api/fetchers/fetchAuthenticateCompanyInfo';

export default function ForcedModal({
  open,
  title,
  onOk,
  onLogout,
  okLabel = '決定',
  logoutLabel = 'ログアウト',
  accessToken,
}: {
  open: boolean;
  title: string;
  onOk: (
    company: AuthenticateCompanyInfoResponse | null,
    department: Department | null,
  ) => void;
  onLogout: () => void;
  okLabel?: string;
  logoutLabel?: string;
  accessToken: string;
}) {
  // 会社認証ID 4分割
  const [idFields, setIdFields] = useState(['', '', '', '']);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [companyInfo, setCompanyInfo] =
    useState<AuthenticateCompanyInfoResponse | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 所属更新状態
  const [affiliationResult, setAffiliationResult] = useState<string | null>(
    null,
  );
  const [affiliationSuccess, setAffiliationSuccess] = useState<boolean>(false);

  // 文字種チェック: 英大文字・数字のみ
  function normalize(val: string) {
    return val
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4);
  }

  // 入力欄変更イベント
  const handleInputChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = normalize(e.target.value);

    // 複数桁貼り付け時のスムーズ処理
    if (val.length > 4) {
      const arr = val.match(/.{1,4}/g) || [];
      const newFields = [...idFields];
      let i = idx;
      for (const v of arr) {
        if (i < 4) newFields[i++] = v;
      }
      setIdFields(newFields);
      if (i <= 4 && arr.length > 1) {
        refs[Math.min(i, 3)]?.current?.focus();
      }
      setError('');
      return;
    }

    // 通常1つずつ入力
    const newFields = [...idFields];
    newFields[idx] = val;
    setIdFields(newFields);
    setError('');

    // 自動移動
    if (val.length === 4 && idx < 3) {
      refs[idx + 1].current?.focus();
    }
    if (
      val.length === 0 &&
      idx > 0 &&
      e.nativeEvent instanceof InputEvent &&
      e.nativeEvent.inputType === 'deleteContentBackward'
    ) {
      refs[idx - 1].current?.focus();
    }
  };

  // フォーカス時: 全選択
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // 会社認証ボタン押下
  const handleAuthCompany = async () => {
    if (idFields.some((f) => f.length !== 4)) {
      setError('認証IDを正しく4桁ずつ入力してください');
      setCompanyInfo(null);
      return;
    }
    setError('');
    setLoading(true);
    const companyAuthId = idFields.join('-');
    try {
      const res = await fetchAuthenticateCompanyInfo(companyAuthId);
      setCompanyInfo(res);
      setSelectedDepartmentId(
        res.departments.length > 0 ? res.departments[0].department_id : null,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e?.message || '会社認証に失敗しました');
      setCompanyInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Enterキーで認証
  useEffect(() => {
    if (!open || companyInfo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        if (idFields.every((f) => f.length === 4)) {
          handleAuthCompany();
        } else {
          setError('認証IDを正しく4桁ずつ入力してください');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line
  }, [idFields, open, companyInfo]);

  // 所属情報更新API
  async function updateAffiliation(companyId: number, departmentId: number) {
    try {
      if (!accessToken) throw new Error('トークンがありません');
      if (!companyId || !departmentId) {
        throw new Error('会社IDと部門IDを正しく入力してください');
      }
      setAffiliationResult('所属更新中…');
      setAffiliationSuccess(false);

      const response = await fetch(
        'https://aichan-operation-db.azurewebsites.net/api/set-user-companyinfo?',
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            company_id: companyId,
            department_id: departmentId,
          }),
        },
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const data = await response.json();
      setAffiliationResult(
        `所属更新完了: 会社ID=${data.company_id}, 部門ID=${data.department_id}`,
      );
      setAffiliationSuccess(true);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setAffiliationResult(`エラー: ${err.message}`);
      setAffiliationSuccess(false);
      return false;
    }
  }

  // 決定時
  const handleOk = async () => {
    if (companyInfo && selectedDepartmentId !== null) {
      const department =
        companyInfo.departments.find(
          (d) => d.department_id === selectedDepartmentId,
        ) || null;
      const success = await updateAffiliation(
        companyInfo.company_id,
        selectedDepartmentId,
      );
      if (success) {
        onOk(companyInfo, department);
      }
    } else {
      setAffiliationResult('会社と部署を選択してください');
      setAffiliationSuccess(false);
    }
  };

  // モーダル開閉時リセット
  useEffect(() => {
    if (!open) {
      setIdFields(['', '', '', '']);
      setCompanyInfo(null);
      setSelectedDepartmentId(null);
      setError('');
      setLoading(false);
      setAffiliationResult(null);
      setAffiliationSuccess(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative">
        <h2 className="font-bold text-lg mb-4">{title}</h2>
        {/* 会社認証ID 入力（4分割・ハイフン） */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            会社認証ID
          </label>
          <div className="flex items-center gap-2">
            {!companyInfo ? (
              <>
                <div className="flex items-center gap-1">
                  {idFields.map((val, idx) => (
                    <React.Fragment key={idx}>
                      <input
                        ref={refs[idx]}
                        type="text"
                        inputMode="text"
                        pattern="[A-Z0-9]*"
                        value={val}
                        onChange={(e) => handleInputChange(idx, e)}
                        onFocus={handleFocus}
                        maxLength={4}
                        className="w-16 h-10 text-center border border-gray-300 px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-base font-mono tracking-widest bg-white transition-all"
                        disabled={!!companyInfo || loading}
                        autoComplete="off"
                        style={{ letterSpacing: '0.2em' }}
                      />
                      {idx < 3 && (
                        <span className="text-base text-gray-400 select-none flex items-center">
                          -
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <button
                  onClick={handleAuthCompany}
                  disabled={loading || !!companyInfo}
                  className="ml-2 h-10 px-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-semibold transition-all text-base flex-shrink-0 flex items-center justify-center"
                  style={{ minWidth: 54 }}
                >
                  {loading ? '認証中…' : '認証'}
                </button>
              </>
            ) : (
              // 認証後はテキスト表示
              <span className="text-lg font-mono tracking-widest px-2 py-1 rounded bg-gray-100 border border-gray-200">
                {idFields.join('-')}
              </span>
            )}
          </div>
          {/* エラー表示 */}
          {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
        </div>

        {/* 会社名・部署一覧 */}
        {companyInfo && (
          <div className="mb-6">
            <div className="mb-2">
              <span className="text-gray-600">会社名：</span>
              <span className="font-bold">{companyInfo.company_name}</span>
            </div>
            <div>
              <label className="text-gray-600">部署：</label>
              <select
                className="w-full border border-gray-300 px-3 py-2 rounded-lg mt-1 text-base"
                value={selectedDepartmentId ?? ''}
                onChange={(e) =>
                  setSelectedDepartmentId(Number(e.target.value))
                }
              >
                {companyInfo.departments.map((dep) => (
                  <option key={dep.department_id} value={dep.department_id}>
                    {dep.department_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {affiliationResult && (
          <div
            className={`mt-3 text-base ${affiliationSuccess ? 'text-green-600' : 'text-red-500'}`}
          >
            {affiliationResult}
          </div>
        )}

        <div className="flex gap-3 mt-3">
          <button
            onClick={handleOk}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 text-base transition-all"
            disabled={!companyInfo || selectedDepartmentId === null}
          >
            {okLabel}
          </button>
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 text-base transition-all"
          >
            {logoutLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
