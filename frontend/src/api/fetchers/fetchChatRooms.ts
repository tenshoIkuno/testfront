// /src/api/fetchChatRooms.ts

export type ChatRoom = {
  room_id: number;
  room_name: string;
  created_at: string;
  updated_at: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * チャットルーム一覧取得
 */
export async function fetchChatRooms(accessToken: string): Promise<ChatRoom[]> {
  const response = await fetch(`${API_BASE}/chat_rooms`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'チャットルーム取得に失敗しました');
  }

  const data = await response.json();
  return data.rooms || [];
}

/**
 * チャットルーム作成
 * 成功時は作成された ChatRoom オブジェクトを返す
 */
export async function createChatRoom(
  accessToken: string,
  roomName: string,
): Promise<ChatRoom> {
  const response = await fetch(`${API_BASE}/chat_rooms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ room_name: roomName }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'チャットルーム作成に失敗しました');
  }

  const data = await response.json();

  console.log('[DEBUG] チャットルーム作成レスポンス:', data);

  const room = data.room ?? data; // `room` フィールドがある場合とない場合両対応

  const result: ChatRoom = {
    room_id: room.room_id,
    room_name: room.room_name,
    created_at: room.created_at ?? new Date().toISOString(),
    updated_at: room.updated_at ?? new Date().toISOString(),
  };

  console.log('[DEBUG] 返却するChatRoomオブジェクト:', result);

  return result;
}

/**
 * チャットルーム名の更新
 */
export async function updateChatRoomName(
  accessToken: string,
  room_id: number,
  room_name: string,
): Promise<void> {
  const response = await fetch(`${API_BASE}/chat_rooms/update`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ room_id, room_name }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'チャットルーム名の更新に失敗しました');
  }
}
