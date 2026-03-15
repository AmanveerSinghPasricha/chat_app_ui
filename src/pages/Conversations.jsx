import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ShieldCheck, User, Info, MoreVertical, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { CryptoService } from '../utils/crypto';

export default function Conversations() {
  const { user, deviceId } = useAuth();
  const [friends, setFriends] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [friendBundle, setFriendBundle] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const ws = useRef(null);
  const scrollRef = useRef(null);

  // TIME CONVERSION HELPER
  const formatLocalTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // AUTO-SCROLL LOGIC
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // FIXED: Dependency array is now stable and constant size
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoadingHistory]);

  // Load friends list on mount
  useEffect(() => {
    api.get('/friends')
      .then(res => setFriends(res.data.data || []))
      .catch(console.error);

    return () => { 
      if (ws.current) ws.current.close(); 
    };
  }, []);

  const selectFriend = async (friend) => {
    setActiveChat(friend);
    setMessages([]);
    setIsLoadingHistory(true);
    
    try {
      // 1. Get/Create Conversation ID
      const convRes = await api.post(`/chat/conversations/${friend.id}`);
      const responseData = convRes.data.data || convRes.data;
      const conversationId = responseData.conversation_id || responseData.id || responseData;

      // 2. FETCH HISTORICAL MESSAGES
      const historyRes = await api.get(`/chat/messages/${conversationId}`);
      const historicalData = historyRes.data.data || historyRes.data || [];

      // 3. Decrypt historical messages
      const decryptedHistory = await Promise.all(
        historicalData.map(async (msg) => {
          try {
            const plaintext = msg.ciphertext 
              ? await CryptoService.decryptMessage(msg.ciphertext, msg.nonce)
              : (msg.content || msg.text || "");
            return { ...msg, text: plaintext };
          } catch (e) {
            return { ...msg, text: "[Decryption Error]" };
          }
        })
      );
      setMessages(decryptedHistory);

      // 4. Fetch friend's E2EE bundle for new messages
      const bundleRes = await api.get(`/e2ee/prekeys/bundle/${friend.id}`);
      const bundleData = bundleRes.data.data || bundleRes.data;
      setFriendBundle(Array.isArray(bundleData) ? bundleData[0] : bundleData);

      // 5. Connect WebSocket
      const token = localStorage.getItem('token');
      if (ws.current) ws.current.close();
      
      const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
      // const wsUrl = `ws://localhost:8000/chat/ws/${conversationId}?token=${token}`;
      const wsUrl = `${WS_BASE_URL}/chat/ws/${conversationId}?token=${token}`;
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => console.log("WebSocket Connected");

      ws.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        try {
            const plaintext = await CryptoService.decryptMessage(data.ciphertext, data.nonce);
            const newMessage = { ...data, text: plaintext };

            setMessages((prev) => {
                // Remove local "Sending..." version and add server's official version
                const filtered = prev.filter(m => m.client_msg_id !== data.client_msg_id);
                return [...filtered, newMessage];
            });
        } catch (err) {
            console.error("Failed to decrypt incoming message", err);
        }
      };

      ws.current.onclose = () => console.warn("WebSocket Disconnected");

    } catch (err) {
      console.error("Chat setup failed", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn("Cannot send: WebSocket is not open.");
      return;
    }

    if (!input.trim() || !friendBundle) return;

    const clientMsgId = `msg_${Date.now()}`;
    const textToSend = input;
    setInput('');

    try {
      const encryptedData = await CryptoService.encryptMessage(textToSend);
      const payload = {
        ciphertext: encryptedData.ciphertext,
        nonce: encryptedData.nonce,
        sender_id: user.id,
        sender_device_id: deviceId,
        receiver_device_id: friendBundle.device_id,
        header: {
          ephemeral_pub: "dh_active",
          signed_prekey_id: friendBundle.signed_prekey.key_id,
          one_time_prekey_id: friendBundle.one_time_prekey?.key_id || null,
        },
        message_type: "text",
        client_msg_id: clientMsgId
      };

      // Optimistic Update (shows "Sending..." until server responds)
      setMessages(prev => [...prev, { 
        sender_id: user.id, 
        text: textToSend, 
        client_msg_id: clientMsgId,
        created_at: null 
      }]);

      ws.current.send(JSON.stringify(payload));
    } catch (err) {
      console.error("Encryption or Send failed:", err);
    }
  };

  return (
    <div className="flex h-full bg-[#09090b] text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/20 backdrop-blur-xl transition-all ${!isSidebarOpen && 'hidden'}`}>
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {friends.map(friend => (
            <button
              key={friend.id}
              onClick={() => selectFriend(friend)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                activeChat?.id === friend.id 
                  ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' 
                  : 'hover:bg-zinc-800/50 border-transparent text-zinc-400'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold">
                {friend.username?.[0].toUpperCase()}
              </div>
              <div className="text-left overflow-hidden">
                <p className="font-semibold truncate">{friend.username}</p>
                <p className="text-[10px] opacity-50 uppercase tracking-widest font-bold">E2EE Secured</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-zinc-950">
        {activeChat ? (
          <>
            <header className="h-20 bg-zinc-900/50 border-b border-zinc-800 flex items-center px-6 justify-between backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 font-bold">
                  {activeChat.username?.[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-zinc-100 leading-none">{activeChat.username}</h3>
                    <span className="flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-black uppercase tracking-wider">
                      <ShieldCheck size={10} /> E2EE
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-zinc-500">
                <Info size={20}/><MoreVertical size={20}/>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 relative scroll-smooth">
              {isLoadingHistory ? (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50 z-20 backdrop-blur-sm">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <motion.div 
                        key={msg.id || msg.client_msg_id || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-xl transition-all ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-500/20' 
                            : 'bg-zinc-900 text-zinc-100 rounded-bl-none border border-zinc-800'
                        }`}>
                          <div className="text-sm leading-relaxed break-words font-medium">{msg.text}</div>
                          <div className="text-[9px] mt-1.5 opacity-40 flex justify-end font-bold">
                            {msg.created_at ? formatLocalTime(msg.created_at) : 'Sending...'}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            <div className="p-6 bg-zinc-950 border-t border-zinc-900/50">
              <form onSubmit={sendMessage} className="flex gap-3 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl focus-within:border-indigo-500/50 transition-all shadow-inner">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a secure message..."
                  className="flex-1 px-4 bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-600"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
            <MessageSquare size={64} className="mb-6 opacity-10" />
            <p className="text-sm font-medium tracking-wide">Select a contact to start an encrypted session</p>
          </div>
        )}
      </main>
    </div>
  );
}