import React, { useEffect, useRef, useState } from 'react';
import { Music, Play, Pause, Check, UploadCloud, Link2, Loader2, VolumeX } from 'lucide-react';
import { WEDDING_TRACKS, MUSIC_MOODS, WeddingTrack, findTrackByUrl } from '../data/music';
import { uploadAudioToStorage } from '../utils/imageUpload';
import { auth } from '../firebase';

interface MusicPickerProps {
  value: string;
  title?: string;
  accent?: string;
  onChange: (url: string, title?: string) => void;
}

/** Chọn nhạc nền cưới: thư viện có nghe thử, tải file của bạn hoặc dán link MP3. */
export const MusicPicker: React.FC<MusicPickerProps> = ({ value, title, accent = '#C76A82', onChange }) => {
  const [mood, setMood] = useState<WeddingTrack['mood'] | 'all'>('all');
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedTrack = findTrackByUrl(value);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePreview = (url: string) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    if (playingUrl === url) {
      audio.pause();
      setPlayingUrl(null);
      return;
    }
    audio.pause();
    audio.src = url;
    audio.volume = 0.7;
    setLoadingUrl(url);
    audio
      .play()
      .then(() => setPlayingUrl(url))
      .catch(() => setPlayingUrl(null))
      .finally(() => setLoadingUrl(null));
    audio.onended = () => setPlayingUrl(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!auth.currentUser) {
      alert('Vui lòng đăng nhập Google để tải nhạc lên.');
      return;
    }
    try {
      setUploading(true);
      const url = await uploadAudioToStorage(file);
      onChange(url, file.name.replace(/\.[^.]+$/, ''));
    } catch (err: any) {
      alert(err.message || 'Không tải được file nhạc.');
    } finally {
      setUploading(false);
    }
  };

  const list = WEDDING_TRACKS.filter((t) => mood === 'all' || t.mood === mood);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#453C45] flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5" style={{ color: accent }} /> Nhạc Nền Hôn Lễ
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange('', '')}
            className="text-[11px] text-[#827580] hover:text-red-500 flex items-center gap-1 cursor-pointer"
          >
            <VolumeX className="w-3 h-3" /> Tắt nhạc
          </button>
        ) : null}
      </div>

      {value && (
        <p className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[#F6DCE5]/40 text-[#453C45] truncate">
          Đang chọn: <strong>{selectedTrack?.title || title || 'Nhạc tùy chọn'}</strong>
        </p>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {MUSIC_MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMood(m.id)}
            className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap border cursor-pointer ${
              mood === m.id ? 'bg-[#453C45] text-white border-[#453C45]' : 'bg-white text-[#827580] border-neutral-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <ul className="max-h-64 overflow-y-auto divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
        {list.map((t) => {
          const isSelected = value === t.url;
          const isPlaying = playingUrl === t.url;
          return (
            <li key={t.id} className={`flex items-center gap-2 px-2.5 py-2 ${isSelected ? 'bg-[#FFFBF7]' : ''}`}>
              <button
                type="button"
                onClick={() => togglePreview(t.url)}
                className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white cursor-pointer"
                style={{ backgroundColor: accent }}
                title={isPlaying ? 'Dừng nghe thử' : 'Nghe thử'}
              >
                {loadingUrl === t.url ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#453C45] truncate">{t.title}</p>
                <p className="text-[10px] text-[#827580] truncate" title={t.credit}>
                  {t.artist}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange(t.url, t.title)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer flex items-center gap-1 ${
                  isSelected ? 'bg-emerald-600 text-white' : 'border border-neutral-300 text-[#453C45] hover:bg-neutral-50'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-3 h-3" /> Đã chọn
                  </>
                ) : (
                  'Chọn'
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-2">
        <label
          className={`flex-1 px-2.5 py-1.5 rounded-lg border border-dashed border-neutral-300 text-[11px] text-[#453C45] flex items-center justify-center gap-1.5 cursor-pointer hover:bg-neutral-50 ${
            uploading ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
          {uploading ? 'Đang tải nhạc…' : 'Tải nhạc của bạn (MP3)'}
          <input type="file" accept="audio/*" className="hidden" onChange={handleUpload} />
        </label>
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className="px-2.5 py-1.5 rounded-lg border border-neutral-300 text-[11px] text-[#453C45] flex items-center gap-1 cursor-pointer hover:bg-neutral-50"
        >
          <Link2 className="w-3.5 h-3.5" /> Dán link
        </button>
      </div>

      {showCustom && (
        <div className="flex gap-2">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://.../nhac-cuoi.mp3"
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-300"
          />
          <button
            type="button"
            onClick={() => {
              if (customUrl.trim()) onChange(customUrl.trim(), 'Nhạc tùy chọn');
              setShowCustom(false);
            }}
            className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold cursor-pointer"
            style={{ backgroundColor: accent }}
          >
            Dùng
          </button>
        </div>
      )}

      <p className="text-[10px] text-[#827580] leading-snug">
        Nhạc phát nhẹ sau khi khách chạm mở thiệp. Nhạc thư viện là bản quyền tự do (Public domain / CC BY – đã ghi công).
      </p>
    </div>
  );
};
