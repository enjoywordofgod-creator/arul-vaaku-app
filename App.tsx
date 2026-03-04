
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import VideoPlayer from './components/VideoPlayer';
import Admin from './components/Admin';
import { useLanguage } from './LanguageContext';
import { Message, DailyVerse, Playlist } from './types';
import { Music } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [parentMessage, setParentMessage] = useState<Message | null>(null);
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();

  useEffect(() => {
    fetchData();
    // Static daily verse
    setDailyVerse({
      verse: language === 'ta' 
        ? "கர்த்தர் என் மேய்ப்பராயிருக்கிறார்; நான் தாழ்ச்சியடையேன்." 
        : "The Lord is my shepherd; I shall not want.",
      reference: language === 'ta' ? "சங்கீதம் 23:1" : "Psalm 23:1"
    });
  }, [language]);

  const fetchData = async () => {
    try {
      const [msgRes, plRes] = await Promise.all([
        fetch('/api/messages'),
        fetch('/api/playlists')
      ]);
      const [msgData, plData] = await Promise.all([
        msgRes.json(),
        plRes.json()
      ]);
      setMessages(msgData);
      setPlaylists(plData);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = (msg: Message) => {
    if (msg.subMessages && msg.subMessages.length > 0) {
      setParentMessage(msg);
      navigate('/subtitles');
    } else {
      console.log('Message Clicked:', {
        title: msg.title,
        videoId: msg.videoId
      });
      navigate(`/message/${msg.id}`);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  const filteredMessages = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return messages;
    
    const results: Message[] = [];
    
    messages.forEach(msg => {
      const titleMatch = msg.title.toLowerCase().includes(query);
      const subtitleMatch = msg.subtitle?.toLowerCase().includes(query);
      const dateMatch = msg.date.includes(query);
      
      if (titleMatch || subtitleMatch || dateMatch) {
        results.push(msg);
      }
      
      if (msg.subMessages) {
        msg.subMessages.forEach(sub => {
          if (sub.title.toLowerCase().includes(query) || sub.date.includes(query)) {
            results.push(sub);
          }
        });
      }
    });
    
    return Array.from(new Map(results.map(item => [item.id, item])).values());
  }, [searchQuery, messages]);

  const renderHome = () => (
    <div className="px-6 py-4 space-y-8">
      {/* Daily Verse Section */}
      {dailyVerse && (
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">{t.dailyVerse}</h3>
            <p className="text-lg font-medium leading-relaxed italic">"{dailyVerse.verse}"</p>
            <p className="mt-2 text-sm text-indigo-200 font-bold">— {dailyVerse.reference}</p>
          </div>
          <div className="absolute top-[-20%] right-[-10%] opacity-10 transform rotate-12 transition-transform group-hover:scale-110">
            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
          </div>
        </div>
      )}

      {/* Playlists Section */}
      {!searchQuery && playlists.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 px-1">{t.playlists}</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
            {playlists.map(pl => (
              <button
                key={pl.id}
                onClick={() => navigate(`/playlist/${pl.id}`)}
                className="flex-shrink-0 w-40 space-y-2 group text-left"
              >
                <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-sm group-hover:shadow-md transition-all relative">
                  <img src={pl.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                    {pl.messageIds.length} {t.messages}
                  </div>
                </div>
                <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">{pl.title}</h4>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-lg font-bold text-slate-800">{t.messages}</h3>
          {searchQuery && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">
                {`${filteredMessages.length} ${t.results}`}
              </span>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-slate-400">{t.loading}</div>
        ) : filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => handleMessageClick(msg)}
              className="w-full text-left bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                <img src={msg.thumbnail} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{msg.title}</h4>
                <p className="text-sm text-slate-500 truncate">{msg.subtitle || `${msg.duration} • ${msg.date}`}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                {msg.subMessages && msg.subMessages.length > 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-12 space-y-3">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <p className="text-slate-500 font-medium">{t.noMessages}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSubtitles = () => (
    <div className="px-6 py-4 space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{parentMessage?.title}</h2>
        <p className="text-slate-500 mt-1">{parentMessage?.subtitle || t.subtitles}</p>
      </div>
      {parentMessage?.subMessages?.map((sub) => (
        <button
          key={sub.id}
          onClick={() => {
            console.log('Subtitle Clicked:', {
              title: sub.title,
              videoId: sub.videoId
            });
            navigate(`/message/${sub.id}`);
          }}
          className="w-full text-left bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-music"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800">{sub.title}</h4>
            <p className="text-xs text-slate-400 font-mono uppercase">{sub.duration} • {sub.date}</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-indigo-600"><polygon points="6 3 20 12 6 21 6 3"/></svg>
        </button>
      ))}
    </div>
  );

  const isPlayerPage = location.pathname.startsWith('/player') || location.pathname.startsWith('/message/');

  return (
    <Routes>
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={
        <Layout 
          title={isPlayerPage ? t.nowPlaying : t.appTitle} 
          onBack={location.pathname !== '/' ? goBack : undefined}
          latestMessages={messages}
          onMessageClick={(msg) => navigate(`/message/${msg.id}`)}
          searchQuery={searchQuery}
          onSearchChange={location.pathname === '/' ? setSearchQuery : undefined}
        >
          <Routes>
            <Route path="/" element={renderHome()} />
            <Route path="/subtitles" element={renderSubtitles()} />
            <Route path="/playlist/:id" element={<PlaylistPage messages={messages} playlists={playlists} />} />
            <Route path="/message/:id" element={<MessagePage messages={messages} />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  );
};

const PlaylistPage: React.FC<{ messages: Message[], playlists: Playlist[] }> = ({ messages, playlists }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const playlist = playlists.find(p => p.id === id);
  const playlistMessages = useMemo(() => {
    if (!playlist) return [];
    const sorted = playlist.messageIds
      .map(mid => messages.find(m => m.id === mid))
      .filter((m): m is Message => m !== undefined)
      .sort((a, b) => {
        const aPart = a.partNumber;
        const bPart = b.partNumber;
        if (aPart !== undefined && bPart !== undefined) {
          if (aPart !== bPart) return aPart - bPart;
        } else if (aPart !== undefined) {
          return -1;
        } else if (bPart !== undefined) {
          return 1;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    return sorted;
  }, [playlist, messages]);

  if (!playlist) return <div className="p-10 text-center">{t.noPlaylists}</div>;

  return (
    <div className="px-6 py-4 space-y-6">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-lg flex-shrink-0">
          <img src={playlist.thumbnail} alt="" className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 leading-tight">{playlist.title}</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">{playlist.description}</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Music size={12} /> {playlistMessages.length} {t.messages}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {playlistMessages.map((msg, idx) => (
          <button
            key={msg.id}
            onClick={() => {
              console.log('Playlist Item Clicked:', {
                title: msg.title,
                videoId: msg.videoId
              });
              navigate(`/message/${msg.id}`);
            }}
            className="w-full text-left bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{msg.title}</h4>
              <p className="text-xs text-slate-400 font-medium uppercase">{msg.duration} • {msg.date}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const MessagePage: React.FC<{ messages: Message[] }> = ({ messages }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Flatten messages to find the current one and its context
  // This creates a flat playlist of all playable tracks
  const playableMessages = useMemo(() => {
    const list: Message[] = [];
    messages.forEach(m => {
      if (m.subMessages && m.subMessages.length > 0) {
        m.subMessages.forEach(sub => list.push(sub));
      } else if (m.videoUrl) {
        list.push(m);
      }
    });
    
    return list.sort((a, b) => {
      const aPart = a.partNumber;
      const bPart = b.partNumber;
      if (aPart !== undefined && bPart !== undefined) {
        if (aPart !== bPart) return aPart - bPart;
      } else if (aPart !== undefined) {
        return -1;
      } else if (bPart !== undefined) {
        return 1;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [messages]);

  const currentIndex = playableMessages.findIndex(m => m.id === id);
  const message = playableMessages[currentIndex];

  if (!message) return <div className="p-10 text-center">{t.noMessages}</div>;

  const handleNext = () => {
    if (currentIndex < playableMessages.length - 1) {
      navigate(`/message/${playableMessages[currentIndex + 1].id}`);
    } else {
      // Loop back to first
      navigate(`/message/${playableMessages[0].id}`);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      navigate(`/message/${playableMessages[currentIndex - 1].id}`);
    } else {
      // Go to last
      navigate(`/message/${playableMessages[playableMessages.length - 1].id}`);
    }
  };

  return (
    <VideoPlayer 
      message={message} 
      onNext={handleNext}
      onPrevious={handlePrevious}
      hasNext={playableMessages.length > 1}
      hasPrevious={playableMessages.length > 1}
    />
  );
};

export default App;
