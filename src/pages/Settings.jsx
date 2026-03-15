import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, User, Lock, Trash2, CheckCircle2, 
  AlertCircle, Loader2, Save, Key, Fingerprint 
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // Form States - Initialize with user data
  const [profile, setProfile] = useState({ 
    username: user?.username || '', 
    bio: user?.bio || '' 
  });
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Keep local form in sync if the global user object updates (e.g., on initial load)
  useEffect(() => {
    if (user) {
      setProfile({ 
        username: user.username || '', 
        bio: user.bio || '' 
      });
    }
  }, [user]);

  const triggerFeedback = (type, msg) => {
    setFeedback({ type, msg });
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => setFeedback({ type: '', msg: '' }), duration);
  };

  // 1. Update Profile (Username & Bio)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!profile.username.trim()) {
      return triggerFeedback('error', 'Username handle cannot be empty.');
    }

    setLoading(true);
    setFeedback({ type: '', msg: '' });

    try {
      const res = await api.put('/users/me', { 
        username: profile.username.trim(), 
        bio: profile.bio 
      });
      
      // ✅ res.data.data works because your router uses the success_response wrapper
      const updatedUser = res.data.data || res.data;
      
      // Update global context so the Sidebar/Navbar updates instantly
      setUser(updatedUser); 
      
      triggerFeedback('success', 'Identity parameters updated.');
    } catch (err) {
      console.error("Update Error:", err);
      
      // ✅ Fixed error extraction logic to prevent 'undefined'
      const errorMessage = 
        err.response?.data?.detail || 
        err.response?.data?.message || 
        'Update failed. Check your network connection.';
        
      triggerFeedback('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 2. Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new) {
      return triggerFeedback('error', 'Both password fields are required.');
    }

    if (passwords.new.length < 8) {
      return triggerFeedback('error', 'New password must be at least 8 characters.');
    }

    setLoading(true);
    try {
      await api.put('/users/me/password', { 
        current_password: passwords.current, 
        new_password: passwords.new 
      });
      setPasswords({ current: '', new: '' });
      triggerFeedback('success', 'Security credentials rotated.');
    } catch (err) {
      const errorMessage = 
        err.response?.data?.detail || 
        err.response?.data?.message || 
        'Password rotation failed.';
      triggerFeedback('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 3. Delete Account
  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete('/users/me');
      localStorage.clear();
      window.location.replace('/login'); 
    } catch (err) {
      triggerFeedback('error', 'Critical error: Termination failed.');
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-[#09090b] text-zinc-100 p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-12 pb-20">
        
        <header>
          <div className="flex items-center gap-3 mb-2 text-indigo-500">
            <Shield size={32} />
            <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
          </div>
          <p className="text-zinc-500 text-sm">Manage your encrypted identity and access credentials.</p>
        </header>

        <AnimatePresence mode="wait">
          {feedback.msg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${
                feedback.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
              {feedback.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <section className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
              <User size={20} />
            </div>
            <h2 className="text-lg font-bold">Identity Profile</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Username Handle</label>
              <input 
                type="text"
                autoComplete="off"
                value={profile.username}
                onChange={(e) => setProfile({...profile, username: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all text-sm font-mono text-indigo-400 placeholder:text-zinc-800"
                placeholder="Unique handle..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Secure Bio</label>
              <textarea 
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                placeholder="Share your public key details or bio..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all text-sm h-32 resize-none"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Update Identity
            </button>
          </form>
        </section>

        <section className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <Lock size={20} />
            </div>
            <h2 className="text-lg font-bold">Credential Rotation</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">Current Password</label>
                <input 
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 ml-1">New Secure Password</label>
                <input 
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Key size={18} />}
              Rotate Credentials
            </button>
          </form>
        </section>

        <section className="bg-red-500/5 border border-red-500/10 rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-red-400 mb-1 flex items-center gap-2">
                <Trash2 size={20} /> Danger Zone
              </h2>
              <p className="text-zinc-600 text-xs">Permanently purge your identity and all secure links.</p>
            </div>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-xl font-bold text-xs transition-all active:scale-95"
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !loading && setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#09090b] border border-zinc-800 rounded-[32px] p-8 shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-red-500/20">
                  <Fingerprint className="text-red-500" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Final Account Purge?</h3>
                <p className="text-zinc-500 text-sm mb-8">
                  This action is irreversible. All encrypted connections, identity keys, and history will be wiped from the graph.
                </p>
                <div className="flex gap-3">
                  <button 
                    disabled={loading}
                    onClick={() => setShowDeleteModal(false)} 
                    className="flex-1 py-3 bg-zinc-900 rounded-xl font-bold disabled:opacity-50 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={loading}
                    onClick={handleDeleteAccount} 
                    className="flex-1 py-3 bg-red-600 rounded-xl font-bold hover:bg-red-500 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Confirm Purge"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}