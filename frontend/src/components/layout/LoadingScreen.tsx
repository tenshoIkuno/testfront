import LoadingIndicator from '../ui/LoadingIndicator';

const loadingMessages: Record<number, string> = {
  0: '',
  1: '読み込み中...',
  2: 'ログアウト中...',
  3: 'メッセージ送信中...',
  4: 'データ取得中...',
  5: '保存中...',
};

type LoadingScreenProps = {
  loadingFlag: number;
};

export default function LoadingScreen({ loadingFlag }: LoadingScreenProps) {
  if (loadingFlag === 0) return null;
  return <LoadingIndicator message={loadingMessages[loadingFlag]} />;
}
