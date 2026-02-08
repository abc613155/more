import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, Home, Gift, ClipboardList,
  ChevronRight, AlertCircle, Trash2, CheckCircle2, 
  UserPlus, Plus, ArrowLeft, Send, RefreshCw, Edit2, X, Info, History
} from 'lucide-react';
import { Product, CartItem, User, Order, SubBuyer } from './types';
import { fetchProducts, submitOrder, syncMember, fetchOrders } from './services/gasService';
import { calculatePromoHints } from './services/promoEngine';
import AIAssistant from './components/AIAssistant';

const parseDiopterRange = (rangeStr: string, allOptions: string[]) => {
  if (!rangeStr) return allOptions;
  const parts = rangeStr.split(/[、,]/);
  const allowed = new Set<string>();
  parts.forEach(part => {
    const p = part.trim();
    if (p.includes('~')) {
      const [start, end] = p.split('~').map(v => parseFloat(v));
      allOptions.forEach(opt => {
        const val = parseFloat(opt);
        if (val <= Math.max(start, end) && val >= Math.min(start, end)) allowed.add(opt);
      });
    } else {
      const val = parseFloat(p);
      if (!isNaN(val)) allowed.add(val.toFixed(2));
    }
  });
  return allOptions.filter(opt => allowed.has(opt));
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyers, setBuyers] = useState<SubBuyer[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [view, setView] = useState<'home' | 'cart' | 'add-buyer' | 'ordering' | 'history'>('home');
  const [activeBuyerId, setActiveBuyerId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [giftSelector, setGiftSelector] = useState<{ itemId: string, max: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [showAddFeedback, setShowAddFeedback] = useState(false);

  const [selBrand, setSelBrand] = useState('');
  const [selStyle, setSelStyle] = useState('');
  const [selColor, setSelColor] = useState('');
  const [selDiopter, setSelDiopter] = useState('');
  const [selQty, setSelQty] = useState(1);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const data = await fetchProducts();
      setProducts(data);
      setIsLoading(false);
    };
    init();
  }, []);

  const brands = useMemo(() => Array.from(new Set(products.map(p => p.brand))), [products]);
  const styles = useMemo(() => products.filter(p => p.brand === selBrand).map(p => p.style).filter((v, i, a) => a.indexOf(v) === i), [selBrand, products]);
  const colors = useMemo(() => products.filter(p => p.brand === selBrand && p.style === selStyle).map(p => p.color), [selBrand, selStyle, products]);
  const currentProduct = useMemo(() => products.find(p => p.brand === selBrand && p.style === selStyle && p.color === selColor), [selBrand, selStyle, selColor, products]);

  const baseDiopterOptions = useMemo(() => {
    const opts: string[] = ["0.00", "-0.50"];
    for (let d = -1.00; d >= -6.00; d -= 0.25) opts.push(d.toFixed(2));
    for (let d = -6.50; d >= -10.00; d -= 0.50) opts.push(d.toFixed(2));
    return opts;
  }, []);

  const filteredDiopters = useMemo(() => {
    if (!currentProduct) return baseDiopterOptions;
    return parseDiopterRange(currentProduct.diopterRange, baseDiopterOptions);
  }, [currentProduct, baseDiopterOptions]);

  const handleLineLogin = () => {
    const mockUser: User = { lineUid: 'U_MOCK_123', displayName: 'LINE 用戶' };
    setUser(mockUser);
    syncMember(mockUser);
  };

  const loadHistory = async () => {
    if (!user) return;
    setIsLoading(true);
    const orders = await fetchOrders(user.lineUid);
    setHistoryOrders(orders);
    setView('history');
    setIsLoading(false);
  };

  const editHistoryOrder = (order: Order) => {
    setCart(order.items);
    setBuyers(order.buyers);
    setView('cart');
  };

  const addBuyer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string).trim();
    const finalName = name || `訂購人 ${buyers.length + 1}`;
    const newBuyer: SubBuyer = { id: Date.now().toString(), name: finalName, phone: formData.get('phone') as string || '', email: '' };
    setBuyers(prev => [...prev, newBuyer]);
    setActiveBuyerId(newBuyer.id);
    setView('ordering');
  };

  const addToCart = () => {
    if (!currentProduct || !activeBuyerId) return;
    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      buyerId: activeBuyerId,
      productId: currentProduct.id,
      brand: currentProduct.brand,
      style: currentProduct.style,
      color: currentProduct.color,
      price: currentProduct.price,
      quantity: selQty,
      diopter: selDiopter || '0.00',
      gifts: []
    };
    setCart(prev => [...prev, newItem]);
    setShowAddFeedback(true);
    setTimeout(() => setShowAddFeedback(false), 2000);
    setSelDiopter('');
    setSelQty(1);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    setCart(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
    setEditingItem(null);
  };

  const handleCheckout = async () => {
    if (!user || cart.length === 0) return;
    setIsLoading(true);
    const order: Order = {
      userId: user.lineUid,
      buyers: buyers,
      items: cart,
      totalPrice: cart.reduce((acc, i) => acc + (i.price * i.quantity), 0),
      timestamp: new Date().toISOString()
    };
    const success = await submitOrder(order);
    setIsLoading(false);
    if (success) {
      setCart([]); setBuyers([]); setView('home'); setShowOrderSuccess(true);
      setTimeout(() => setShowOrderSuccess(false), 3000);
    }
  };

  const getBuyerSummary = (buyerId: string) => {
    const items = cart.filter(i => i.buyerId === buyerId);
    const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);
    const giftQty = items.reduce((acc, i) => acc + (i.gifts?.length || 0), 0);
    const totalPrice = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    return { count: items.length, totalQty, giftQty, totalPrice };
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6">
          <h1 className="text-2xl font-black text-gray-800">量販訂購系統</h1>
          <button onClick={handleLineLogin} className="w-full bg-[#00B900] text-white py-4 rounded-2xl font-black shadow-lg">使用 LINE 登入</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="sticky top-0 bg-white shadow-sm z-40 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-pink-500 p-1.5 rounded-lg"><ShoppingCart size={16} className="text-white" /></div>
          <h1 className="font-black text-lg">量販小幫手</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setView('home')} className="p-2"><Home size={22} /></button>
          <button onClick={loadHistory} className="p-2"><History size={22} /></button>
          <button onClick={() => setView('cart')} className="p-2 relative">
            <ShoppingCart size={22} />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">{cart.length}</span>}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        {isLoading && <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center"><RefreshCw size={32} className="animate-spin text-pink-500" /></div>}
        
        {view === 'history' && (
           <section className="space-y-6">
           <h2 className="text-2xl font-black text-gray-800">歷史訂單</h2>
           {historyOrders.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed text-gray-300">尚無訂單紀錄</div>
           ) : (
             historyOrders.map(order => (
               <div key={order.id} className="bg-white p-6 rounded-3xl border shadow-sm">
                 <div className="text-[10px] font-black text-gray-400">日期：{new Date(order.timestamp).toLocaleDateString()}</div>
                 <div className="font-black text-lg">${order.totalPrice}</div>
                 <button onClick={() => editHistoryOrder(order)} className="mt-2 text-pink-500 text-xs font-black">修改訂單</button>
               </div>
             ))
           )}
         </section>
        )}

        {view === 'home' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-6 rounded-[2rem] text-white">
              <h2 className="text-2xl font-black mb-4">幫親友選購</h2>
              <button onClick={() => setView('add-buyer')} className="bg-white text-pink-600 px-6 py-4 rounded-2xl font-black w-full flex justify-center items-center gap-2 shadow-lg">
                <UserPlus size={20} /> 新增訂購人
              </button>
            </div>
            <section>
              <h2 className="text-lg font-black text-gray-800 mb-4 px-1">目前訂購人 ({buyers.length})</h2>
              {buyers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-[2rem] border-2 border-dashed text-gray-400">尚未新增訂購人</div>
              ) : (
                <div className="grid gap-3">
                  {buyers.map((b) => {
                    const summary = getBuyerSummary(b.id);
                    return (
                      <div key={b.id} className="bg-white p-5 rounded-2xl border flex justify-between items-center">
                        <div>
                          <div className="font-black text-gray-800">{b.name}</div>
                          <div className="text-[10px] text-gray-400">已選 {summary.totalQty} 盒 | ${summary.totalPrice}</div>
                        </div>
                        <button onClick={() => { setActiveBuyerId(b.id); setView('ordering'); }} className="text-pink-500 font-black text-xs">選購</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {view === 'add-buyer' && (
          <section className="bg-white rounded-3xl p-8 shadow-xl space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2"><ArrowLeft onClick={() => setView('home')} className="cursor-pointer" /> 訂購人資訊</h2>
            <form onSubmit={addBuyer} className="space-y-5">
              <input name="name" className="w-full bg-gray-50 border-2 rounded-2xl p-4 font-bold" placeholder="姓名" />
              <input name="phone" className="w-full bg-gray-50 border-2 rounded-2xl p-4 font-bold" placeholder="電話" />
              <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black">確認並開始選購</button>
            </form>
          </section>
        )}

        {view === 'ordering' && (
          <section className="space-y-4">
             <div className="bg-white p-6 rounded-[2.5rem] shadow-xl space-y-5">
              <div className="flex items-center gap-2"><ArrowLeft onClick={() => setView('home')} className="cursor-pointer" /><h2 className="text-xl font-black">幫 {buyers.find(b => b.id === activeBuyerId)?.name} 選購</h2></div>
              <div className="space-y-4">
                <select value={selBrand} onChange={(e) => setSelBrand(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl font-bold">
                  <option value="">選擇品牌</option>{brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {selBrand && <select value={selStyle} onChange={(e) => setSelStyle(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl font-bold">
                  <option value="">選擇系列</option>{styles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>}
                {selStyle && <select value={selColor} onChange={(e) => setSelColor(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl font-bold">
                  <option value="">選擇顏色</option>{colors.map(c => <option key={c} value={c}>{c}</option>)}
                </select>}
              </div>
              {currentProduct && (
                <div className="space-y-5 pt-4 border-t mt-2">
                  <div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-400">單價</span><span className="text-2xl font-black text-gray-800">${currentProduct.price}</span></div>
                  <div className="grid grid-cols-2 gap-4">
                    <select value={selDiopter} onChange={(e) => setSelDiopter(e.target.value)} className="bg-gray-50 p-4 rounded-2xl font-bold border-2">
                      <option value="">選擇度數</option>{filteredDiopters.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <select value={selQty} onChange={(e) => setSelQty(parseInt(e.target.value))} className="bg-gray-50 p-4 rounded-2xl font-bold border-2">
                      {Array.from({length: 20}, (_, i) => i + 1).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <button onClick={addToCart} className="w-full bg-pink-500 text-white py-5 rounded-2xl font-black">加入購物車</button>
                </div>
              )}
            </div>
          </section>
        )}

        {view === 'cart' && (
          <section className="space-y-6 pb-32">
            <h2 className="text-2xl font-black">購物車</h2>
            {cart.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">購物車空空如也</div>
            ) : (
              buyers.map(buyer => {
                const buyerItems = cart.filter(i => i.buyerId === buyer.id);
                if (buyerItems.length === 0) return null;
                return (
                  <div key={buyer.id} className="bg-white rounded-3xl border p-6 space-y-4">
                    <div className="font-black border-b pb-2">訂購人：{buyer.name}</div>
                    {buyerItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="text-sm font-bold">{item.brand} {item.style} - {item.color} ({item.diopter}) x{item.quantity}</div>
                        <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}><Trash2 size={16} className="text-red-400" /></button>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
            {cart.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-white p-6 border-t shadow-2xl z-50">
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between mb-4 font-black"><span>總計</span><span>${cart.reduce((acc, i) => acc + (i.price * i.quantity), 0)}</span></div>
                  <button onClick={handleCheckout} className="w-full bg-pink-500 text-white py-4 rounded-2xl font-black">送出團購訂單</button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <AIAssistant products={products} />
    </div>
  );
};

export default App;
