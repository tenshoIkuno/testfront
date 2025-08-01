import MarkdownRender from '../markdown/MarkdownRender';

// 共通ChatMessage型（呼び出し元と揃える）
export type ChatMessage = {
  id: string;
  room_id: number;
  sender: 'user' | 'assistant';
  text: string;
  created_at: string;
};

type Props = {
  message: ChatMessage;
  children?: React.ReactNode;
};

const ChatMessageBubble: React.FC<Props> = ({ message, children }) => {
  return (
    <div
      className={`max-w-xl px-4 py-2 rounded-xl shadow text-base whitespace-pre-line ${
        message.sender === 'user'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-black'
      }`}
      style={{ fontFamily: 'inherit', wordBreak: 'break-word' }}
    >
      {children ? (
        children
      ) : message.sender === 'assistant' ? (
        <MarkdownRender>{message.text}</MarkdownRender>
      ) : (
        message.text
      )}
    </div>
  );
};

export default ChatMessageBubble;
