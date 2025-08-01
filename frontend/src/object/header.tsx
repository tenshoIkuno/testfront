'use client';

import { useState } from 'react';
import { FileText, LogOut, Settings, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type HeaderProps = {
  onToggleTranscript: () => void;
  onLogout: () => void;
  userStatus?: string;
  companyStatus: boolean;
};

export default function Header({
  onToggleTranscript,
  onLogout,
  userStatus,
  companyStatus,
}: HeaderProps) {
  const [activeTab, setActiveTab] = useState<'product' | 'policy'>('product');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // 仮のユーザー名。親で渡したい場合はpropsで渡してOK
  const userName = userStatus || 'ユーザー';

  // companyStatusを分かりやすくテキスト化
  let companyStatusText = '';
  if (companyStatus) {
    companyStatusText = `あなたは「仮登録ユーザー」です`;
  } else if (!companyStatus) {
    companyStatusText = `あなたは「本登録ユーザー」です`;
  } else {
    companyStatusText = `あなたは「未登録」です`;
  }

  return (
    <header className="w-full bg-white border-b border-gray-100 flex items-center justify-between px-6 py-3 shadow-sm">
      <div className="flex flex-col">
        <div className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
          アイちゃん Plus
        </div>
        <div className="text-xs text-gray-500 mt-1 ml-1">
          {companyStatusText}
        </div>
      </div>

      <nav className="flex shadow-sm rounded-lg overflow-hidden">
        <button
          className={`px-5 py-2 transition-all duration-300 focus:outline-none ${
            activeTab === 'product'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('product')}
        >
          製品情報検索
        </button>
        <button
          className={`px-5 py-2 transition-all duration-300 focus:outline-none ${
            activeTab === 'policy'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('policy')}
        >
          社内規定検索
        </button>
      </nav>

      <div className="flex items-center space-x-5">
        {/* <span className="text-sm text-gray-500">{companyStatus}</span> → 上で必ず表示する形に */}

        <button
          onClick={onToggleTranscript}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-600 hover:text-violet-600 hover:bg-violet-50 transition-colors focus:outline-none"
        >
          <FileText className="h-5 w-5" />
          <span className="sr-only">文字起こし</span>
        </button>

        <div
          className="relative"
          onMouseEnter={() => setShowProfileMenu(true)}
          onMouseLeave={() => setShowProfileMenu(false)}
        >
          <button className="flex items-center space-x-2 px-3 py-1.5 rounded-full hover:bg-violet-50 transition-all duration-300 focus:outline-none">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 transition-transform duration-300 hover:scale-105 flex items-center justify-center bg-gradient-to-r from-violet-500 to-indigo-400 text-white">
              <img
                src="/placeholder.svg?height=32&width=32"
                alt="ユーザー"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.textContent = 'ユ';
                  }
                }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {userName}
            </span>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden z-50"
              >
                <div className="py-1">
                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-violet-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-violet-500" />
                    <span>プロフィール</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-violet-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-violet-500" />
                    <span>設定</span>
                  </a>
                  <div className="border-t border-gray-100 my-1"></div>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onLogout();
                    }}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>ログアウト</span>
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
