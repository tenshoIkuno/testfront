// src/lib/authLogger.ts

export interface AuthLog {
  step: string;
  timestamp: string;
  detail: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

// ログ配列（useRef推奨だがシンプルな形で管理可）
export class AuthLogger {
  private logs: AuthLog[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  add(step: string, detail: string, data?: any) {
    this.logs.push({
      step,
      timestamp: new Date().toLocaleString(),
      detail,
      data,
    });
  }

  getLogs() {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }

  // ログをテキストファイルとしてダウンロード
  download(filename = 'auth_logs.txt') {
    const content = this.logs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.step}] ${log.detail}${
            log.data ? `\n    data: ${JSON.stringify(log.data, null, 2)}` : ''
          }`,
      )
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

// 必要なら共通インスタンス生成もOK
export const sharedAuthLogger = new AuthLogger();
