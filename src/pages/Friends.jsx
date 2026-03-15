import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserMinus, Check, X, Clock, ShieldCheck, Ghost, Loader2, AlertTriangle } from 'lucide-react';
import api from '../api/axios';

// --- CUSTOM MODAL COMPONENT ---
const ConfirmModal = ({ isOpen, onClose, onConfirm, friendName, isProcessing }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Blurred Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isProcessing ? onClose : null}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        {/* Modal Card */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-[#09090b] border border-zinc-800 rounded-[32px] p-8 shadow-2xl shadow-red-500/10"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
              {isProcessing ? (
                <Loader2 className="text-red-500 animate-spin" size={28} />
              ) : (
                <AlertTriangle className="text-red-500" size={28} />
              )}
            </div>
            
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Terminate Connection?</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8 px-4">
              You are about to sever the encrypted link with <span className="text-zinc-200 font-bold">@{friendName}</span>. 
              This will immediately archive the identity and close the secure channel.
            </p>

            <div className="flex gap-3 w-full">
              <button 
                disabled={isProcessing}
                onClick={onClose}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold rounded-2xl border border-zinc-800 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={isProcessing}
                onClick={onConfirm}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Terminate"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal State
  const [modalData, setModalData] = useState({ isOpen: false, friendId: null, friendName: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests')
      ]);
      setFriends(friendsRes.data.data || friendsRes.data || []);
      setRequests(requestsRes.data.data || requestsRes.data || []);
    } catch (err) {
      console.error("Failed to sync social graph:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = async (requestId, action) => {
    try {
      const endpoint = action === 'accept' ? '/friends/accept' : '/friends/reject';
      await api.post(endpoint, { request_id: requestId });
      fetchData(); 
    } catch (err) {
      console.error(`❌ ${action} failed:`, err.response?.data);
      alert(err.response?.data?.detail || `Operation failed: ${action}`);
    }
  };

  // --- MODAL HANDLERS ---
  const openConfirmModal = (friend) => {
    setModalData({ 
      isOpen: true, 
      friendId: friend.id, 
      friendName: friend.username 
    });
  };

  const closeConfirmModal = () => {
    if (isProcessing) return;
    setModalData({ isOpen: false, friendId: null, friendName: '' });
  };

  const handleConfirmTerminate = async () => {
    if (!modalData.friendId) return;
    
    setIsProcessing(true);
    try {
      // Ensure this endpoint matches your backend exactly
      await api.delete(`/friends/${modalData.friendId}`);
      
      // We manually update local state first for instant UI feedback
      setFriends(prev => prev.filter(f => f.id !== modalData.friendId));
      
      // Then sync with server
      await fetchData();
      setModalData({ isOpen: false, friendId: null, friendName: '' });
    } catch (err) {
      console.error("Termination failed:", err);
      alert("Failed to sever connection. Please check network.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full bg-[#09090b] text-zinc-100 p-8 overflow-y-auto selection:bg-indigo-500/30">
      
      <ConfirmModal 
        isOpen={modalData.isOpen} 
        onClose={closeConfirmModal} 
        onConfirm={handleConfirmTerminate}
        friendName={modalData.friendName}
        isProcessing={isProcessing}
      />

      <header className="max-w-5xl mx-auto mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Social Graph</h1>
            <p className="text-zinc-500 text-sm">Manage your verified end-to-end encrypted connections.</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-12 pb-20">
        {isLoading && !friends.length && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        )}

        {/* Pending Requests */}
        {!isLoading && requests.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6 px-2">
              <Clock size={16} className="text-amber-500" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Pending Identities</h2>
              <span className="ml-2 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full border border-amber-500/20">
                {requests.length}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {requests.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-3xl flex items-center justify-between group hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center font-bold text-lg border border-zinc-700 uppercase text-indigo-400">
                        {req.sender?.username?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-100">{req.sender?.username}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Wants to Connect</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRequest(req.id, 'accept')}
                        className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => handleRequest(req.id, 'reject')}
                        className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Friends List */}
        <section>
          <div className="flex items-center gap-2 mb-6 px-2">
            <ShieldCheck size={16} className="text-indigo-400" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Verified Connections</h2>
          </div>

          {friends.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-[40px]">
              <Ghost size={48} className="text-zinc-800 mb-4" />
              <p className="text-zinc-500 font-medium">Your social graph is empty.</p>
              <p className="text-zinc-700 text-xs mt-1 text-center max-w-xs px-6 font-mono uppercase tracking-tighter">
                Search in <span className="text-indigo-400">Discover</span> to find users.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {friends.map((friend) => (
                  <motion.div
                    key={friend.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    className="p-6 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-[32px] group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                      <ShieldCheck size={80} className="text-indigo-500" />
                    </div>

                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className="w-20 h-20 rounded-[28px] bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center font-black text-3xl text-zinc-100 mb-4 shadow-xl uppercase text-indigo-400">
                        {friend.username?.[0] || '?'}
                      </div>
                      <h3 className="text-xl font-bold mb-1 tracking-tight">{friend.username}</h3>
                      <p className="text-xs text-zinc-500 mb-6 italic px-4 line-clamp-2">
                        {friend.bio || "No secure bio established."}
                      </p>
                      
                      <div className="w-full pt-6 border-t border-zinc-800/50 flex gap-3">
                        <button 
                          onClick={() => openConfirmModal(friend)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-950 text-zinc-500 text-xs font-bold rounded-2xl border border-zinc-800 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all shadow-inner"
                        >
                          <UserMinus size={14} />
                          Terminate
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}