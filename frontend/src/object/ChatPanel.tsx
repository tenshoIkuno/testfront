// ChatPanel.tsx

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react';
import ChatMessageBubble from '../components/chat/ChatMessageBubble';
import TypingLoader from '../components/ui/TypingLoader';
import { TypewriterWithCursor } from '../components/chat/TypewriterWithCursor';

//const typeAni = true; // タイピングアニメーション有効/無効切替
const typeAni = false;
type ChatRoom = {
  room_id: number;
  room_name: string;
  created_at: string;
  updated_at: string;
};

type ChatMessage = {
  id: string;
  room_id: number;
  sender: 'user' | 'assistant';
  text: string;
  created_at: string;
};

type ChatPanelProps = {
  selectedRoom: ChatRoom | null;
  userEmail: string;
  aiTyping: boolean;
  setAITyping: (flag: boolean) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  accessToken: string;
  fetchChatRooms: () => Promise<void>;
  onSelectRoom: (room: ChatRoom) => void;
  creatingNewRoom: boolean;
  setCreatingNewRoom: (flag: boolean) => void;
  createAndSelectNewRoom: (roomName: string) => Promise<ChatRoom | null>;
};

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function* typeWriter(text: string, speed = 15) {
  let cur = '';
  for (let i = 0; i < text.length; i++) {
    cur += text[i];
    yield cur;
    await sleep(speed);
  }
}

function getConfirmedMarkdown(text: string): [string, string] {
  const codeMatch = text.match(/```/g);
  if (codeMatch && codeMatch.length % 2 === 1) {
    const lastOpen = text.lastIndexOf('```');
    if (lastOpen >= 0) {
      return [text.slice(0, lastOpen), text.slice(lastOpen)];
    }
  }
  return [text, ''];
}

export default function ChatPanel({
  selectedRoom,
  userEmail,
  aiTyping,
  setAITyping,
  messages,
  setMessages,
  accessToken,
  fetchChatRooms,
  onSelectRoom,
  creatingNewRoom,
  setCreatingNewRoom,
  createAndSelectNewRoom,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [typingContent, setTypingContent] = useState('');
  const [typingStarted, setTypingStarted] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSending = useRef(false);
  const autoScrollRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const handleScroll = useCallback(() => {
    const box = scrollRef.current;
    if (!box) return;
    const atBottom =
      Math.abs(box.scrollHeight - box.scrollTop - box.clientHeight) < 30;
    setIsAtBottom(atBottom);
    autoScrollRef.current = atBottom;
  }, []);

  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    box.addEventListener('scroll', handleScroll);
    setTimeout(() => {
      box.scrollTop = box.scrollHeight;
      setIsAtBottom(true);
      autoScrollRef.current = true;
    }, 0);
    return () => {
      box.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    if (autoScrollRef.current) {
      setTimeout(() => {
        box.scrollTop = box.scrollHeight;
      }, 10);
    }
  }, [messages, aiTyping, typingContent]);

  useEffect(() => {
    if (!selectedRoom?.room_id || aiTyping) return;
    const fetchChatHistory = async (roomId: number) => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL;
        const url = `${API_BASE}/chat_logs?room_id=${roomId}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        const history: ChatMessage[] = (data.chat_logs || []).map(
          (log: any, idx: number) => ({
            id: `history-${idx}`,
            room_id: log.room_id,
            sender: log.speaker === 2 ? 'user' : 'assistant',
            text: log.chat_history,
            created_at: log.created_at,
          }),
        );
        setMessages(history);
      } catch (e) {
        setMessages([
          {
            id: 'err',
            room_id: roomId,
            sender: 'assistant',
            text:
              'チャット履歴取得エラー: ' +
              (e instanceof Error ? e.message : String(e)),
            created_at: new Date().toISOString(),
          },
        ]);
      }
    };
    fetchChatHistory(selectedRoom.room_id);
  }, [selectedRoom, aiTyping, accessToken]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending.current) return;

    let currentRoom = selectedRoom;

    if (!currentRoom) {
      try {
        const newRoom = await createAndSelectNewRoom(text.substring(0, 10));
        if (!newRoom) throw new Error('ルーム作成失敗');
        onSelectRoom(newRoom);
        await fetchChatRooms();
        currentRoom = newRoom;
        setCreatingNewRoom(false);
        await sleep(500);
      } catch (e) {
        alert(
          'チャットルーム作成エラー: ' +
            (e instanceof Error ? e.message : String(e)),
        );
        return;
      }
    }

    if (!currentRoom?.room_id) return;

    isSending.current = true;
    const msgId = Math.random().toString(36).slice(2);

    const userMsg: ChatMessage = {
      id: msgId + '-user',
      room_id: currentRoom.room_id,
      sender: 'user',
      text,
      created_at: new Date().toISOString(),
    };

    setMessages((msgs) => [...msgs, userMsg]);
    setInput('');
    setAITyping(true);
    setTypingStarted(false);

    const API_BASE = import.meta.env.VITE_API_BASE_URL;
    const WEBAPIS_ENDPOINT = `${API_BASE}/message`;

    const payload: any = {
      room_id: currentRoom.room_id,
      message: userMsg.text,
    };
    if (selectedPlugin) payload.plugin_id = selectedPlugin;

    try {
      const aiRes = await fetch(WEBAPIS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!aiRes.ok) throw new Error(await aiRes.text());

      const apiResult = await aiRes.json();
      const aiMsgText =
        apiResult?.choices?.[0]?.message?.content || '（AI返答なし）';

      const aiMessageId = msgId + '-ai';

      if (!typeAni) {
        setMessages((msgs) => [
          ...msgs,
          {
            id: aiMessageId,
            room_id: currentRoom!.room_id,
            sender: 'assistant',
            text: aiMsgText,
            created_at: new Date().toISOString(),
          },
        ]);
        setAITyping(false);
        isSending.current = false;
        return;
      }

      setTypingMessageId(aiMessageId);
      setTypingStarted(false);
      await sleep(700);
      setTypingStarted(true);

      let cur = '';
      for await (const next of typeWriter(aiMsgText, 18)) {
        cur = next;
        setTypingContent(cur);
        setMessages((msgs) => {
          const existIdx = msgs.findIndex((m) => m.id === aiMessageId);
          if (existIdx >= 0) {
            return msgs.map((m, i) =>
              i === existIdx ? { ...m, text: cur } : m,
            );
          } else {
            return [
              ...msgs,
              {
                id: aiMessageId,
                room_id: currentRoom!.room_id,
                sender: 'assistant',
                text: cur,
                created_at: new Date().toISOString(),
              },
            ];
          }
        });
      }

      setTypingMessageId(null);
      setTypingContent('');
      setTypingStarted(false);
      setAITyping(false);
      isSending.current = false;
    } catch (e) {
      setMessages((msgs) => [
        ...msgs,
        {
          id: msgId + '-err',
          room_id: currentRoom!.room_id,
          sender: 'assistant',
          text: 'AI応答エラー: ' + (e instanceof Error ? e.message : String(e)),
          created_at: new Date().toISOString(),
        },
      ]);
      setAITyping(false);
      setTypingMessageId(null);
      setTypingContent('');
      isSending.current = false;
    }
  };

  function renderMessagesWithAILoader() {
    return messages.map((m, i) => {
      const isTypingMsg =
        aiTyping &&
        typingMessageId === m.id &&
        m.sender === 'assistant' &&
        i === messages.length - 1;

      let confirmedMd = '';
      let typingRest = '';
      if (typeAni && isTypingMsg && typingContent) {
        [confirmedMd, typingRest] = getConfirmedMarkdown(typingContent);
      }

      return (
        <div
          key={m.id}
          className={`mb-2 flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <ChatMessageBubble message={m}>
            {/* タイピング中のビジュアル切替 */}
            {isTypingMsg ? (
              typeAni ? (
                typingStarted ? (
                  <div style={{ whiteSpace: 'pre-line', display: 'inline' }}>
                    {confirmedMd && (
                      <span>
                        {confirmedMd}
                        <br />
                      </span>
                    )}
                    <TypewriterWithCursor text={typingRest} />
                  </div>
                ) : (
                  <TypingLoader />
                )
              ) : (
                <TypingLoader />
              )
            ) : undefined}
          </ChatMessageBubble>
        </div>
      );
    });
  }

  if (!selectedRoom) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white">
        <form
          className="flex w-full max-w-xl border rounded overflow-hidden"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="flex-1 px-4 py-3 border-r outline-none"
            value={input}
            placeholder="新しいチャットを開始..."
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 disabled:opacity-50"
            disabled={!input.trim()}
          >
            開始
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white relative">
      <form
        className="flex border-t p-4 bg-gray-50"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <div className="relative mr-2">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={selectedPlugin || ''}
            onChange={(e) =>
              setSelectedPlugin(e.target.value === '' ? null : e.target.value)
            }
          >
            <option value="">ツール未選択</option>
            <option value="PRODUCT_MULTI">製品検索（複数）</option>
            <option value="PRODUCT">製品検索</option>
            <option value="DOCS">社内規約検索</option>
          </select>
        </div>

        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-l border outline-none"
          value={input}
          placeholder="メッセージを入力..."
          disabled={aiTyping}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !aiTyping) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <button
          type="submit"
          className="bg-blue-500 text-white px-6 rounded-r disabled:opacity-50"
          disabled={!input.trim() || aiTyping}
        >
          送信
        </button>
      </form>

      <div
        ref={scrollRef}
        className="flex-1 p-6 overflow-auto"
        style={{ minHeight: 0, position: 'relative', background: 'white' }}
      >
        {renderMessagesWithAILoader()}
        <div ref={messagesEndRef}></div>
      </div>
    </div>
  );
}
