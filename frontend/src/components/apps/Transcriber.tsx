'use client';
import { useRef, useState, useEffect } from 'react';
import { Mic, MicOff, Save, Trash, Pencil, Repeat, Play } from 'lucide-react';

interface TranscriptMessage {
  id: string;
  timestamp: string;
  speaker: string;
  text: string;
  isRight: boolean;
}

export default function TranscriptionApp() {
  const [isRecording, setIsRecording] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState('Operator');
  const [autoScroll, setAutoScroll] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem('transcriptMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('transcriptMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (log.length === 0) return;
    const lastLine = log[log.length - 1];

    if (
      lastLine.startsWith('🟢') ||
      lastLine.startsWith('🔴') ||
      lastLine.startsWith('🔌') ||
      lastLine.startsWith('⛔')
    ) {
      return;
    }

    try {
      const parsed = JSON.parse(lastLine);
      const { speaker, text, timestamp } = parsed;
      if (speaker === 'Unknown') return;

      const isRight = speaker === 'Operator';

      const newMessage: TranscriptMessage = {
        id: Date.now().toString(),
        timestamp,
        speaker,
        text,
        isRight,
      };

      setTimeout(() => {
        setMessages((prev) => [...prev, newMessage]);
      }, 1000);
    } catch (e) {
      console.error('JSON parsing error:', e);
    }
  }, [log]);

  useEffect(() => {
    if (autoScroll && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const downsampleBuffer = (
    buffer: Float32Array,
    inputSampleRate: number,
    outputSampleRate: number,
  ): Int16Array => {
    const ratio = inputSampleRate / outputSampleRate;
    const length = Math.round(buffer.length / ratio);
    const result = new Int16Array(length);
    for (let i = 0; i < length; i++) {
      const idx = Math.round(i * ratio);
      const s = Math.max(-1, Math.min(1, buffer[idx]));
      result[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return result;
  };

  const startRecording = async () => {
    const socket = new WebSocket(
      'wss://azure-speech2text-api-cyachmdeaffdasdz.japaneast-01.azurewebsites.net/ws',
    );
    socketRef.current = socket;

    socket.onclose = () => setLog((prev) => [...prev, '🔌 WebSocket切断']);
    socket.onerror = (event) =>
      setLog((prev) => [...prev, `🔴 エラー: ${JSON.stringify(event)}`]);
    socket.onmessage = (event) => setLog((prev) => [...prev, `${event.data}`]);

    socket.onopen = async () => {
      setLog((prev) => [...prev, '🟢 WebSocket接続完了']);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          const downsampled = downsampleBuffer(
            input,
            audioContext.sampleRate,
            16000,
          );
          const buffer = new ArrayBuffer(downsampled.length * 2);
          const view = new DataView(buffer);
          for (let i = 0; i < downsampled.length; i++) {
            view.setInt16(i * 2, downsampled[i], true);
          }
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(buffer);
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        streamRef.current = stream;
        audioContextRef.current = audioContext;
        processorRef.current = processor;
        sourceRef.current = source;
      } catch (error) {
        setLog((prev) => [...prev, `🔴 マイク接続エラー: ${error}`]);
      }
    };

    setIsRecording(true);
  };

  const stopRecording = () => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    socketRef.current?.close();
    socketRef.current = null;
    setIsRecording(false);
    setLog((prev) => [...prev, '⛔ 録音停止']);
  };

  const changeSpeaker = () => {
    const speakers = ['Operator', 'Guest-2', 'Host'];
    const currentIndex = speakers.indexOf(currentSpeaker);
    const nextIndex = (currentIndex + 1) % speakers.length;
    setCurrentSpeaker(speakers[nextIndex]);
  };

  const clearTranscript = () => {
    if (confirm('本当に全ての文字起こしを削除しますか？')) {
      setMessages([]);
      setLog([]);
    }
  };

  const saveTranscript = () => {
    const json = JSON.stringify(messages, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleMessageSide = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              isRight: !msg.isRight,
              speaker: msg.speaker === 'Operator' ? 'Customer' : 'Operator',
            }
          : msg,
      ),
    );
  };

  const updateMessageText = (id: string, text: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, text } : msg)),
    );
    setEditingId(null);
  };

  const handleEditCancel = (id: string) => {
    if (editingText !== originalText) {
      setPendingCancelId(id);
      setShowModal(true);
    } else {
      setEditingId(null);
    }
  };

  const confirmCancelEdit = () => {
    if (pendingCancelId) {
      setEditingId(null); // 編集モード解除
      setPendingCancelId(null); // 保持してたIDも初期化
    }
    setShowModal(false);
  };

  const cancelCancelEdit = () => {
    setShowModal(false);
    setPendingCancelId(null);
  };
  return (
    <div className="relative flex flex-col h-full">
      {/* オーバーレイ付きのキャンセル確認モーダル */}
      {showModal && (
        <div className="absolute inset-0 bg-black/50 bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow w-80 text-center space-y-4">
            <p className="text-sm text-gray-700">
              変更内容が保存されませんがよろしいでしょうか？
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmCancelEdit}
                className="px-3 py-1 text-white bg-red-500 rounded"
              >
                はい
              </button>
              <button
                onClick={cancelCancelEdit}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 border-b bg-white shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-gray-800">文字起こし</h1>
            {isRecording && (
              <div className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span>録音中</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              className="border px-3 py-1 rounded text-sm"
              onClick={changeSpeaker}
            >
              {currentSpeaker}
            </button>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`text-white text-sm px-3 py-1 rounded ${isRecording ? 'bg-red-500' : 'bg-blue-500'}`}
            >
              {isRecording ? (
                <MicOff className="inline-block h-4 w-4 mr-1" />
              ) : (
                <Mic className="inline-block h-4 w-4 mr-1" />
              )}
              {isRecording ? '停止' : '開始'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-scroll"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            <label htmlFor="auto-scroll">自動スクロール</label>
          </div>

          <div className="flex items-center space-x-2">
            <button
              className="border px-3 py-1 rounded text-sm"
              onClick={saveTranscript}
            >
              <Save className="inline-block h-4 w-4 mr-1" /> 保存
            </button>
            <button
              className="border px-3 py-1 rounded text-sm"
              onClick={clearTranscript}
            >
              <Trash className="inline-block h-4 w-4 mr-1" /> クリア
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
        <div className="space-y-5 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isRight ? 'justify-end' : 'justify-start'} group relative`}
            >
              <div
                className={`relative w-full max-w-[80%] p-3 rounded-lg ${message.isRight ? 'bg-blue-100' : 'bg-gray-200'}`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {message.speaker === 'Operator'
                    ? 'オペレーター'
                    : 'カスタマー'}
                </div>

                {editingId === message.id ? (
                  <>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          updateMessageText(message.id, editingText);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          handleEditCancel(message.id);
                        }
                      }}
                      autoFocus
                      rows={4}
                      className="w-full text-sm text-gray-800 border border-gray-300 rounded p-2 resize-none"
                      style={{ minHeight: '90px' }}
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => handleEditCancel(message.id)}
                        className="px-3 py-1 text-sm bg-gray-300 rounded"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={() =>
                          updateMessageText(message.id, editingText)
                        }
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
                      >
                        決定
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {message.text}
                  </p>
                )}

                <div
                  className={`absolute text-xs text-gray-400 bottom-[-1.25rem] ${message.isRight ? 'right-0' : 'left-0'}`}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="absolute -top-5 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button className="p-1 bg-white rounded shadow" title="再生">
                  <Play className="w-4 h-4" />
                </button>
                <button
                  className="p-1 bg-white rounded shadow"
                  title="左右切替"
                  onClick={() => toggleMessageSide(message.id)}
                >
                  <Repeat className="w-4 h-4" />
                </button>
                <button
                  className="p-1 bg-white rounded shadow"
                  title="編集"
                  onClick={() => {
                    setEditingId(message.id);
                    setEditingText(message.text);
                    setOriginalText(message.text);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    </div>
  );
}
