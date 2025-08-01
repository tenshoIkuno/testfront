import React from 'react';
import MarkdownRender from '../markdown/MarkdownRender';
import { getConfirmedMarkdown } from '../../lib/utils';

// ChatGPT風 ローディングドット
const LoadingDots = () => {
  const [dot, setDot] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setDot((d) => (d + 1) % 4), 420);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="text-xl font-mono select-none ml-2" aria-label="Loading">
      {['', '.', '..', '...'][dot]}
    </span>
  );
};

// タイピングアニメーション中バブル
type TypingBubbleProps = {
  content: string;
  isTyping: boolean;
};

const TypingBubble: React.FC<TypingBubbleProps> = ({ content, isTyping }) => {
  // マークダウンが確定した部分と未確定部分
  const [confirmedMd, typingRest] = getConfirmedMarkdown(content);

  // "カーソル"は常に未確定部分の末尾で点滅
  return (
    <div>
      {confirmedMd && <MarkdownRender>{confirmedMd}</MarkdownRender>}
      <span>
        {typingRest}
        {isTyping && (
          <span
            className="text-blue-500 animate-blink align-baseline ml-0.5"
            style={{ fontWeight: 600 }}
          >
            |
          </span>
        )}
      </span>
    </div>
  );
};

export { TypingBubble, LoadingDots };
