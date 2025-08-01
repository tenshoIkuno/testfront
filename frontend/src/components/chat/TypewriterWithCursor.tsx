import React, { useEffect, useState } from 'react';
import MarkdownRender from '../markdown/MarkdownRender';

type Props = {
  text: string;
  speed?: number;
  onDone?: () => void;
};

export const TypewriterWithCursor: React.FC<Props> = ({
  text,
  speed = 120, // 行単位ならちょっと遅めの方が良いです
  onDone,
}) => {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    setLines([]);
    setDone(false);

    const allLines = text.split('\n');
    const interval = setInterval(() => {
      setLines(allLines.slice(0, i + 1));
      i++;
      if (i >= allLines.length) {
        clearInterval(interval);
        setDone(true);
        if (onDone) onDone();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onDone]);

  useEffect(() => {
    if (!done) {
      const timer = setInterval(() => setShowCursor((v) => !v), 500);
      return () => clearInterval(timer);
    }
  }, [done]);

  const display = lines.join('\n');
  return (
    <span className="inline-block align-bottom">
      <MarkdownRender>{display}</MarkdownRender>
      {!done && (
        <span
          className="text-blue-500 animate-blink"
          style={{ opacity: showCursor ? 1 : 0, marginLeft: 0 }}
        >
          |
        </span>
      )}
    </span>
  );
};
