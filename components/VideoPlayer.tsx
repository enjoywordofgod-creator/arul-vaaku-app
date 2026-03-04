
import React, { useMemo } from 'react';
import { Message, Language } from '../types';
import { useLanguage } from '../LanguageContext';
import { Share2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  message: Message;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  message, 
  onNext, 
  onPrevious,
  hasNext = false,
  hasPrevious = false
}) => {
  const { t, language } = useLanguage();

  const videoId = useMemo(() => {
    if (message.videoId) return message.videoId;
    
    const url = message.videoUrl;
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  }, [message.videoId, message.videoUrl]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/message/${message.id}`;
    const shareData = {
      title: message.title,
      text: `${t.appTitle}: ${message.title}\n${message.subtitle || ''}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert(t.linkCopied);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const embedUrl = useMemo(() => {
    if (videoId) {
      console.log('Video Player Loaded:', {
        title: message.title,
        videoId: videoId
      });
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&autoplay=1&mute=1&fs=1&playsinline=1`;
    }
    return '';
  }, [videoId, message.title]);

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Video Container */}
      <div className="relative w-full aspect-video bg-black shadow-2xl overflow-hidden">
        {videoId ? (
          <iframe
            src={embedUrl}
            title={message.title}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center space-y-4">
            <AlertCircle size={48} className="text-red-500" />
            <div className="space-y-1">
              <p className="font-bold">{language === Language.TAMIL ? 'தவறான வீடியோ இணைப்பு' : 'Invalid Video Link'}</p>
              <p className="text-xs text-slate-400">
                {language === Language.TAMIL 
                  ? 'இந்த வீடியோ தனிப்பட்டதாக இருக்கலாம் அல்லது இணைப்பு தவறாக இருக்கலாம்.' 
                  : 'This video might be private or the link is invalid.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="px-6 py-6 flex-1 space-y-6 overflow-y-auto">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2 flex-1">
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">
              {message.title}
            </h2>
            {message.subtitle && (
              <p className="text-indigo-600 font-medium">{message.subtitle}</p>
            )}
            <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
              <span>{message.date}</span>
              <span>•</span>
              <span>{message.duration}</span>
            </div>
          </div>
          <button 
            onClick={handleShare}
            className="p-3 rounded-2xl bg-slate-50 text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-100"
            aria-label={t.share}
          >
            <Share2 size={24} />
          </button>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button 
            onClick={onPrevious}
            disabled={!hasPrevious}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all ${
              hasPrevious 
                ? 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600' 
                : 'bg-slate-50 text-slate-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={20} />
            {t.previous}
          </button>

          <button 
            onClick={onNext}
            disabled={!hasNext}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all ${
              hasNext 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100' 
                : 'bg-slate-50 text-slate-300 cursor-not-allowed'
            }`}
          >
            {t.next}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
