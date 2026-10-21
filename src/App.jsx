import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, browserLocalPersistence, setPersistence, updatePassword 
} from "firebase/auth";
import { 
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, setDoc, getDocs, getDoc 
} from "firebase/firestore";
import { 
  MessageSquare, Radio, MapPin, Music, Calendar, Settings, ShieldAlert,
  Send, Plus, Image as ImageIcon, Video, Heart, Share2, Search,
  Users, UserCheck, Flame, Rainbow, Eye, Lock, RefreshCw, X, Play,
  Pause, Volume2, UserX, AlertTriangle, Sparkles, Check, ChevronRight, Smile, Map, Terminal, Cpu, LogOut, Camera,
  Mic, Paperclip, CloudSun, Newspaper, Globe, MessageCircle, UserPlus, Trash2, ArrowLeft, Key, User, Upload, Share
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyDscV1uMCH1gUXeRSbYuwEhz8EDiESnSNI",
  authDomain: "donnexus.firebaseapp.com",
  projectId: "donnexus",
  storageBucket: "donnexus.firebasestorage.app",
  messagingSenderId: "864995500289",
  appId: "1:864995500289:web:f906a24aa07fe75d83bb00",
  measurementId: "G-JHD6ZX0S84"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Erro na persistência de auth:", error);
});

const MASTER_ADMIN_EMAIL = "furtadohenriqueluiz@gmail.com";

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const [activeTab, setActiveTab] = useState('chats');
  const [usersList, setUsersList] = useState([]);
  const [chatsList, setChatsList] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatObj, setActiveChatObj] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  
  // Modals & Extras
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchUsernameQuery, setSearchUsernameQuery] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [newChatTheme, setNewChatTheme] = useState('default');
  const [newChatType, setNewChatType] = useState('private'); 
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

  // Settings state
  const [settingsAvatar, setSettingsAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [settingsUsername, setSettingsUsername] = useState('');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsGlobalTheme, setSettingsGlobalTheme] = useState('default');
  const [settingsStatusMessage, setSettingsStatusMessage] = useState('Disponível no DON NEXUS');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Media recording / attachments
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioTimer, setAudioTimer] = useState(0);
  const audioIntervalRef = useRef(null);

  // File upload refs
  const avatarFileRef = useRef(null);
  const chatImageFileRef = useRef(null);
  const chatVideoFileRef = useRef(null);

  // News & Weather state
  const [newsList, setNewsList] = useState([
    { title: "Tecnologia Nexus Atualizada com Mapa Ao Vivo", source: "DON News", time: "Há 10 min", desc: "Agora o Radar GPS utiliza mapas interativos em tempo real para identificação precisa." },
    { title: "Radar Global de Localização Em Tempo Real", source: "Geolocalização", time: "Há 45 min", desc: "Sincronização de coordenadas GPS otimizada para todos os membros ativos." }
  ]);
  const [weatherData, setWeatherData] = useState({ temp: '26°C', condition: 'Parcialmente Nublado', city: 'São Paulo', humidity: '65%' });

  // Admin Master Inspector
  const [inspectingUser, setInspectingUser] = useState(null);
  const [inspectedUserChats, setInspectedUserChats] = useState([]);
  const [activeAuditedChat, setActiveAuditedChat] = useState(null);
  const [auditedMessages, setAuditedMessages] = useState([]);
  const auditChatEndRef = useRef(null);

  // Leaflet Map Ref
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const chatEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          let assignedUsername = user.email.split('@')[0];
          let currentAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.username) assignedUsername = data.username;
            if (data.avatar) currentAvatar = data.avatar;
          }

          setSettingsUsername(assignedUsername);
          setSettingsAvatar(currentAvatar);

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                await setDoc(userRef, {
                  email: user.email,
                  username: assignedUsername,
                  name: assignedUsername,
                  isAdmin: user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase(),
                  status: 'online',
                  lat,
                  lng,
                  avatar: currentAvatar
                }, { merge: true });
              },
              async () => {
                await setDoc(userRef, {
                  email: user.email,
                  username: assignedUsername,
                  name: assignedUsername,
                  isAdmin: user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase(),
                  status: 'online',
                  lat: -23.5505 + (Math.random() * 0.02 - 0.01),
                  lng: -46.6333 + (Math.random() * 0.02 - 0.01),
                  avatar: currentAvatar
                }, { merge: true });
              }
            );
          }
        } catch (dbErr) {
          console.error("Erro ao sincronizar perfil:", dbErr);
        }
      } else {
        setAuthUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(list);
    });

    const unsubChats = onSnapshot(collection(db, "chats"), (snapshot) => {
      const allChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const myChats = allChats.filter(c => c.members && c.members.includes(authUser.uid));
      setChatsList(myChats);
    });

    return () => {
      unsubUsers();
      unsubChats();
    };
  }, [authUser]);

  useEffect(() => {
    if (!activeChatId) {
      setChatMessages([]);
      return;
    }
    const q = query(collection(db, "chats", activeChatId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatMessages(msgs);
    });
    return () => unsubscribe();
  }, [activeChatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (activeTab === 'radar' && mapContainerRef.current) {
      if (!window.L) {
        if (!document.getElementById('leaflet-css')) {
          const linkEl = document.createElement('link');
          linkEl.id = 'leaflet-css';
          linkEl.rel = 'stylesheet';
          linkEl.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
          document.head.appendChild(linkEl);
        }

        if (!document.getElementById('leaflet-js')) {
          const scriptEl = document.createElement('script');
          scriptEl.id = 'leaflet-js';
          scriptEl.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
          scriptEl.onload = () => initMap();
          document.head.appendChild(scriptEl);
        } else {
          initMap();
        }
      } else {
        initMap();
      }
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab, usersList]);

  const initMap = () => {
    if (!window.L || !mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const currentUserObj = usersList.find(u => u.id === authUser?.uid);
    const centerLat = currentUserObj?.lat || -23.5505;
    const centerLng = currentUserObj?.lng || -46.6333;

    try {
      const map = window.L.map(mapContainerRef.current).setView([centerLat, centerLng], 14);
      mapInstanceRef.current = map;

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '© OpenStreetMap contributors',
        detectRetina: true,
        tileSize: 256,
        crossOrigin: true,
        headers: {
          'User-Agent': 'DonNexusWebApp/1.0 (furtadohenriqueluiz@gmail.com)'
        }
      }).addTo(map);

      usersList.forEach(u => {
        if (u.lat && u.lng) {
          const isMe = u.id === authUser?.uid;
          const markerHtml = `<div style="background-color: ${isMe ? '#06b6d4' : '#8b5cf6'}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">@</div>`;
          const customIcon = window.L.divIcon({
            html: markerHtml,
            className: 'custom-leaflet-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const marker = window.L.marker([u.lat, u.lng], { icon: customIcon }).addTo(map);
          marker.bindPopup(`<b>@${u.username || 'usuario'}</b><br/>${isMe ? 'Você está aqui' : 'Membro online'}`);
        }
      });
    } catch (e) {
      console.error("Erro ao inicializar mapa Leaflet:", e);
    }
  };

  const handleFileAsDataURL = (file, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      callback(uploadEvent.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileAsDataURL(file, (dataUrl) => {
        setSettingsAvatar(dataUrl);
      });
    }
  };

  const handleChatImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileAsDataURL(file, (dataUrl) => {
        handleSendMessage('📷 [Foto enviada do aparelho]', 'image', dataUrl);
      });
    }
  };

  const handleChatVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileAsDataURL(file, (dataUrl) => {
        handleSendMessage('📹 [Vídeo enviado do aparelho]', 'video', dataUrl);
      });
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (isRegistering && !hasAcceptedTerms) {
      setAuthError("Você precisa aceitar os termos de compartilhamento de localização.");
      return;
    }
    if (isRegistering && !usernameInput.trim()) {
      setAuthError("Por favor, defina um nome de usuário único.");
      return;
    }
    setIsLoadingAuth(true);
    try {
      if (isRegistering) {
        const qUsers = await getDocs(collection(db, "users"));
        const exists = qUsers.docs.some(d => d.data().username?.toLowerCase() === usernameInput.toLowerCase().trim());
        if (exists) {
          setAuthError("Este nome de usuário já está em uso. Escolha outro.");
          setIsLoadingAuth(false);
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        await setDoc(doc(db, "users", cred.user.uid), {
          email: emailInput,
          username: usernameInput.trim(),
          name: usernameInput.trim(),
          isAdmin: emailInput.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase(),
          status: 'online',
          lat: -23.5505,
          lng: -46.6333,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        });
      } else {
        await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      }
    } catch (err) {
      console.error("Erro de Autenticação:", err);
      let friendlyMessage = err.message;
      if (err.code === 'auth/email-already-in-use') friendlyMessage = 'E-mail já cadastrado.';
      else if (err.code === 'auth/weak-password') friendlyMessage = 'Senha muito curta (mínimo 6 caracteres).';
      else if (err.code === 'auth/invalid-email') friendlyMessage = 'E-mail inválido.';
      else friendlyMessage = 'E-mail ou senha incorretos.';
      setAuthError(friendlyMessage);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSettingsSuccess('');
    try {
      const userRef = doc(db, "users", authUser.uid);
      await updateDoc(userRef, {
        username: settingsUsername.trim(),
        avatar: settingsAvatar.trim(),
        statusMessage: settingsStatusMessage
      });

      if (settingsPassword.trim()) {
        if (settingsPassword.length < 6) {
          alert("A nova senha deve ter pelo menos 6 caracteres.");
          return;
        }
        await updatePassword(authUser, settingsPassword);
      }

      setSettingsSuccess("Configurações salvas com sucesso!");
      setTimeout(() => setSettingsSuccess(''), 3000);
    } catch (err) {
      console.error("Erro ao atualizar configurações:", err);
      alert("Erro ao atualizar configurações. Faça login novamente se necessário.");
    }
  };

  const handleSearchUser = () => {
    const found = usersList.find(u => u.username?.toLowerCase() === searchUsernameQuery.toLowerCase().trim() && u.id !== authUser.uid);
    setFoundUser(found || null);
    if (!found) {
      alert("Usuário não encontrado.");
    }
  };

  const handleCreateChat = async (targetUser = null) => {
    try {
      let members = [authUser.uid];
      let chatTitle = "";
      let type = newChatType;

      if (targetUser) {
        members.push(targetUser.id);
        chatTitle = targetUser.username;
        type = 'private';
      } else if (type === 'private' && foundUser) {
        members.push(foundUser.id);
        chatTitle = foundUser.username;
      } else if (type === 'group') {
        if (!newGroupTitle.trim()) {
          alert("Digite um nome para o grupo.");
          return;
        }
        members = [...selectedGroupMembers, authUser.uid];
        chatTitle = newGroupTitle;
      } else {
        return;
      }

      if (type === 'private') {
        const existing = chatsList.find(c => c.type === 'private' && c.members.includes(members[0]) && c.members.includes(members[1]));
        if (existing) {
          setActiveChatId(existing.id);
          setActiveChatObj(existing);
          setShowNewChatModal(false);
          setActiveTab('chats');
          return;
        }
      }

      const newChatRef = await addDoc(collection(db, "chats"), {
        title: chatTitle,
        type: type,
        theme: newChatTheme,
        members: members,
        createdAt: Date.now(),
        createdBy: authUser.email
      });

      await addDoc(collection(db, "chats", newChatRef.id, "messages"), {
        senderName: "DON AI 🤖",
        senderEmail: "ai@donnexus.sys",
        text: `Chat "${chatTitle}" iniciado com tema [${newChatTheme.toUpperCase()}]. Digite "@IA" para falar com a inteligência artificial a qualquer momento!`,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      const newChatObj = { id: newChatRef.id, title: chatTitle, type, theme: newChatTheme, members };
      setActiveChatId(newChatRef.id);
      setActiveChatObj(newChatObj);
      setShowNewChatModal(false);
      setSearchUsernameQuery('');
      setFoundUser(null);
      setNewGroupTitle('');
      setSelectedGroupMembers([]);
      setActiveTab('chats');
    } catch (err) {
      console.error("Erro ao criar chat:", err);
    }
  };

  const handleSendMessage = async (customText = null, customType = 'text', mediaUrl = null) => {
    const textToSend = customText !== null ? customText : messageText;
    if (!textToSend.trim() && !mediaUrl) return;
    if (!activeChatId) return;

    try {
      const myUsername = usersList.find(u => u.id === authUser.uid)?.username || authUser.email.split('@')[0];

      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        senderName: myUsername,
        senderEmail: authUser.email,
        text: textToSend,
        type: customType,
        mediaUrl: mediaUrl,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      if (customText === null) setMessageText('');

      // A IA responde SOMENTE se houver "@IA" ou "@ia" no texto enviado
      if (textToSend.toLowerCase().includes('@ia')) {
        setTimeout(async () => {
          let aiResponseText = "Olá! Fui acionada através do comando @IA. Como assistente inteligente do DON NEXUS, estou à disposição para ajudar com informações, clima ou notícias!";
          if (textToSend.toLowerCase().includes('previsão') || textToSend.toLowerCase().includes('tempo')) {
            aiResponseText = `🤖 [DON AI]: O clima atual em ${weatherData.city} está ${weatherData.condition} com temperatura de ${weatherData.temp} e umidade de ${weatherData.humidity}.`;
          } else if (textToSend.toLowerCase().includes('notícia')) {
            aiResponseText = `🤖 [DON AI]: Última notícia oficial: "${newsList[0].title}" - ${newsList[0].desc}`;
          }

          await addDoc(collection(db, "chats", activeChatId, "messages"), {
            senderName: "DON AI 🤖",
            senderEmail: "ai@donnexus.sys",
            text: aiResponseText,
            type: 'text',
            timestamp: Date.now() + 500,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }, 1000);
      }

    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  const handleStartAudioRecord = () => {
    setIsRecordingAudio(true);
    setAudioTimer(0);
    audioIntervalRef.current = setInterval(() => {
      setAudioTimer(prev => prev + 1);
    }, 1000);
  };

  const handleStopAudioRecord = () => {
    clearInterval(audioIntervalRef.current);
    setIsRecordingAudio(false);
    handleSendMessage(`🎙️ [Áudio Gravado - ${audioTimer}s]`, 'audio', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    setAudioTimer(0);
  };

  const handleLogout = async () => {
    if (authUser) {
      await updateDoc(doc(db, "users", authUser.uid), { status: 'offline' }).catch(() => {});
    }
    signOut(auth);
  };

  const getThemeStyles = (theme) => {
    switch (theme) {
      case 'spicy':
        return {
          bg: 'bg-gradient-to-b from-black via-red-950 to-black',
          headerBg: 'bg-black/90 border-b border-red-900/50',
          bubbleSelf: 'bg-gradient-to-r from-red-800 to-rose-950 text-white border border-red-500/30',
          bubbleOther: 'bg-zinc-900/90 text-red-100 border border-red-950',
          badge: '🔥 Apimentado'
        };
      case 'pride':
        return {
          bg: 'bg-slate-950',
          headerBg: 'bg-slate-900/90 border-b border-pink-500/30',
          bubbleSelf: 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white',
          bubbleOther: 'bg-slate-800 text-zinc-100 border border-slate-700',
          badge: '🌈 Pride'
        };
      default:
        return {
          bg: 'bg-zinc-950',
          headerBg: 'bg-zinc-900/90 border-b border-zinc-800',
          bubbleSelf: 'bg-cyan-600 text-white',
          bubbleOther: 'bg-zinc-800 text-zinc-100 border border-zinc-700',
          badge: '⚡ Cyber'
        };
    }
  };

  const currentThemeStyle = getThemeStyles(activeChatObj?.theme || settingsGlobalTheme);
  const isAdminMaster = authUser && authUser.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

  if (!authUser) {
    return (
      <div className="min-h-screen w-screen bg-black text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl -top-20 -left-20 pointer-events-none"></div>
        <div className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none"></div>

        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl relative z-10">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-extrabold text-2xl text-white mx-auto shadow-lg shadow-cyan-500/30">
              DN
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              DON NEXUS
            </h1>
            <p className="text-xs text-zinc-400 font-mono tracking-wider">ECOSSISTEMA PRIVADO COM IA & MAPA AO VIVO</p>
          </div>

          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="text-xs text-zinc-400 block mb-1 font-mono">NOME DE USUÁRIO (PARA TE ACHAR)</label>
                <input 
                  type="text" 
                  placeholder="ex: don_henrique"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                  required 
                />
              </div>
            )}

            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-mono">E-MAIL</label>
              <input 
                type="email" 
                placeholder="seuemail@dominio.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                required 
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1 font-mono">SENHA</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                required 
              />
            </div>

            {isRegistering && (
              <div className="p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  checked={hasAcceptedTerms}
                  onChange={e => setHasAcceptedTerms(e.target.checked)}
                  className="mt-0.5 accent-cyan-500 cursor-pointer"
                />
                <label className="leading-relaxed cursor-pointer">
                  Concordo com o compartilhamento da localização GPS no mapa ao vivo e auditoria de conversas pelo Painel Master.
                </label>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoadingAuth}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 font-bold text-sm text-white transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isLoadingAuth ? 'Processando...' : (isRegistering ? 'Criar Conta' : 'Entrar no DON NEXUS')}
            </button>

            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} 
                className="text-xs text-zinc-400 hover:text-cyan-400 transition"
              >
                {isRegistering ? 'Já possui conta? Fazer login' : 'Criar nova conta online'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-black text-zinc-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between z-30">
        <div>
          <div className="p-4 flex items-center justify-between border-b border-zinc-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-cyan-500/20">
                DN
              </div>
              <div className="hidden md:block">
                <h1 className="font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent text-sm">
                  DON NEXUS
                </h1>
                <p className="text-[10px] text-emerald-400 font-mono">● LIVE ONLINE</p>
              </div>
            </div>
            <button 
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition hidden md:flex items-center gap-1 text-xs font-bold"
              title="Compartilhar App com Amigos"
            >
              <Share className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-3 space-y-1.5">
            <button onClick={() => { setActiveTab('chats'); setActiveChatId(null); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${activeTab === 'chats' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20' : 'text-zinc-400 hover:bg-zinc-900'}`}>
              <MessageSquare className="w-5 h-5" />
              <span className="hidden md:inline text-sm">Chats & Grupos</span>
            </button>

            <button onClick={() => setActiveTab('updates')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${activeTab === 'updates' ? 'bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20' : 'text-zinc-400 hover:bg-zinc-900'}`}>
              <Newspaper className="w-5 h-5" />
              <span className="hidden md:inline text-sm">Notícias & Clima</span>
            </button>

            <button onClick={() => setActiveTab('radar')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${activeTab === 'radar' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-900'}`}>
              <MapPin className="w-5 h-5" />
              <span className="hidden md:inline text-sm">Mapa & Radar</span>
            </button>

            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${activeTab === 'settings' ? 'bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20' : 'text-zinc-400 hover:bg-zinc-900'}`}>
              <Settings className="w-5 h-5" />
              <span className="hidden md:inline text-sm">Configurações</span>
            </button>

            {isAdminMaster && (
              <button onClick={() => setActiveTab('master')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${activeTab === 'master' ? 'bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20' : 'text-zinc-400 hover:bg-zinc-900'}`}>
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span className="hidden md:inline text-sm">Painel Master</span>
              </button>
            )}
          </nav>
        </div>

        {/* User profile section */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => setActiveTab('settings')}>
            <img src={settingsAvatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-cyan-500" />
            <div className="hidden md:block overflow-hidden">
              <p className="text-xs font-bold text-white truncate">@{settingsUsername || authUser.email.split('@')[0]}</p>
              <p className="text-[10px] text-zinc-400 truncate">{authUser.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-white transition" title="Sair">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950">
        
        {/* TAB 1: CHATS & GROUPS */}
        {activeTab === 'chats' && (
          <div className="flex-1 flex overflow-hidden">
            
            <div className={`w-full sm:w-80 border-r border-zinc-800/80 bg-zinc-900/30 flex flex-col ${activeChatId ? 'hidden sm:flex' : 'flex'}`}>
              <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">Conversas & Grupos</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">Com IA Integrada (@IA)</p>
                </div>
                <button 
                  onClick={() => setShowNewChatModal(true)}
                  className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition flex items-center gap-1.5 text-xs font-bold"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden md:inline">Novo Chat</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatsList.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-xs">
                    Nenhuma conversa ativa.<br/>Clique em "Novo Chat" para procurar amigos por nome de usuário ou criar um grupo.
                  </div>
                ) : (
                  chatsList.map(chat => (
                    <div 
                      key={chat.id} 
                      onClick={() => { setActiveChatId(chat.id); setActiveChatObj(chat); }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center gap-3 ${activeChatId === chat.id ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/60'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
                        {chat.type === 'group' ? <Users className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white truncate">{chat.title}</h4>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">{chat.theme || settingsGlobalTheme}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">Toque para abrir conversa com IA</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {activeChatId && activeChatObj ? (
              <div className={`flex-1 flex flex-col ${currentThemeStyle.bg} transition-colors duration-300`}>
                <div className={`p-4 flex items-center justify-between ${currentThemeStyle.headerBg} backdrop-blur`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setActiveChatId(null)} className="sm:hidden p-2 text-zinc-400 hover:text-white">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-400">
                      {activeChatObj.type === 'group' ? <Users className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-100 text-sm">{activeChatObj.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                        {currentThemeStyle.badge} • Digite @IA para acionar assistente
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.map(m => {
                    const isSelf = m.senderEmail === authUser.email;
                    const isAI = m.senderEmail === 'ai@donnexus.sys';
                    return (
                      <div key={m.id} className={`flex flex-col max-w-[80%] ${isSelf ? 'ml-auto items-end' : 'items-start'}`}>
                        <span className={`text-[10px] font-bold mb-1 px-1 ${isAI ? 'text-purple-400' : 'text-cyan-400'}`}>{m.senderName}</span>
                        
                        <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${isAI ? 'bg-purple-950/80 border border-purple-500/40 text-purple-100' : (isSelf ? currentThemeStyle.bubbleSelf : currentThemeStyle.bubbleOther)}`}>
                          {m.type === 'image' && (
                            <img src={m.mediaUrl} alt="Mídia" className="rounded-xl max-h-48 object-cover mb-2 border border-white/20" />
                          )}
                          {m.type === 'video' && (
                            <video src={m.mediaUrl} controls className="rounded-xl max-h-48 mb-2" />
                          )}
                          {m.type === 'audio' && (
                            <div className="flex items-center gap-3 bg-black/30 p-2 rounded-xl mb-1">
                              <Volume2 className="w-5 h-5 text-cyan-400" />
                              <span className="text-xs font-mono">Mensagem de Voz</span>
                            </div>
                          )}
                          {m.text}
                        </div>
                        <span className="text-[9px] text-zinc-500 mt-1 px-1">{m.time}</span>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/80 backdrop-blur flex flex-col gap-3">
                  <input 
                    type="file" 
                    ref={chatImageFileRef} 
                    onChange={handleChatImageFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <input 
                    type="file" 
                    ref={chatVideoFileRef} 
                    onChange={handleChatVideoFileChange} 
                    accept="video/*" 
                    className="hidden" 
                  />

                  {isRecordingAudio ? (
                    <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
                      <div className="flex items-center gap-2 text-red-400 font-mono text-xs animate-pulse">
                        <Mic className="w-5 h-5" />
                        <span>Gravando áudio... {audioTimer}s</span>
                      </div>
                      <button onClick={handleStopAudioRecord} className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg">
                        Enviar Áudio
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                        <button onClick={() => chatImageFileRef.current?.click()} title="Enviar Foto do Aparelho" className="p-2 text-zinc-400 hover:text-cyan-400 transition">
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => chatVideoFileRef.current?.click()} title="Enviar Vídeo do Aparelho" className="p-2 text-zinc-400 hover:text-cyan-400 transition">
                          <Video className="w-4 h-4" />
                        </button>
                        <button onClick={handleStartAudioRecord} title="Gravar Áudio" className="p-2 text-zinc-400 hover:text-red-400 transition">
                          <Mic className="w-4 h-4" />
                        </button>
                      </div>

                      <input 
                        type="text" 
                        value={messageText} 
                        onChange={e => setMessageText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Digite mensagem ou use @IA para chamar o assistente..." 
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                      />

                      <button onClick={() => handleSendMessage()} className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 hover:opacity-90 transition flex items-center gap-2">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex flex-1 items-center justify-center bg-zinc-950 text-zinc-500 text-xs">
                Selecione uma conversa ao lado ou crie um novo chat privado / grupo.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UPDATES & WEATHER */}
        {activeTab === 'updates' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Atualizações, Notícias & Previsão do Tempo</h2>
              <p className="text-xs text-zinc-400">Informações em tempo real para a comunidade DON NEXUS</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-zinc-900 border border-cyan-500/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-2xl">
                  🌤️
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-mono">PREVISÃO DO TEMPO</p>
                  <h3 className="text-lg font-bold text-white">{weatherData.city}: {weatherData.temp}</h3>
                  <p className="text-xs text-cyan-300">{weatherData.condition} • Umidade: {weatherData.humidity}</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-zinc-900 border border-purple-500/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-2xl">
                  ⚡
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-mono">STATUS DO SISTEMA</p>
                  <h3 className="text-lg font-bold text-emerald-400">100% Operacional</h3>
                  <p className="text-xs text-purple-300">Mapa Ao Vivo Ativado</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-zinc-900 border border-emerald-500/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-2xl">
                  👥
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-mono">MEMBROS ONLINE</p>
                  <h3 className="text-lg font-bold text-white">{usersList.length} Usuários</h3>
                  <p className="text-xs text-emerald-300">Rede sincronizada</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-200 uppercase font-mono">Últimas Notícias da Comunidade</h3>
              <div className="space-y-3">
                {newsList.map((n, i) => (
                  <div key={i} className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                      <span>{n.source}</span>
                      <span>{n.time}</span>
                    </div>
                    <h4 className="font-bold text-sm text-white">{n.title}</h4>
                    <p className="text-xs text-zinc-300">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RADAR GPS MAP */}
        {activeTab === 'radar' && (
          <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Mapa ao Vivo & Radar de Membros</h2>
                <p className="text-xs text-zinc-400">Identifique facilmente usuários conectados na sua região</p>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> GPS Ativo
              </span>
            </div>

            <div className="h-96 w-full rounded-2xl border border-zinc-800 overflow-hidden relative shadow-2xl">
              <div ref={mapContainerRef} className="w-full h-full z-10" />
            </div>

            <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" /> Usuários Próximos na Rede
                  </h3>
                  <p className="text-xs text-zinc-400">Clique em iniciar conversa para adicionar e conversar imediatamente</p>
                </div>
                <span className="text-xs font-mono bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-xl border border-cyan-500/30">
                  {usersList.filter(u => u.id !== authUser.uid).length} Disponíveis
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {usersList.filter(u => u.id !== authUser.uid).map(u => (
                  <div key={u.id} className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-cyan-500" />
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm text-white truncate">@{u.username}</p>
                        <p className="text-[10px] text-emerald-400 font-mono">● Próximo a você</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCreateChat(u)}
                      className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow transition"
                    >
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-zinc-900 to-zinc-900 border border-blue-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-blue-400 tracking-widest uppercase">CENTRAL DE PREFERÊNCIAS</span>
                <h2 className="text-2xl font-black text-white mt-1">Configurações do Perfil</h2>
                <p className="text-xs text-zinc-400 mt-1">Gerencie sua foto de avatar direto do aparelho, nome de usuário, senha, status e temas do app.</p>
              </div>
              <Settings className="w-12 h-12 text-blue-500 opacity-80" />
            </div>

            {settingsSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs text-center font-bold">
                {settingsSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateSettings} className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-6 space-y-6 max-w-2xl">
              <input 
                type="file" 
                ref={avatarFileRef} 
                onChange={handleAvatarFileChange} 
                accept="image/*" 
                className="hidden" 
              />

              <div className="flex items-center gap-6 pb-6 border-b border-zinc-800">
                <img src={settingsAvatar} alt="Avatar preview" className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500 shadow-lg shadow-cyan-500/30" />
                <div className="flex-1 space-y-2">
                  <label className="text-xs text-zinc-400 block font-mono">FOTO DE PERFIL DO APARELHO</label>
                  <button 
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    className="px-4 py-2.5 bg-zinc-950 border border-cyan-500/50 hover:bg-zinc-800 text-cyan-400 font-bold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    <Upload className="w-4 h-4" /> Escolher Foto dos Arquivos
                  </button>
                  <p className="text-[10px] text-zinc-500">Selecione uma foto diretamente do armazenamento do seu dispositivo.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1 font-mono">NOME DE USUÁRIO</label>
                  <input 
                    type="text" 
                    value={settingsUsername}
                    onChange={e => setSettingsUsername(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1 font-mono">NOVA SENHA (OPCIONAL)</label>
                  <input 
                    type="password" 
                    placeholder="Mínimo 6 caracteres"
                    value={settingsPassword}
                    onChange={e => setSettingsPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1 font-mono">MENSAGEM DE STATUS</label>
                <input 
                  type="text" 
                  value={settingsStatusMessage}
                  onChange={e => setSettingsStatusMessage(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 hover:opacity-90 transition">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: MASTER ADMIN PANEL */}
        {activeTab === 'master' && isAdminMaster && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-zinc-900 to-zinc-900 border border-rose-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-rose-400 tracking-widest uppercase">PAINEL EXECUTIVO MASTER</span>
                <h2 className="text-2xl font-black text-white mt-1">DON ADMIN CONTROL CENTER</h2>
                <p className="text-xs text-zinc-400 mt-1">Audite conversas, acesse o histórico completo de mensagens e visualize todo o conteúdo na íntegra.</p>
              </div>
              <ShieldAlert className="w-12 h-12 text-rose-500 opacity-80" />
            </div>

            {inspectingUser ? (
              <div className="space-y-4 bg-zinc-900/90 p-5 rounded-2xl border border-rose-500/30">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">Auditoria de Conversas: @{inspectingUser.username}</h3>
                    <p className="text-xs text-zinc-400">{inspectingUser.email}</p>
                  </div>
                  <button 
                    onClick={() => { setInspectingUser(null); setActiveAuditedChat(null); setAuditedMessages([]); }} 
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs rounded-xl font-bold transition"
                  >
                    Voltar à Lista de Membros
                  </button>
                </div>

                {activeAuditedChat ? (
                  <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div>
                        <h4 className="font-bold text-xs text-cyan-400">Chat Auditado: {activeAuditedChat.title}</h4>
                        <p className="text-[10px] text-zinc-500 uppercase font-mono">Tipo: {activeAuditedChat.type} • Tema: {activeAuditedChat.theme}</p>
                      </div>
                      <button 
                        onClick={() => { setActiveAuditedChat(null); setAuditedMessages([]); }}
                        className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] rounded-lg font-bold"
                      >
                        ← Voltar aos Chats do Usuário
                      </button>
                    </div>

                    <div className="h-80 overflow-y-auto p-4 space-y-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80">
                      {auditedMessages.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 text-xs">Nenhuma mensagem registrada neste chat.</div>
                      ) : (
                        auditedMessages.map(m => (
                          <div key={m.id} className="flex flex-col max-w-[85%] bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-cyan-400">@{m.senderName}</span>
                              <span className="text-[9px] text-zinc-500 font-mono">{m.time}</span>
                            </div>
                            {m.type === 'image' && (
                              <img src={m.mediaUrl} alt="Mídia" className="rounded-lg max-h-36 object-cover mb-2 border border-zinc-700" />
                            )}
                            {m.type === 'video' && (
                              <video src={m.mediaUrl} controls className="rounded-lg max-h-36 mb-2" />
                            )}
                            <p className="text-xs text-zinc-200 leading-relaxed">{m.text}</p>
                          </div>
                        ))
                      )}
                      <div ref={auditChatEndRef} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inspectedUserChats.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-4 text-center">Este usuário ainda não participa de conversas na rede.</p>
                    ) : (
                      inspectedUserChats.map(c => (
                        <div 
                          key={c.id} 
                          onClick={async () => {
                            setActiveAuditedChat(c);
                            const qMsgs = query(collection(db, "chats", c.id, "messages"), orderBy("timestamp", "asc"));
                            onSnapshot(qMsgs, (snap) => {
                              const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                              setAuditedMessages(msgs);
                              setTimeout(() => auditChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                            });
                          }}
                          className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition"
                        >
                          <div>
                            <span className="font-bold text-xs text-white block">Chat: {c.title}</span>
                            <span className="text-[10px] text-zinc-400 uppercase font-mono">Tipo: {c.type} • Tema: {c.theme}</span>
                          </div>
                          <span className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-xl font-bold text-xs border border-cyan-500/30">
                            Ver Conversa Completa →
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="p-4 border-b border-zinc-800 font-bold text-sm text-zinc-200 font-mono">
                  Membros Cadastrados (Clique para Auditar Conversas na Íntegra)
                </div>
                <div className="divide-y divide-zinc-800/80">
                  {usersList.map(u => (
                    <div 
                      key={u.id} 
                      onClick={async () => {
                        setInspectingUser(u);
                        setActiveAuditedChat(null);
                        setAuditedMessages([]);
                        const qChats = await getDocs(collection(db, "chats"));
                        const uChats = qChats.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.members && c.members.includes(u.id));
                        setInspectedUserChats(uChats);
                      }}
                      className="p-4 flex items-center justify-between text-xs hover:bg-zinc-800/40 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-white text-sm">@{u.username} {u.isAdmin && <span className="text-rose-400">(Admin Master)</span>}</p>
                          <p className="text-zinc-400">{u.email}</p>
                          <p className="text-[10px] text-cyan-400 font-mono mt-0.5">GPS: {u.lat?.toFixed(4)}, {u.lng?.toFixed(4)}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 bg-rose-500/20 text-rose-400 rounded-xl font-bold text-xs border border-rose-500/30">
                        Auditar Histórico →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Modal New Chat / Group */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-white">Iniciar Nova Conversa ou Grupo</h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
              <button onClick={() => setNewChatType('private')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${newChatType === 'private' ? 'bg-cyan-500 text-white' : 'text-zinc-400'}`}>
                Chat Privado por Username
              </button>
              <button onClick={() => setNewChatType('group')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${newChatType === 'group' ? 'bg-purple-500 text-white' : 'text-zinc-400'}`}>
                Criar Grupo
              </button>
            </div>

            {newChatType === 'private' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1 font-mono">DIGITE O NOME DE USUÁRIO</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="ex: don_henrique"
                      value={searchUsernameQuery}
                      onChange={e => setSearchUsernameQuery(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button onClick={handleSearchUser} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white">
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {foundUser && (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={foundUser.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-sm text-white">@{foundUser.username}</p>
                        <p className="text-[10px] text-emerald-400 font-mono">● Usuário Encontrado</p>
                      </div>
                    </div>
                    <button onClick={() => handleCreateChat(foundUser)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg">
                      Iniciar Chat
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1 font-mono">NOME DO GRUPO</label>
                  <input 
                    type="text" 
                    placeholder="ex: Grupo VIP DON NEXUS"
                    value={newGroupTitle}
                    onChange={e => setNewGroupTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1 font-mono">SELECIONAR PARTICIPANTES</label>
                  <div className="max-h-40 overflow-y-auto space-y-1 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                    {usersList.filter(u => u.id !== authUser.uid).map(u => {
                      const isSelected = selectedGroupMembers.includes(u.id);
                      return (
                        <div 
                          key={u.id}
                          onClick={() => {
                            if (isSelected) setSelectedGroupMembers(selectedGroupMembers.filter(id => id !== u.id));
                            else setSelectedGroupMembers([...selectedGroupMembers, u.id]);
                          }}
                          className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition ${isSelected ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300' : 'hover:bg-zinc-900 text-zinc-300'}`}
                        >
                          <span className="text-xs font-bold">@{u.username}</span>
                          <span className="text-xs">{isSelected ? '✓ Selecionado' : '+ Adicionar'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button onClick={() => handleCreateChat()} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30">
                  Criar Grupo Agora
                </button>
              </div>
            )}

            <div className="border-t border-zinc-800 pt-3">
              <label className="text-xs text-zinc-400 block mb-2 font-mono">ESCOLHER TEMA DA CONVERSA</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setNewChatTheme('default')} className={`p-2.5 rounded-xl text-xs font-bold border transition ${newChatTheme === 'default' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                  ⚡ Cyber
                </button>
                <button onClick={() => setNewChatTheme('spicy')} className={`p-2.5 rounded-xl text-xs font-bold border transition ${newChatTheme === 'spicy'  ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                  🔥 Apimentada
                </button>
                <button onClick={() => setNewChatTheme('pride')} className={`p-2.5 rounded-xl text-xs font-bold border transition ${newChatTheme === 'pride' ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                  🌈 Pride
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Share App with Friends */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-white">Compartilhar DON NEXUS com Amigos</h3>
              <button onClick={() => setShowShareModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <p>
                Para enviar este aplicativo para seus amigos, basta compartilhar o link da página onde o aplicativo está hospedado (ou exportar o código para publicar em serviços gratuitos como Netlify, Vercel ou Firebase Hosting).
              </p>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={window.location.href} 
                  className="bg-transparent text-cyan-400 text-xs w-full focus:outline-none font-mono truncate"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copiado para a área de transferência!");
                  }}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shrink-0"
                >
                  Copiar Link
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <p className="font-bold text-zinc-200">Como seus amigos entram:</p>
                <ol className="list-decimal pl-4 space-y-1 text-zinc-400">
                  <li>Eles abrem o link no celular ou computador.</li>
                  <li>Criam uma conta com e-mail e senha e escolhem um nome de usuário (ex: `@amigo`).</li>
                  <li>Pronto! Eles já aparecem no mapa ao vivo e podem conversar com você e usar a IA.</li>
                </ol>
              </div>
            </div>

            <button onClick={() => setShowShareModal(false)} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl">
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
