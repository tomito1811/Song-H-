import React, { useEffect, useMemo, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, FileDown, Loader2, BookHeart } from 'lucide-react';
import { WeddingInvitation, Wish, RSVP, GiftRecord, Guest } from '../types/wedding';

/**
 * Album lời chúc kỷ niệm: tự động dựng các trang ảnh (canvas 1080×1350) từ
 * lời chúc + chữ ký, danh sách khách xác nhận tham dự và quà mừng đã nhận.
 * Xem dạng lật trang, tải từng trang PNG hoặc cả album PDF.
 */

const W = 1080;
const H = 1350;

interface WishAlbumProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: WeddingInvitation;
  wishes: Wish[];
  rsvps: RSVP[];
  gifts: GiftRecord[];
  guests: Guest[];
}

interface Theme {
  bg: string;
  surface: string;
  primary: string;
  text: string;
  muted: string;
}

const SCRIPT = '"Dancing Script", cursive';
const SERIF = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const SANS = '"Quicksand", "Plus Jakarta Sans", sans-serif';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
  }
  return lines;
}

function newPage(theme: Theme): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);
  // Viền đôi trang nhã
  ctx.strokeStyle = theme.primary;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 3;
  ctx.strokeRect(46, 46, W - 92, H - 92);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(62, 62, W - 124, H - 124);
  ctx.globalAlpha = 1;
  // Hoa văn góc
  [
    [62, 62, 1, 1],
    [W - 62, 62, -1, 1],
    [62, H - 62, 1, -1],
    [W - 62, H - 62, -1, -1],
  ].forEach(([x, y, sx, sy]) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.quadraticCurveTo(0, 0, 46, 0);
    ctx.moveTo(14, 46);
    ctx.quadraticCurveTo(14, 14, 46, 14);
    ctx.stroke();
    ctx.fillStyle = theme.primary;
    ctx.beginPath();
    ctx.arc(22, 22, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  return [c, ctx];
}

function footer(ctx: CanvasRenderingContext2D, theme: Theme, label: string, pageNo: number) {
  ctx.fillStyle = theme.muted;
  ctx.font = `500 22px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${label}  •  ${pageNo}`, W / 2, H - 92);
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(x, y);
  ctx.scale(s / 30, s / 30);
  ctx.beginPath();
  ctx.moveTo(0, 9);
  ctx.bezierCurveTo(-16, -4, -9, -18, 0, -9);
  ctx.bezierCurveTo(9, -18, 16, -4, 0, 9);
  ctx.fill();
  ctx.restore();
}

export async function buildAlbumPages(
  inv: WeddingInvitation,
  wishes: Wish[],
  rsvps: RSVP[],
  gifts: GiftRecord[],
  guests: Guest[]
): Promise<string[]> {
  try {
    await Promise.all([
      document.fonts.load(`700 60px "Dancing Script"`),
      document.fonts.load(`600 40px "Cormorant Garamond"`),
      document.fonts.load(`italic 400 40px "Cormorant Garamond"`),
      document.fonts.load(`600 24px "Quicksand"`),
    ]);
  } catch {
    /* dùng font dự phòng */
  }

  const p = inv.design?.palette;
  const theme: Theme = {
    bg: p?.background || '#FFFBF7',
    surface: p?.surface || '#FDF2F4',
    primary: p?.primary || '#C76A82',
    text: p?.text || '#453C45',
    muted: '#8A7C86',
  };
  const couple = `${inv.groomName || 'Chú rể'} & ${inv.brideName || 'Cô dâu'}`;
  const label = `Sổ lưu bút ${couple}`;
  const pages: string[] = [];
  let pageNo = 1;

  // Gộp lời chúc: sổ lưu bút + lời nhắn kèm RSVP chưa có trong sổ
  const entries = [...wishes]
    .filter((w) => w.message?.trim())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // Khách tham dự: ưu tiên RSVP, bổ sung từ danh sách khách có link riêng
  const attendingMap = new Map<string, number>();
  rsvps.filter((r) => r.isAttending).forEach((r) => attendingMap.set(r.guestName.trim(), r.attendeesCount || 1));
  guests
    .filter((g) => g.rsvpStatus === 'attending')
    .forEach((g) => {
      if (!attendingMap.has(g.name.trim())) attendingMap.set(g.name.trim(), g.attendeesCount || 1);
    });
  const attending = [...attendingMap.entries()];
  const totalPeople = attending.reduce((s, [, n]) => s + n, 0);
  const giftTotal = gifts.reduce((s, g) => s + (g.amount || 0), 0);

  // ---------- Trang bìa ----------
  {
    const [c, ctx] = newPage(theme);
    const cover = inv.coverImage || inv.galleryImages?.[0];
    const img = cover ? await loadImage(cover) : null;
    if (img) {
      const bx = 140,
        by = 170,
        bw = W - 280,
        bh = 640;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(bx, by + bw / 2);
      ctx.arc(bx + bw / 2, by + bw / 2, bw / 2, Math.PI, 0); // vòm
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx, by + bh);
      ctx.closePath();
      ctx.clip();
      const r = Math.max(bw / img.width, bh / img.height);
      ctx.drawImage(img, bx + (bw - img.width * r) / 2, by + (bh - img.height * r) / 2, img.width * r, img.height * r);
      ctx.restore();
    } else {
      heart(ctx, W / 2, 470, 220, theme.primary);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.primary;
    ctx.font = `700 78px ${SCRIPT}`;
    ctx.fillText('Sổ Lưu Bút Kỷ Niệm', W / 2, 920);
    ctx.fillStyle = theme.text;
    ctx.font = `600 58px ${SERIF}`;
    ctx.fillText(couple, W / 2, 1010);
    ctx.font = `500 30px ${SANS}`;
    ctx.fillStyle = theme.muted;
    const dateStr = inv.weddingDate
      ? new Date(inv.weddingDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';
    ctx.fillText([dateStr, inv.venueName].filter(Boolean).join('  •  '), W / 2, 1066);
    ctx.font = `italic 400 32px ${SERIF}`;
    ctx.fillText(`${entries.length} lời chúc  •  ${totalPeople} khách tham dự  •  ${gifts.length} quà mừng`, W / 2, 1150);
    pages.push(c.toDataURL('image/jpeg', 0.9));
  }

  // ---------- Trang tổng hợp ----------
  {
    const [c, ctx] = newPage(theme);
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.primary;
    ctx.font = `700 64px ${SCRIPT}`;
    ctx.fillText('Những Con Số Yêu Thương', W / 2, 200);
    const stats: [string, string][] = [
      [String(entries.length), 'lời chúc phúc'],
      [String(attending.length), 'lượt xác nhận tham dự'],
      [String(totalPeople), 'khách sẽ đến chung vui'],
      [String(gifts.length), 'phần quà mừng'],
    ];
    stats.forEach(([n, l], i) => {
      const cx = i % 2 === 0 ? W / 2 - 220 : W / 2 + 220;
      const cy = 380 + Math.floor(i / 2) * 260;
      ctx.fillStyle = theme.surface;
      ctx.beginPath();
      ctx.arc(cx, cy, 105, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = theme.primary;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = theme.primary;
      ctx.font = `600 84px ${SERIF}`;
      ctx.fillText(n, cx, cy + 28);
      ctx.fillStyle = theme.text;
      ctx.font = `600 26px ${SANS}`;
      ctx.fillText(l, cx, cy + 150);
    });
    if (giftTotal > 0) {
      ctx.fillStyle = theme.text;
      ctx.font = `italic 400 36px ${SERIF}`;
      ctx.fillText(`Tổng quà mừng đã báo: ${new Intl.NumberFormat('vi-VN').format(giftTotal)} đ`, W / 2, 960);
    }
    ctx.fillStyle = theme.muted;
    ctx.font = `italic 400 34px ${SERIF}`;
    wrapLines(ctx, inv.thankYouMessage || 'Cảm ơn mọi người đã cùng chung vui trong ngày trọng đại của chúng tôi.', W - 300, 4).forEach(
      (l, i) => ctx.fillText(l, W / 2, 1060 + i * 46)
    );
    footer(ctx, theme, label, ++pageNo);
    pages.push(c.toDataURL('image/jpeg', 0.9));
  }

  // ---------- Trang lời chúc (2 lời chúc / trang, kèm chữ ký) ----------
  for (let i = 0; i < entries.length; i += 2) {
    const [c, ctx] = newPage(theme);
    const pair = entries.slice(i, i + 2);
    for (let k = 0; k < pair.length; k++) {
      const w = pair[k];
      const top = 130 + k * 560;
      ctx.fillStyle = theme.surface;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.roundRect(120, top, W - 240, 510, 28);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = theme.primary;
      ctx.globalAlpha = 0.25;
      ctx.font = `700 180px ${SERIF}`;
      ctx.textAlign = 'left';
      ctx.fillText('“', 140, top + 150);
      ctx.globalAlpha = 1;

      ctx.fillStyle = theme.text;
      ctx.font = `italic 400 38px ${SERIF}`;
      ctx.textAlign = 'left';
      wrapLines(ctx, w.message, W - 380, w.signature ? 4 : 6).forEach((line, li) => ctx.fillText(line, 190, top + 110 + li * 50));

      const sig = w.signature ? await loadImage(w.signature) : null;
      ctx.textAlign = 'right';
      if (sig) {
        const sc = Math.min(380 / sig.width, 110 / sig.height);
        const sw = sig.width * sc;
        const sh = sig.height * sc;
        ctx.drawImage(sig, W - 180 - sw, top + 330 + (110 - sh) / 2, sw, sh);
      }
      ctx.fillStyle = theme.primary;
      ctx.font = `700 46px ${SCRIPT}`;
      ctx.fillText(w.senderName, W - 180, top + 475);
      ctx.fillStyle = theme.muted;
      ctx.font = `500 22px ${SANS}`;
      ctx.textAlign = 'left';
      ctx.fillText(w.senderRelation || '', 190, top + 475);
    }
    footer(ctx, theme, label, ++pageNo);
    pages.push(c.toDataURL('image/jpeg', 0.9));
  }

  // ---------- Trang danh sách khách tham dự & quà mừng ----------
  type Row = { name: string; right: string };
  const sections: { title: string; rows: Row[] }[] = [];
  if (attending.length)
    sections.push({ title: 'Khách Xác Nhận Tham Dự', rows: attending.map(([n, c]) => ({ name: n, right: `${c} người` })) });
  if (gifts.length)
    sections.push({
      title: 'Quà Mừng Đã Nhận',
      rows: gifts.map((g) => ({
        name: g.senderName,
        right: g.amount ? `${new Intl.NumberFormat('vi-VN').format(g.amount)} đ` : '♥',
      })),
    });
  for (const sec of sections) {
    const perPage = 18;
    for (let i = 0; i < sec.rows.length; i += perPage) {
      const [c, ctx] = newPage(theme);
      ctx.textAlign = 'center';
      ctx.fillStyle = theme.primary;
      ctx.font = `700 60px ${SCRIPT}`;
      ctx.fillText(sec.title, W / 2, 190);
      sec.rows.slice(i, i + perPage).forEach((r, j) => {
        const y = 290 + j * 52;
        ctx.fillStyle = j % 2 === 0 ? theme.surface : theme.bg;
        ctx.fillRect(150, y - 36, W - 300, 50);
        ctx.fillStyle = theme.text;
        ctx.font = `600 30px ${SERIF}`;
        ctx.textAlign = 'left';
        ctx.fillText(`${i + j + 1}. ${r.name}`.slice(0, 40), 175, y);
        ctx.textAlign = 'right';
        ctx.fillStyle = theme.primary;
        ctx.font = `600 26px ${SANS}`;
        ctx.fillText(r.right, W - 175, y);
      });
      footer(ctx, theme, label, ++pageNo);
      pages.push(c.toDataURL('image/jpeg', 0.9));
    }
  }

  // ---------- Trang kết ----------
  {
    const [c, ctx] = newPage(theme);
    heart(ctx, W / 2, 520, 160, theme.primary);
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.primary;
    ctx.font = `700 92px ${SCRIPT}`;
    ctx.fillText('Thank You', W / 2, 740);
    ctx.fillStyle = theme.text;
    ctx.font = `italic 400 36px ${SERIF}`;
    ctx.fillText('Cảm ơn vì đã là một phần trong câu chuyện của chúng tôi', W / 2, 820);
    ctx.font = `600 44px ${SERIF}`;
    ctx.fillText(couple, W / 2, 900);
    pages.push(c.toDataURL('image/jpeg', 0.9));
  }

  return pages;
}

export const WishAlbum: React.FC<WishAlbumProps> = ({ isOpen, onClose, invitation, wishes, rsvps, gifts, guests }) => {
  const [pages, setPages] = useState<string[]>([]);
  const [building, setBuilding] = useState(false);
  const [spread, setSpread] = useState(0); // trang đang mở
  const [flipping, setFlipping] = useState<'next' | 'prev' | null>(null);
  const [exporting, setExporting] = useState(false);

  const fileBase = useMemo(
    () =>
      `Album-Loi-Chuc-${(invitation.slug || invitation.id).replace(/[^a-z0-9-]/gi, '')}`,
    [invitation.slug, invitation.id]
  );

  useEffect(() => {
    if (!isOpen) return;
    setBuilding(true);
    setSpread(0);
    buildAlbumPages(invitation, wishes, rsvps, gifts, guests)
      .then(setPages)
      .catch((e) => {
        console.error(e);
        alert('Không tạo được album. Vui lòng thử lại.');
      })
      .finally(() => setBuilding(false));
  }, [isOpen, invitation, wishes, rsvps, gifts, guests]);

  if (!isOpen) return null;

  const flip = (d: 'next' | 'prev') => {
    if (flipping) return;
    if (d === 'next' && spread >= pages.length - 1) return;
    if (d === 'prev' && spread <= 0) return;
    setFlipping(d);
    setTimeout(() => {
      setSpread((s) => s + (d === 'next' ? 1 : -1));
      setFlipping(null);
    }, 650);
  };

  const downloadPage = (i: number) => {
    const a = document.createElement('a');
    a.href = pages[i];
    a.download = `${fileBase}-trang-${i + 1}.jpg`;
    a.click();
  };

  const downloadAllImages = async () => {
    for (let i = 0; i < pages.length; i++) {
      downloadPage(i);
      await new Promise((r) => setTimeout(r, 350));
    }
  };

  const downloadPdf = async () => {
    try {
      setExporting(true);
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [W, H], compress: true });
      pages.forEach((src, i) => {
        if (i > 0) pdf.addPage([W, H], 'portrait');
        pdf.addImage(src, 'JPEG', 0, 0, W, H);
      });
      pdf.save(`${fileBase}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Không xuất được PDF.');
    } finally {
      setExporting(false);
    }
  };

  const nextIdx = flipping === 'next' ? spread + 1 : flipping === 'prev' ? spread - 1 : spread;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-6">
      <style>{`
        .wa-book{perspective:2200px}
        .wa-page{position:absolute;inset:0;border-radius:10px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.45);backface-visibility:hidden;background:#fff}
        .wa-page img{width:100%;height:100%;object-fit:cover}
        @keyframes wa-next{from{transform:rotateY(0)}to{transform:rotateY(-180deg)}}
        @keyframes wa-prev{from{transform:rotateY(-180deg)}to{transform:rotateY(0)}}
        .wa-flip-next{transform-origin:left center;animation:wa-next .65s cubic-bezier(.45,.05,.35,1) forwards}
        .wa-flip-prev{transform-origin:left center;animation:wa-prev .65s cubic-bezier(.45,.05,.35,1) forwards}
        .wa-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.18),transparent 12%)}
      `}</style>
      <div className="w-full max-w-md flex items-center justify-between text-white mb-3">
        <h3 className="font-heading font-bold text-base flex items-center gap-2">
          <BookHeart className="w-5 h-5" /> Album Lời Chúc Kỷ Niệm
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-full bg-white/15 hover:bg-white/30 cursor-pointer" aria-label="Đóng">
          <X className="w-5 h-5" />
        </button>
      </div>

      {building ? (
        <div className="text-white text-sm flex items-center gap-2 py-24">
          <Loader2 className="w-5 h-5 animate-spin" /> Đang dàn trang album từ lời chúc, chữ ký & quà mừng…
        </div>
      ) : pages.length > 0 ? (
        <>
          <div
            className="wa-book relative w-[min(86vw,420px)]"
            style={{ aspectRatio: `${W} / ${H}` }}
            onTouchStart={(e) => ((e.currentTarget as any)._x = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - ((e.currentTarget as any)._x ?? 0);
              if (Math.abs(dx) > 40) flip(dx < 0 ? 'next' : 'prev');
            }}
          >
            {/* Trang bên dưới (đích đến) */}
            <div className="wa-page">
              <img src={pages[flipping === 'next' ? nextIdx : spread]} alt="" />
            </div>
            {/* Trang đang lật */}
            {flipping === 'next' && (
              <div className="wa-page wa-flip-next">
                <img src={pages[spread]} alt="" />
                <div className="wa-shade" />
              </div>
            )}
            {flipping === 'prev' && (
              <div className="wa-page wa-flip-prev">
                <img src={pages[nextIdx]} alt="" />
                <div className="wa-shade" />
              </div>
            )}
            <button
              onClick={() => flip('prev')}
              disabled={spread === 0}
              className="absolute -left-4 sm:-left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow disabled:opacity-30 cursor-pointer"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => flip('next')}
              disabled={spread >= pages.length - 1}
              className="absolute -right-4 sm:-right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow disabled:opacity-30 cursor-pointer"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/80 text-xs mt-3">
            Trang {spread + 1}/{pages.length} — vuốt hoặc bấm mũi tên để lật trang
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => downloadPage(spread)}
              className="px-3 py-2 rounded-xl bg-white text-[#453C45] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Tải trang này
            </button>
            <button
              onClick={downloadAllImages}
              className="px-3 py-2 rounded-xl bg-white text-[#453C45] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Tải tất cả ảnh
            </button>
            <button
              onClick={downloadPdf}
              disabled={exporting}
              className="px-3 py-2 rounded-xl bg-[#C76A82] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              Tải album PDF
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};
