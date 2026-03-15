import { useState, useEffect } from 'react';
import { Search, UserPlus, ShieldCheck, Ghost, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

export default function Discover() {
  const { user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  useEffect(() => {
    const fetchAllUsers = async () => {
      setIsSearching(true);
      try {
        const res = await api.get('/users');
        const users = res.data.data || res.data || [];
        // Filter out yourself immediately
        setAllUsers(users.filter(u => u.id !== currentUser?.id));
      } catch (error) {
        console.error("❌ [Discover] Fetch failed:", error);
      } finally {
        setIsSearching(false);
      }
    };
    if (currentUser?.id) fetchAllUsers();
  }, [currentUser]);

  // DIRECT CALCULATION: No useMemo, no useEffect. 
  // This runs fresh on every single keystroke.
  const filteredResults = allUsers.filter(u => {
    const term = search.toLowerCase().trim();
    if (!term) return true; // Show all if search is empty
    return (
      u.username.toLowerCase().includes(term) || 
      u.email.toLowerCase().includes(term)
    );
  });

  const sendRequest = async (userId) => {
    try {
      await api.post('/friends/request', { receiver_id: userId });
      setFeedback({ type: 'success', msg: 'Identity link requested!' });
      setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Request failed.' });
    }
    setTimeout(() => setFeedback({ type: '', msg: '' }), 3000);
  };

  return (
    <div className="h-full bg-[#09090b] text-zinc-100 p-8 overflow-y-auto selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto w-full">
        
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Discover Identities</h1>
          <p className="text-zinc-500 text-sm">Search the encrypted social graph to establish new secure channels</p>
        </header>

        <div className="relative mb-12 group">
          <div className="relative flex items-center">
            <Search className="absolute left-5 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by username or email handle..."
              className="w-full pl-14 pr-6 py-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 focus:border-indigo-500/50 outline-none transition-all text-zinc-100 placeholder:text-zinc-700 shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
            {isSearching && (
              <Loader2 className="absolute right-5 animate-spin text-indigo-500" size={20} />
            )}
          </div>
        </div>

        <AnimatePresence>
          {feedback.msg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-8 p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${
                feedback.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              <CheckCircle2 size={16}/> {feedback.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResults.length === 0 && !isSearching && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30 text-center">
              <Ghost size={48} className="mb-4" />
              <p className="text-sm font-bold tracking-widest uppercase">No identities match your search</p>
            </div>
          )}

          {filteredResults.map((u) => (
            <motion.div 
              layout
              key={u.id} 
              className="flex items-center justify-between p-5 bg-zinc-900/40 border border-zinc-800 rounded-3xl hover:border-zinc-700 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-lg font-bold text-indigo-400 border border-zinc-700 uppercase">
                  {u.username?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                    {u.username}
                    <ShieldCheck size={12} className="text-zinc-600" />
                  </h3>
                  <p className="text-[10px] text-zinc-600 font-mono tracking-tighter uppercase">{u.email}</p>
                </div>
              </div>
              
              <button 
                onClick={() => sendRequest(u.id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/10 active:scale-95"
              >
                <UserPlus size={16} />
                Connect
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}