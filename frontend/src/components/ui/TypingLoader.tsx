import { useEffect, useState } from 'react';

const TypingLoader: React.FC = () => {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      setDots((dots) => (dots.length >= 3 ? '' : dots + '・'));
    }, 400);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="text-blue-400 pl-1 animate-pulse">{dots || '・'}</span>
  );
};

export default TypingLoader;
