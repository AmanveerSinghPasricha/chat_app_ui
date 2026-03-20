import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">Connect.io</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link to="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="px-5 py-2.5 bg-zinc-100 text-zinc-950 text-sm font-bold rounded-full hover:bg-white transition-all">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-8 uppercase tracking-widest"
        >
          <Lock size={12} />
          <span>Military-Grade E2EE Active</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent"
        >
          Secure Chat.<br />Zero Compromise.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed"
        >
          Connect.io uses state-of-the-art End-to-End Encryption to ensure your 
          conversations remain strictly between you and your friends. Private, fast, and secure.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link to="/register" className="group px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center gap-2">
            Start Encrypted Chat
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/login" className="px-8 py-4 bg-zinc-900 text-white font-bold rounded-2xl border border-zinc-800 hover:bg-zinc-800 transition-all">
            View My Messages
          </Link>
        </motion.div>
      </section>

      {/* Feature Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Lock className="text-indigo-400" />} 
            title="Double Ratchet E2EE" 
            desc="Advanced signal-based encryption  where messages are encrypted on-device before transmission." 
          />
          <FeatureCard 
            icon={<Zap className="text-blue-400" />} 
            title="Real-time WebSockets" 
            desc="Lightning-fast delivery using optimized WebSocket architecture for zero-lag conversations." 
          />
          <FeatureCard 
            icon={<ShieldCheck className="text-emerald-400" />} 
            title="Perfect Secrecy" 
            desc="One-time prekeys [cite: 13, 23] ensure that your past data stays safe even if a future key is compromised." 
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-sm"
    >
      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
      <div className="mt-6 flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
        <CheckCircle2 size={14} />
        <span>Verified Secure</span>
      </div>
    </motion.div>
  );
}