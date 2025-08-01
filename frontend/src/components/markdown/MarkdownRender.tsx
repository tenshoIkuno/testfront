// components/MarkdownRender.tsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// コピーボタン付きコードブロック
const CopyableCodeBlock: React.FC<{ code: string; language?: string }> = ({
  code,
  language,
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
            <svg
              width="16"
              height="16"
              className="mr-1"
              viewBox="0 0 16 16"
              fill="none"
            >
              <rect
                width="12"
                height="12"
                x="2"
                y="2"
                stroke="currentColor"
                rx="2"
              />
              <rect
                width="12"
                height="12"
                x="4"
                y="4"
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

// マークダウン装飾
const MarkdownRender: React.FC<{ children: string }> = ({ children }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    // ↓ここでanyでpropsを受けると型エラー消える
    components={{
      code({
        inline,
        className,
        children,
        ...props
      }: {
        inline?: boolean;
        className?: string;
        children?: React.ReactNode;
      } & React.HTMLAttributes<HTMLElement>) {
        const match = /language-(\w+)/.exec(className || '');
        const codeStr = String(children).replace(/\n$/, '');
        if (inline) {
          return (
            <code
              className="bg-gray-100 rounded px-1 py-0.5 text-[0.95em]"
              {...props}
            >
              {children}
            </code>
          );
        }
        return <CopyableCodeBlock code={codeStr} language={match?.[1]} />;
      },
      // お好みの他装飾
      table: (props) => (
        <table
          className="border border-collapse my-2 w-full bg-white"
          {...props}
        />
      ),
      th: (props) => (
        <th className="border px-2 py-1 bg-gray-100 text-left" {...props} />
      ),
      td: (props) => <td className="border px-2 py-1" {...props} />,
      img: (props) => (
        <img
          className="max-w-xs rounded my-2 border"
          {...props}
          alt={props.alt ?? ''}
        />
      ),
      a: (props) => (
        <a
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      ),
    }}
  >
    {children}
  </ReactMarkdown>
);

export default MarkdownRender;
