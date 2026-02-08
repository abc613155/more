import React, { useState } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { getProductRecommendation } from '../services/geminiService';
import { Product } from '../types';

const AIAssistant: React.FC<{ products: Product[] }> = ({ products }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;
    const q = query;
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setQuery('');
    setIsLoading(true);
    try {
      const res = await getProductRecommendation(q, products);
      setMessages(prev => [...prev, { role: 'ai', text: res }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '出錯了' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-24 right-4 bg-gray-900 text-white p-4 rounded-2xl shadow-xl z-50">
        <Bot size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex flex-col items-center justify-end p-4">
          <div className="bg-white w-full max-w-md h-[70vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-gray-900 p-4 text-white flex justify-between items-center">
              <span className="font-bold">AI 小幫手</span>
              <button onClick={() => setIsOpen(false)}><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-xl max-w-[80%] ${m.role === 'user' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && <Loader2 className="animate-spin" />}
            </div>
            <div className="p-4 border-t flex gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="flex-1 border rounded-xl p-2" placeholder="問我任何問題..." />
              <button onClick={handleSend} className="bg-pink-500 text-white p-2 rounded-xl"><Send size={20} /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
