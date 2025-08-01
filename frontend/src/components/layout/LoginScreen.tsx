import LoadingScreen from './LoadingScreen';

export default function LoginScreen() {
  // ログイン中のUI（ロゴや説明文など好きにカスタマイズ可）
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="mb-8 text-xl font-bold">ログインしています…</div>
      <LoadingScreen loadingFlag={1} />
    </div>
  );
}
