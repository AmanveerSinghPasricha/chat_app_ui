import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Users, 
  UserPlus, 
  Settings, 
  LogOut, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-zinc-950 border-r border-zinc-800/50 flex flex-col relative z-20 shadow-2xl">
        
        {/* User Profile Header (Top Left) */}
        <div className="p-6 mb-2">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-zinc-100 truncate">{user?.username}</span>
              <span className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verified Identity
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 mb-6">
          <h1 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Main Menu</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <NavItem to="/conversations" icon={<MessageSquare size={18} />} label="Conversations" active={location.pathname === '/conversations'} />
          <NavItem to="/friends" icon={<Users size={18} />} label="Friends" active={location.pathname === '/friends'} />
          <NavItem to="/discover" icon={<UserPlus size={18} />} label="Discover" active={location.pathname === '/discover'} />
          <div className="pt-6 pb-2 px-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Configuration</div>
          <NavItem to="/settings" icon={<Settings size={18} />} label="Security Settings" active={location.pathname === '/settings'} />
        </nav>

        {/* Branding & Logout Footer */}
        <div className="p-6 mt-auto border-t border-zinc-900">
          <div className="flex items-center gap-2 mb-6 px-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
            <ShieldCheck size={16} className="text-indigo-400" />
            <span className="text-xs font-bold tracking-widest uppercase">Connect.io v1.0</span>
          </div>
          
          <button 
            onClick={logout}
            className="group flex items-center justify-between w-full px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} />
              <span className="text-sm font-bold">Terminate</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {/* Subtle background glow for the main area */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, active }) {
  return (
    <Link to={to}>
      <motion.div 
        whileHover={{ x: 5 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
          active 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-bold' 
            : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`${active ? 'text-white' : 'text-zinc-600 group-hover:text-indigo-400'} transition-colors`}>
            {icon}
          </span>
          <span className="text-sm">{label}</span>
        </div>
        {active && (
          <motion.div layoutId="active-pill" className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        )}
      </motion.div>
    </Link>
  );
}