import { useEffect, useState } from 'react';
import Header from './object/header';
import LoadingScreen from './components/layout/LoadingScreen';
import ChatPanel from './object/ChatPanel';
import Sidebar, { ChatRoom } from './object/Sidebar';
import {
  fetchChatRooms,
  createChatRoom,
  updateChatRoomName,
} from './api/fetchers/fetchChatRooms';
import { AuthLog } from './lib/authLogger';

type ChatMessage = {
  id: string;
  room_id: number;
  sender: 'user' | 'assistant';
  text: string;
  created_at: string;
};

type MainScreenProps = {
  logout: () => void;
  userData: {
    name: string;
    email: string;
    department_name: string;
  };
  companyStatus: boolean;
  accessToken: string;
  authLogs: AuthLog[];
  downloadLogs: () => void;
};

export default function MainScreen({
  logout,
  userData,
  companyStatus,
  accessToken,
}: MainScreenProps) {
  const [loading, setLoading] = useState(true);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiTyping, setAITyping] = useState(false);

  const [editNameModal, setEditNameModal] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);

  const [creatingNewRoom, setCreatingNewRoom] = useState(false);

  // チャットルーム取得
  const fetchRooms = async () => {
    try {
      const rooms = await fetchChatRooms(accessToken);
      setChatRooms(rooms);
      if (rooms.length > 0) {
        setSelectedRoom(rooms[0]);
        setCreatingNewRoom(false);
      } else {
        setSelectedRoom(null);
        setCreatingNewRoom(true); // 1件もないときは新規入力UIを表示
      }
    } catch (err) {
      console.error('チャットルーム取得エラー:', err);
    }
    setLoading(false);
  };

  // 新規作成（ChatPanelから使用）
  const createAndSelectNewRoom = async (
    roomName: string,
  ): Promise<ChatRoom | null> => {
    try {
      const newRoom = await createChatRoom(accessToken, roomName);
      setChatRooms((prev) => [...prev, newRoom]);
      setSelectedRoom(newRoom);
      setCreatingNewRoom(false);
      return newRoom;
    } catch (err) {
      console.error('新規チャットルーム作成エラー:', err);
      return null;
    }
  };

  // 名前更新処理
  const updateRoomName = async (room_id: number, newName: string) => {
    try {
      await updateChatRoomName(accessToken, room_id, newName);
      setEditNameModal(false);
      setEditNameValue('');
      setEditingRoom(null);
      await fetchRooms(); // 最新リスト取得
    } catch (err) {
      console.error('ルーム名更新エラー:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingScreen loadingFlag={1} />;

  return (
    <div className="flex flex-col h-screen">
      <Header
        onLogout={logout}
        onToggleTranscript={() => {}}
        userStatus={userData?.name ?? ''}
        companyStatus={companyStatus}
      />

      <div className="flex flex-1 h-screen overflow-hidden">
        <Sidebar
          chatRooms={chatRooms}
          setChatRooms={setChatRooms}
          selectedRoom={selectedRoom}
          setSelectedRoom={setSelectedRoom}
          setEditingRoom={setEditingRoom}
          setEditNameValue={setEditNameValue}
          setEditNameModal={setEditNameModal}
          setCreatingNewRoom={setCreatingNewRoom}
          createAndSelectNewRoom={createAndSelectNewRoom} // ← 🔄追加
          fetchChatRooms={fetchRooms}
        />

        <ChatPanel
          selectedRoom={selectedRoom}
          userEmail={userData.email}
          aiTyping={aiTyping}
          setAITyping={setAITyping}
          messages={messages}
          setMessages={setMessages}
          accessToken={accessToken}
          fetchChatRooms={fetchRooms}
          onSelectRoom={setSelectedRoom}
          creatingNewRoom={creatingNewRoom}
          setCreatingNewRoom={setCreatingNewRoom}
          createAndSelectNewRoom={createAndSelectNewRoom} // ← 🔄追加
        />
      </div>

      {/* ===== モーダル：ルーム名編集 ===== */}
      {editNameModal && editingRoom && (
        <div className="fixed z-50 inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-xl min-w-[320px] flex flex-col gap-3">
            <div className="font-bold mb-1">ルーム名を編集</div>
            <input
              className="border p-2 rounded"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-gray-300 hover:bg-gray-400"
                onClick={() => setEditNameModal(false)}
              >
                キャンセル
              </button>
              <button
                className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                disabled={!editNameValue.trim()}
                onClick={() =>
                  updateRoomName(editingRoom.room_id, editNameValue.trim())
                }
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
