import React, { useState } from 'react';

type Props = {
  code: string;
  language?: string;
  typingCursor?: boolean;
};

const CopyableCodeBlock: React.FC<Props> = ({
  code,
  language,
  typingCursor,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-md p-3 overflow-x-auto my-2 text-sm">
        <code className={language ? `language-${language}` : undefined}>
          {code}
          {typingCursor && (
            <span className="inline-block animate-blink ml-1 text-blue-300">
              |
            </span>
          )}
        </code>
      </pre>
      <button
        className="absolute top-2 right-3 text-xs text-gray-300 bg-gray-800 rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center"
        onClick={handleCopy}
        type="button"
        tabIndex={-1}
      >
        {copied ? (
          '✓ コピー済'
        ) : (
          <>
            <svg width="16" height="16" className="mr-1">
              <rect
                width="12"
                height="12"
                x="2"
                y="2"
                fill="none"
                stroke="currentColor"
                rx="2"
              />
              <rect
                width="12"
                height="12"
                x="4"
                y="4"
                fill="none"
                stroke="currentColor"
                rx="2"
              />
            </svg>
            コピーする
          </>
        )}
      </button>
    </div>
  );
};

export default CopyableCodeBlock;
