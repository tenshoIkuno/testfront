// src/components/ui/LoadingIndicator.tsx
interface LoadingIndicatorProps {
  message?: string;
}

export default function LoadingIndicator({
  message = '失敗✖✖',
}: LoadingIndicatorProps) {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" />
        </div>
        <div className="text-sm text-gray-500">{message}</div>
      </div>
    </div>
  );
}
