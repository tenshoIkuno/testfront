import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// lib/utils.ts

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// 1文字ずつ表示（typewriter風）
export async function* typeWriter(text: string, speed = 15) {
  let cur = '';
  for (let i = 0; i < text.length; i++) {
    cur += text[i];
    yield cur;
    await sleep(speed);
  }
}

// ルーム名のデフォルト判定
export function isDefaultRoomName(roomName: string) {
  return /^ルーム\d+$/.test(roomName) || /^ルーム\d{5,}$/.test(roomName);
}

// タイピング中の「確定済みマークダウン」と未確定部
export function getConfirmedMarkdown(text: string): [string, string] {
  const codeMatch = text.match(/```/g);
  if (codeMatch && codeMatch.length % 2 === 1) {
    const lastOpen = text.lastIndexOf('```');
    if (lastOpen >= 0) {
      return [text.slice(0, lastOpen), text.slice(lastOpen)];
    }
  }
  return [text, ''];
}
