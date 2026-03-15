import { createContext, useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { CryptoService } from '../utils/crypto';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [deviceId, setDeviceId] = useState(localStorage.getItem('deviceId'));
  const [loading, setLoading] = useState(true);
  const [incomingMessage, setIncomingMessage] = useState(null);
  const ws = useRef(null);

  // Global WebSocket Connection Logic
  const connectGlobalSocket = (token) => {
    if (ws.current) ws.current.close();
    
    // Currently, your backend initiates sockets per conversation in the Conversations page.
    // This global listener is a placeholder for future multi-room notifications.
    console.log("🛠️ [DEBUG Auth] Global socket listener ready.");
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/users/me')
        .then(res => {
          const userData = res.data.data;
          console.log(`👤 [IDENTITY CHECK] Session Active: ${userData.username} (ID: ${userData.id})`);
          setUser(userData);
          connectGlobalSocket(token);
        })
        .catch(() => {
          console.warn("⚠️ [DEBUG Auth] Session expired or invalid token.");
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    console.log(`🚀 [LOGIN START] Attempting login for: ${email}`);
    
    const res = await api.post('/auth/login', { email, password });
    
    const token = res.data.data?.access_token || res.data.access_token || res.data.data;
    localStorage.setItem('token', token);
    
    const userRes = await api.get('/users/me');
    const userData = userRes.data.data;
    
    console.log(`✅ [LOGIN SUCCESS] User: ${userData.username} | ID: ${userData.id}`);
    setUser(userData);
    
    console.log("🔑 [DEBUG Auth] Initializing E2EE Device registration...");
    const identity = CryptoService.generateIdentityKeyPair();
    
    const devRes = await api.post('/e2ee/devices/register', {
      device_name: "web_browser",
      identity_key_pub: identity.pubKey
    });
    
    const newId = devRes.data.data.id;
    setDeviceId(newId);
    localStorage.setItem('deviceId', newId);
    
    await api.post(`/e2ee/prekeys/upload?device_id=${newId}`, {
      signed_prekey: CryptoService.generateSignedPreKey(identity.privKey),
      one_time_prekeys: CryptoService.generateOneTimePreKeys(5)
    });

    console.log("📡 [DEBUG Auth] Device registered and PreKeys uploaded.");
    connectGlobalSocket(token);
  };

  const logout = () => {
    console.log("🚪 [DEBUG Auth] Logging out and clearing session.");
    if (ws.current) ws.current.close();
    localStorage.clear();
    setUser(null);
    setDeviceId(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, // ✅ FIXED: Shared setUser so Settings.jsx can update the UI
      deviceId, 
      login, 
      logout, 
      loading, 
      incomingMessage, 
      setIncomingMessage 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};