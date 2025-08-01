/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useLayoutEffect } from 'react';
import { ChatRoom } from '../api/fetchers/fetchChatRooms';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Search,
  RefreshCw,
} from 'lucide-react';

// ===== プロパティの型定義 =====
type SidebarProps = {
  chatRooms: ChatRoom[];
  setChatRooms: React.Dispatch<React.SetStateAction<ChatRoom[]>>;
  selectedRoom: ChatRoom | null;
  setSelectedRoom: (room: ChatRoom | null) => void;
  setEditingRoom: (room: ChatRoom) => void;
  setEditNameValue: (name: string) => void;
  setEditNameModal: (flag: boolean) => void;
  setCreatingNewRoom: React.Dispatch<React.SetStateAction<boolean>>;
  createAndSelectNewRoom: (roomName: string) => Promise<ChatRoom | null>;
  fetchChatRooms: () => Promise<void>; // 🔁 追加された関数
};

const SIDEBAR_WIDTH = 256;

const Sidebar: React.FC<SidebarProps> = ({
  chatRooms,
  setChatRooms,
  selectedRoom,
  setSelectedRoom,
  setEditingRoom,
  setEditNameValue,
  setEditNameModal,
  setCreatingNewRoom,
  fetchChatRooms,
}) => {
  const [open, setOpen] = useState(true);
  const [showRoomList, setShowRoomList] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(56);

  useLayoutEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [open, chatRooms.length]);

  const handleToggleSidebar = () => {
    if (open) {
      setShowRoomList(false);
      setTimeout(() => setOpen(false), 300);
    } else {
      setOpen(true);
      setTimeout(() => setShowRoomList(true), 200);
    }
  };

  const handleNewRoom = () => {
    console.log('新しいルーム作成モードへ');
    setSelectedRoom(null); // ChatPanelで新規入力欄を表示する
    setCreatingNewRoom(true);
  };

  const handleRoomClick = (room: ChatRoom) => {
    setSelectedRoom(room);
    setCreatingNewRoom(false);
  };

  const handleEditRoom = (room: ChatRoom) => {
    setEditingRoom(room);
    setEditNameValue(room.room_name);
    setEditNameModal(true);
  };

  return (
    <div
      className="relative h-full"
      style={{
        width: open ? SIDEBAR_WIDTH : 64,
        transition: 'width 0.3s ease',
      }}
    >
      <div
        className={`h-full bg-gray-50 border-r flex flex-col transition-all duration-300 ease-in-out ${open ? 'w-64' : 'w-16'}`}
      >
        <motion.div
          className="px-4 py-3 border-b font-bold flex items-center justify-between"
          ref={headerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {open ? (
            <>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                チャットルーム
              </motion.span>
              <div className="flex gap-2">
                <motion.button
                  className="bg-white border shadow rounded-full hover:bg-green-100 flex items-center justify-center"
                  style={{ width: 32, height: 32 }}
                  onClick={fetchChatRooms}
                  title="検索"
                >
                  <Search size={18} />
                </motion.button>

                <motion.button
                  className="bg-white border shadow rounded-full hover:bg-blue-100 flex items-center justify-center ml-1"
                  style={{ width: 32, height: 32 }}
                  onClick={handleToggleSidebar}
                  aria-label="サイドバーを閉じる"
                >
                  <ChevronLeft size={20} />
                </motion.button>
              </div>
            </>
          ) : (
            <motion.button
              className="bg-white border shadow rounded-full hover:bg-blue-100 flex items-center justify-center mx-auto mt-2"
              style={{ width: 32, height: 32 }}
              onClick={handleToggleSidebar}
              aria-label="サイドバーを開く"
            >
              <ChevronRight size={20} />
            </motion.button>
          )}
        </motion.div>

        <AnimatePresence>
          {open && showRoomList && (
            <motion.div
              key="room-list"
              className="flex-1 overflow-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div className="p-2 border-b">
                <button
                  className="w-full px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  onClick={handleNewRoom}
                >
                  ＋ 新しいルーム
                </button>
              </motion.div>

              {chatRooms.map((room) => (
                <div
                  key={`room-${room.room_id}`}
                  className="flex items-center border-b"
                >
                  <button
                    className={`flex-1 text-left px-4 py-2 hover:bg-blue-100 ${
                      selectedRoom?.room_id === room.room_id
                        ? 'bg-blue-200 font-bold'
                        : ''
                    }`}
                    onClick={() => handleRoomClick(room)}
                  >
                    {room.room_name}
                  </button>
                  <button
                    className="px-2 py-1 text-xs text-blue-600 hover:underline"
                    title="名前変更"
                    onClick={() => handleEditRoom(room)}
                  >
                    編集
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!open && (
          <div className="flex-1 flex flex-col items-center justify-start gap-4 p-2">
            <button
              onClick={handleNewRoom}
              className="text-blue-500 hover:text-blue-700"
              title="新しいルーム"
            >
              <PlusCircle size={28} />
            </button>
            <button className="text-gray-500 hover:text-gray-700" title="検索">
              <Search size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
export type { ChatRoom };
