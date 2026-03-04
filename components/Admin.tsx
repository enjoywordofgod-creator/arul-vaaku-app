import React, { useState, useEffect, useCallback } from 'react';
import { Message, Language, Playlist } from '../types';
import { useLanguage } from '../LanguageContext';
import { Trash2, Edit, Plus, LogOut, Save, X, Music, Calendar, Clock, Type, Link as LinkIcon, MessageSquare, ListMusic, Check } from 'lucide-react';

const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeTab, setActiveTab] = useState<'messages' | 'playlists' | 'maintenance'>('messages');
  const [editingMessage, setEditingMessage] = useState<Partial<Message> | null>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<Partial<Playlist> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    id: string;
    type: 'message' | 'playlist';
    title: string;
  }>({ show: false, id: '', type: 'message', title: '' });
  const { t, language } = useLanguage();

  const fetchData = useCallback(async () => {
    fetchMessages();
    fetchPlaylists();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsLoggedIn(true);
      fetchData();
    }
  }, [fetchData]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists');
      const data = await res.json();
      setPlaylists(data);
    } catch (err) {
      console.error('Failed to fetch playlists', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('admin_token', data.token);
        setIsLoggedIn(true);
        fetchData();
      } else {
        alert(t.invalidCredentials || 'Invalid username or password');
      }
    } catch {
      alert(t.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsLoggedIn(false);
  };

  const extractYouTubeId = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : url;
    return id;
  };

  const getYouTubeThumbnail = (id: string) => {
    if (!id || id.length !== 11) return '';
    return `https://img.youtube.com/vi/${id}/0.jpg`;
  };

  const handleReorder = async (direction: 'up' | 'down', index: number) => {
    const newMessages = [...messages];
    if (direction === 'up' && index > 0) {
      [newMessages[index], newMessages[index - 1]] = [newMessages[index - 1], newMessages[index]];
    } else if (direction === 'down' && index < newMessages.length - 1) {
      [newMessages[index], newMessages[index + 1]] = [newMessages[index + 1], newMessages[index]];
    } else {
      return;
    }

    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/messages/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messageIds: newMessages.map(m => m.id) }),
      });
      if (res.ok) {
        setMessages(newMessages);
      }
    } catch (err) {
      console.error('Reorder failed', err);
    }
  };

  const handleSaveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMessage) return;

    const token = localStorage.getItem('admin_token');
    const method = editingMessage.id ? 'PUT' : 'POST';
    const url = editingMessage.id ? `/api/messages/${editingMessage.id}` : '/api/messages';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editingMessage),
      });

      if (res.ok) {
        setEditingMessage(null);
        setIsAdding(false);
        fetchMessages();
      } else {
        alert(t.errorSaving);
      }
    } catch {
      alert(t.errorOccurred);
    }
  };

  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlaylist) return;

    const token = localStorage.getItem('admin_token');
    const method = editingPlaylist.id ? 'PUT' : 'POST';
    const url = editingPlaylist.id ? `/api/playlists/${editingPlaylist.id}` : '/api/playlists';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editingPlaylist),
      });

      if (res.ok) {
        setEditingPlaylist(null);
        setIsAdding(false);
        fetchPlaylists();
      } else {
        alert(t.errorSaving);
      }
    } catch {
      alert(t.errorOccurred);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        fetchMessages();
        setConfirmModal({ ...confirmModal, show: false });
        if (editingMessage?.id === id) {
          setEditingMessage(null);
          setIsAdding(false);
        }
      } else {
        const data = await res.json();
        alert(data.error || t.errorDeleting);
      }
    } catch {
      alert(t.errorDeleting);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        fetchPlaylists();
        setConfirmModal({ ...confirmModal, show: false });
        if (editingPlaylist?.id === id) {
          setEditingPlaylist(null);
          setIsAdding(false);
        }
      } else {
        const data = await res.json();
        alert(data.error || t.errorDeleting);
      }
    } catch {
      alert(t.errorDeleting);
    }
  };

  const handleExport = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `church_messages_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const token = localStorage.getItem('admin_token');
        const res = await fetch('/api/admin/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
        
        if (res.ok) {
          alert('Data imported successfully! Refreshing...');
          fetchData();
        } else {
          const err = await res.json();
          alert(`Import failed: ${err.error}`);
        }
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const renderMaintenance = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3 text-amber-700">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Calendar size={20} />
          </div>
          <h3 className="font-bold text-lg">{language === Language.TAMIL ? 'முக்கிய அறிவிப்பு' : 'Important Notice'}</h3>
        </div>
        <p className="text-amber-800 text-sm leading-relaxed">
          {language === Language.TAMIL 
            ? 'இந்த பயன்பாட்டின் தரவு தற்போது தற்காலிகமானது. பயன்பாட்டின் குறியீடு புதுப்பிக்கப்படும்போது (எ.கா. புதிய அம்சங்கள் சேர்க்கப்படும்போது), உங்கள் தரவு மீட்டமைக்கப்படலாம். உங்கள் தரவைப் பாதுகாக்க, அவ்வப்போது "பேக்கப்" எடுத்துக்கொள்ளவும்.'
            : 'The data in this application is currently ephemeral. When the application code is updated (e.g., when new features are added), your data might be reset. To protect your data, please take regular backups using the export feature below.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-indigo-600">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Save size={20} />
            </div>
            <h3 className="font-bold">{language === Language.TAMIL ? 'தரவை ஏற்றுமதி செய்' : 'Export Data'}</h3>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            {language === Language.TAMIL 
              ? 'உங்கள் எல்லா செய்திகளையும் பிளேலிஸ்ட்களையும் ஒரு கோப்பாகப் பதிவிறக்கவும். இதை நீங்கள் பின்னர் மீட்டெடுக்கப் பயன்படுத்தலாம்.'
              : 'Download all your messages and playlists as a JSON file. You can use this to restore your data later.'}
          </p>
          <button
            onClick={handleExport}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} /> {language === Language.TAMIL ? 'பேக்கப் பதிவிறக்கு' : 'Download Backup'}
          </button>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Plus size={20} />
            </div>
            <h3 className="font-bold">{language === Language.TAMIL ? 'தரவை இறக்குமதி செய்' : 'Import Data'}</h3>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            {language === Language.TAMIL 
              ? 'முன்பு சேமித்த பேக்கப் கோப்பிலிருந்து தரவை மீட்டெடுக்கவும். எச்சரிக்கை: இது தற்போதைய தரவை அழித்துவிடும்.'
              : 'Restore data from a previously saved backup file. Warning: This will overwrite current data.'}
          </p>
          <label className="block">
            <span className="sr-only">Choose backup file</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-bold
                file:bg-emerald-50 file:text-emerald-700
                hover:file:bg-emerald-100
                cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">{t.admin} {t.login}</h1>
            <p className="text-slate-500 text-sm">{t.enterPassword}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-4">Username</label>
              <input
                type="text"
                placeholder={t.username || 'Username'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-1 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-4">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 bottom-4 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <X size={18} /> : <Edit size={18} />}
              </button>
            </div>
            
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-1">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Default Credentials</p>
              <p className="text-[11px] text-amber-600">User: <span className="font-mono font-bold">admin</span></p>
              <p className="text-[11px] text-amber-600">Pass: <span className="font-mono font-bold">admin123</span></p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? t.verifying : t.login}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800">{t.admin}</h1>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-all">
            <LogOut size={20} />
          </button>
        </div>
        <div className="max-w-4xl mx-auto px-6 flex gap-8">
          <button 
            onClick={() => setActiveTab('messages')}
            className={`py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'messages' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
          >
            {t.messages}
          </button>
          <button 
            onClick={() => setActiveTab('playlists')}
            className={`py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'playlists' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
          >
            {t.playlists}
          </button>
          <button 
            onClick={() => setActiveTab('maintenance')}
            className={`py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'maintenance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
          >
            {language === Language.TAMIL ? 'பராமரிப்பு' : 'Maintenance'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {confirmModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
                <Trash2 size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-800">{t.confirmDelete}</h3>
                <p className="text-slate-500 text-sm line-clamp-2">"{confirmModal.title}"</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
                >
                  {t.back || 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.type === 'message') {
                      handleDeleteMessage(confirmModal.id);
                    } else {
                      handleDeletePlaylist(confirmModal.id);
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                >
                  {t.delete}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' ? (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">{t.messages} ({messages.length})</h2>
              <button
                onClick={() => {
                  setIsAdding(true);
                  setEditingMessage({
                    title: '',
                    subtitle: '',
                    date: new Date().toISOString().split('T')[0],
                    duration: '00:00',
                    videoUrl: '',
                    thumbnail: `https://picsum.photos/seed/${Date.now()}/400/400`,
                  });
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-indigo-700 transition-all"
              >
                <Plus size={18} /> {t.new} {language === Language.TAMIL ? 'செய்தி' : 'Message'}
              </button>
            </div>

            {(isAdding || editingMessage) && (
              <div className="bg-white rounded-3xl shadow-lg border border-indigo-100 p-6 space-y-6 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">{editingMessage?.id ? t.editMessage : t.addMessage}</h3>
                  <button onClick={() => { setEditingMessage(null); setIsAdding(false); }} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSaveMessage} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Type size={12} /> {t.title}</label>
                    <input
                      type="text"
                      value={editingMessage?.title || ''}
                      onChange={(e) => setEditingMessage({ ...editingMessage, title: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Type size={12} /> {t.subtitle}</label>
                    <input
                      type="text"
                      value={editingMessage?.subtitle || ''}
                      onChange={(e) => setEditingMessage({ ...editingMessage, subtitle: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Calendar size={12} /> {t.date}</label>
                    <input
                      type="date"
                      value={editingMessage?.date || ''}
                      onChange={(e) => setEditingMessage({ ...editingMessage, date: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Clock size={12} /> {t.duration} (MM:SS)</label>
                    <input
                      type="text"
                      value={editingMessage?.duration || ''}
                      onChange={(e) => setEditingMessage({ ...editingMessage, duration: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="45:20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><ListMusic size={12} /> Part Number</label>
                    <input
                      type="number"
                      value={editingMessage?.partNumber || ''}
                      onChange={(e) => setEditingMessage({ ...editingMessage, partNumber: parseInt(e.target.value) || undefined })}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                    <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><LinkIcon size={12} /> {t.audioLink}</label>
                    <input
                      type="url"
                      value={editingMessage?.videoUrl || ''}
                      onChange={(e) => {
                        const id = extractYouTubeId(e.target.value);
                        const thumb = getYouTubeThumbnail(id);
                        setEditingMessage({ 
                          ...editingMessage, 
                          videoUrl: e.target.value,
                          videoId: id,
                          thumbnail: thumb || editingMessage?.thumbnail
                        });
                      }}
                      className="w-full bg-white border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                      placeholder="Paste YouTube link here..."
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Music size={12} /> {t.thumbnailLink}</label>
                    <input
                      type="url"
                      value={editingMessage?.thumbnail || ''}
                      onChange={(e) => setEditingMessage({ ...editingMessage, thumbnail: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="md:col-span-2 space-y-4 border-t border-slate-100 pt-6 mt-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare size={16} className="text-indigo-600" />
                        {t.subtitles}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newSub = {
                            id: `sub-${Date.now()}`,
                            title: '',
                            date: editingMessage?.date || '',
                            duration: '00:00',
                            videoUrl: '',
                            thumbnail: editingMessage?.thumbnail || '',
                          };
                          setEditingMessage({
                            ...editingMessage,
                            subMessages: [...(editingMessage?.subMessages || []), newSub]
                          });
                        }}
                        className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-1"
                      >
                        <Plus size={12} /> {t.addMessage}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {editingMessage?.subMessages?.map((sub, idx) => (
                        <div key={sub.id} className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100 relative group">
                          <button
                            type="button"
                            onClick={() => {
                              const newSubs = editingMessage.subMessages?.filter((_, i) => i !== idx);
                              setEditingMessage({ ...editingMessage, subMessages: newSubs });
                            }}
                            className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Sub-Title</label>
                              <input
                                type="text"
                                value={sub.title}
                                onChange={(e) => {
                                  const newSubs = [...(editingMessage.subMessages || [])];
                                  newSubs[idx] = { ...sub, title: e.target.value };
                                  setEditingMessage({ ...editingMessage, subMessages: newSubs });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Video URL</label>
                              <input
                                type="url"
                                value={sub.videoUrl}
                                onChange={(e) => {
                                  const id = extractYouTubeId(e.target.value);
                                  const newSubs = [...(editingMessage.subMessages || [])];
                                  newSubs[idx] = { ...sub, videoUrl: e.target.value, videoId: id };
                                  setEditingMessage({ ...editingMessage, subMessages: newSubs });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Paste YouTube link..."
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Part Number</label>
                              <input
                                type="number"
                                value={sub.partNumber || ''}
                                onChange={(e) => {
                                  const newSubs = [...(editingMessage.subMessages || [])];
                                  newSubs[idx] = { ...sub, partNumber: parseInt(e.target.value) || undefined };
                                  setEditingMessage({ ...editingMessage, subMessages: newSubs });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="1"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-4 flex gap-3">
                    {editingMessage.id && (
                      <button
                        type="button"
                        onClick={() => setConfirmModal({
                          show: true,
                          id: editingMessage.id!,
                          type: 'message',
                          title: editingMessage.title || ''
                        })}
                        className="flex-1 bg-red-50 text-red-500 font-bold py-3 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} /> {t.delete}
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-[2] bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> {t.save}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={msg.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 group">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => handleReorder('up', idx)}
                      disabled={idx === 0}
                      className="p-1 text-slate-300 hover:text-indigo-600 disabled:opacity-0 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    </button>
                    <button 
                      onClick={() => handleReorder('down', idx)}
                      disabled={idx === messages.length - 1}
                      className="p-1 text-slate-300 hover:text-indigo-600 disabled:opacity-0 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                  </div>
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={msg.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 truncate">{msg.title}</h4>
                    <p className="text-xs text-slate-400 font-medium">{msg.date} • {msg.duration}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingMessage(msg)}
                      className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmModal({
                        show: true,
                        id: msg.id,
                        type: 'message',
                        title: msg.title
                      })}
                      className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-50 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : activeTab === 'playlists' ? (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">{t.playlists} ({playlists.length})</h2>
              <button
                onClick={() => {
                  setIsAdding(true);
                  setEditingPlaylist({
                    title: '',
                    description: '',
                    thumbnail: `https://picsum.photos/seed/playlist-${Date.now()}/400/400`,
                    messageIds: [],
                  });
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-indigo-700 transition-all"
              >
                <Plus size={18} /> {t.new} {t.playlist}
              </button>
            </div>

            {(isAdding || editingPlaylist) && (
              <div className="bg-white rounded-3xl shadow-lg border border-indigo-100 p-6 space-y-6 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">{editingPlaylist?.id ? (language === Language.TAMIL ? 'பிளேலிஸ்ட்டை மாற்றுக' : 'Edit Playlist') : (language === Language.TAMIL ? 'பிளேலிஸ்ட்டை சேர்க்க' : 'Add Playlist')}</h3>
                  <button onClick={() => { setEditingPlaylist(null); setIsAdding(false); }} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSavePlaylist} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Type size={12} /> {t.title}</label>
                      <input
                        type="text"
                        value={editingPlaylist?.title || ''}
                        onChange={(e) => setEditingPlaylist({ ...editingPlaylist, title: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Music size={12} /> {t.thumbnailLink}</label>
                      <div className="w-full bg-slate-100 border-2 border-dashed border-slate-200 rounded-xl py-3 px-4 text-slate-400 text-xs flex items-center justify-center italic">
                        {language === Language.TAMIL ? 'முதல் வீடியோவிலிருந்து தானாகவே எடுக்கப்படும்' : 'Automatically generated from first video'}
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Type size={12} /> {t.description}</label>
                      <textarea
                        value={editingPlaylist?.description || ''}
                        onChange={(e) => setEditingPlaylist({ ...editingPlaylist, description: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><ListMusic size={12} /> {t.selectMessages}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100">
                      {[...messages].sort((a, b) => a.title.localeCompare(b.title)).map(msg => (
                        <button
                          key={msg.id}
                          type="button"
                          onClick={() => {
                            const currentIds = editingPlaylist?.messageIds || [];
                            const newIds = currentIds.includes(msg.id)
                              ? currentIds.filter(id => id !== msg.id)
                              : [...currentIds, msg.id];
                            setEditingPlaylist({ ...editingPlaylist, messageIds: newIds });
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                            editingPlaylist?.messageIds?.includes(msg.id)
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                              : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={msg.thumbnail} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs font-bold truncate flex-1">{msg.title}</span>
                          {editingPlaylist?.messageIds?.includes(msg.id) && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {editingPlaylist.id && (
                      <button
                        type="button"
                        onClick={() => setConfirmModal({
                          show: true,
                          id: editingPlaylist.id!,
                          type: 'playlist',
                          title: editingPlaylist.title || ''
                        })}
                        className="flex-1 bg-red-50 text-red-500 font-bold py-3 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} /> {t.delete}
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-[2] bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> {t.save}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {playlists.map((pl) => (
                <div key={pl.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600">
                    {pl.thumbnail ? (
                      <img src={pl.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ListMusic size={24} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 truncate">{pl.title}</h4>
                    <p className="text-xs text-slate-400 font-medium">{pl.messageIds.length} {t.messages}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPlaylist(pl)}
                      className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmModal({
                        show: true,
                        id: pl.id,
                        type: 'playlist',
                        title: pl.title
                      })}
                      className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-50 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {playlists.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  <p>{t.noPlaylists}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          renderMaintenance()
        )}
      </div>
    </div>
  );
};

export default Admin;
