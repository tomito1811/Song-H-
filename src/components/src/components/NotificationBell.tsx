import React, { useEffect, useRef, useState } from 'react';
import { Bell, Gift, MessageSquare, CheckCircle2, Eye } from 'lucide-react';
import { OwnerNotification } from '../types/wedding';
import { subscribeNotifications, markNotificationsRead, describeNotification } from '../utils/engagement';

interface NotificationBellProps {
  ownerId: string;
  onOpenAll: () => void;
}

/** Chuông thông báo realtime trên thanh menu + thông báo trình duyệt khi có hoạt động mới. */
export const NotificationBell: React.FC<NotificationBellProps> = ({ ownerId, onOpenAll }) => {
  const [list, setList] = useState<OwnerNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const seenRef = useRef<Set<string> | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    seenRef.current = null;
    return subscribeNotifications(ownerId, (items) => {
      // Lần tải đầu: ghi nhớ, không bật thông báo cho dữ liệu cũ
      if (seenRef.current === null) {
        seenRef.current = new Set(items.map((n) => n.id));
      } else {
        const fresh = items.filter((n) => !seenRef.current!.has(n.id));
        fresh.forEach((n) => seenRef.current!.add(n.id));
        if (fresh.length > 0) {
          const d = describeNotification(fresh[0]);
          setToast(d.title);
          setTimeout(() => setToast(null), 5000);
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(d.title, { body: d.body || fresh[0].invitationTitle || '', tag: fresh[0].id });
            }
          } catch {
            /* ignore */
          }
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.frequency.value = 880;
            g.gain.setValueAtTime(0.08, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
            o.connect(g).connect(ctx.destination);
            o.start();
            o.stop(ctx.currentTime + 0.4);
          } catch {
            /* ignore */
          }
        }
      }
      setList(items);
    });
  }, [ownerId]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const unread = list.filter((n) => !n.read);

  const toggle = () => {
    setOpen((v) => !v);
    try {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-xl hover:bg-[#F6DCE5]/40 dark:hover:bg-[#2A232A] text-[#453C45] dark:text-[#F5EDE8] cursor-pointer"
        aria-label={`Thông báo${unread.length ? ` (${unread.length} mới)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread.length > 99 ? '99+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#2A232A] rounded-2xl shadow-2xl border border-[#E8B7C8]/40 dark:border-[#3D333D] z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-[#3D333D] flex items-center justify-between">
            <span className="text-sm font-bold text-[#453C45] dark:text-[#F5EDE8]">Thông báo</span>
            {unread.length > 0 && (
              <button
                onClick={() => markNotificationsRead(unread.map((n) => n.id))}
                className="text-[11px] text-[#C76A82] hover:underline cursor-pointer"
              >
                Đã đọc tất cả
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-neutral-100 dark:divide-[#3D333D]">
            {list.length === 0 ? (
              <p className="p-6 text-center text-xs text-[#827580]">Chưa có hoạt động nào từ khách mời.</p>
            ) : (
              list.slice(0, 12).map((n) => {
                const d = describeNotification(n);
                const Icon = n.type === 'gift' ? Gift : n.type === 'wish' ? MessageSquare : n.type === 'rsvp' ? CheckCircle2 : Eye;
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markNotificationsRead([n.id])}
                    className={`w-full text-left px-4 py-3 flex gap-2.5 text-xs cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#332A33] ${
                      n.read ? '' : 'bg-[#FFF5F8] dark:bg-[#3A2A33]'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#C76A82] shrink-0 mt-0.5" />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[#453C45] dark:text-[#F5EDE8] ${n.read ? '' : 'font-semibold'}`}>{d.title}</span>
                      {d.body && <span className="block text-[#827580] truncate">{d.body}</span>}
                      <span className="block text-[10px] text-neutral-400">{new Date(n.createdAt).toLocaleString('vi-VN')}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              onOpenAll();
            }}
            className="w-full py-2.5 text-xs font-semibold text-[#C76A82] border-t border-neutral-100 dark:border-[#3D333D] hover:bg-[#F6DCE5]/30 cursor-pointer"
          >
            Xem tất cả trong bảng điều khiển
          </button>
        </div>
      )}

      {toast && !open && (
        <div className="fixed top-20 right-4 z-[60] max-w-xs px-4 py-3 rounded-2xl bg-[#453C45] text-white text-xs shadow-2xl flex items-center gap-2 animate-pulse">
          <Bell className="w-4 h-4 shrink-0" /> {toast}
        </div>
      )}
    </div>
  );
};
