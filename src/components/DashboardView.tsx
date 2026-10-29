import React, { useState, useEffect } from 'react';
import {
  Heart,
  Globe,
  Eye,
  Edit,
  Trash2,
  Plus,
  Share2,
  QrCode,
  Users,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Check,
  Sparkles,
  Copy,
  RefreshCw,
  Bell,
  Gift,
  BookHeart,
  Link2,
  ListPlus,
} from 'lucide-react';
import { WeddingInvitation, Guest, Order, User, Wish, RSVP, GiftRecord, OwnerNotification } from '../types/wedding';
import {
  buildGuestLink,
  fetchGifts,
  subscribeNotifications,
  markNotificationsRead,
  describeNotification,
} from '../utils/engagement';
import { fetchRsvps, fetchWishes } from '../utils/api';
import { WishAlbum } from './WishAlbum';
import { ProBanner, InviteGuestsButton, UpgradeProButton, OPEN_UPGRADE, OPEN_GUESTS } from './ProPromo';
import { FREE_GUEST_LIMIT, isPlanActive, daysLeft, PLAN_LABEL, effectivePlan } from '../data/planRules';
import { InvitationArtCard } from './templateArt/InvitationArtCard';
import {
  fetchInvitations,
  deleteInvitation,
  togglePublishInvitation,
  fetchGuests,
  createGuest,
  deleteGuest,
  fetchOrders,
  createOrder,
  pollOrderStatus,
  getCurrentUser,
} from '../utils/api';
import { formatDateVN, formatVND, generateQrDataUrl } from '../utils/formatters';

interface DashboardViewProps {
  currentUser: User;
  onEditInvitation: (inv: WeddingInvitation) => void;
  onNavigateToTemplates: () => void;
  onOpenPublicInvite: (slug: string) => void;
  onUserUpdated?: (user: User) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onEditInvitation,
  onNavigateToTemplates,
  onOpenPublicInvite,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'invitations' | 'guests' | 'wishes' | 'notifications' | 'orders'>(() => {
    try {
      const t = new URLSearchParams(window.location.search).get('tab');
      if (t === 'notifications' || t === 'wishes' || t === 'guests') return t;
    } catch {
      /* ignore */
    }
    return 'invitations';
  });
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [gifts, setGifts] = useState<GiftRecord[]>([]);
  const [notifications, setNotifications] = useState<OwnerNotification[]>([]);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkGroup, setBulkGroup] = useState<Guest['group']>('family');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [qrTitle, setQrTitle] = useState('Mã QR Thiệp Cưới');
  const [qrLink, setQrLink] = useState('');
  const [invitations, setInvitations] = useState<WeddingInvitation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Guest Management states
  const [selectedInvForGuests, setSelectedInvForGuests] = useState<string>('');
  const [guestGroupFilter, setGuestGroupFilter] = useState<string>('all');
  const [newGuestModalOpen, setNewGuestModalOpen] = useState(false);
  const [newGuestData, setNewGuestData] = useState({
    name: '',
    group: 'family' as any,
    phone: '',
    email: '',
    attendeesCount: 1,
    note: '',
  });

  // Upgrade Order state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<'premium' | 'luxury'>('premium');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [bankAccountInfo, setBankAccountInfo] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // QR Modal
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [qrSlug, setQrSlug] = useState<string>('');

  // Lời chúc, RSVP, quà mừng của thiệp đang chọn
  const loadEngagement = async (invId: string) => {
    if (!invId) return;
    const [w, r, g] = await Promise.all([
      fetchWishes(invId).catch(() => [] as Wish[]),
      fetchRsvps(invId).catch(() => [] as RSVP[]),
      fetchGifts(invId).catch(() => [] as GiftRecord[]),
    ]);
    setWishes(w);
    setRsvps(r);
    setGifts(g);
  };

  // Thông báo realtime: cập nhật ngay khi khách gửi lời chúc / RSVP / mừng cưới
  useEffect(() => {
    return subscribeNotifications(currentUser.id, setNotifications);
  }, [currentUser.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mở bảng nâng cấp / tab Mời Khách khi được gọi từ menu, banner, nút ở nơi khác
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('upgrade')) {
        setUpgradeModalOpen(true);
        setCreatedOrder(null);
      }
    } catch {
      /* ignore */
    }
    const up = () => {
      setUpgradeModalOpen(true);
      setCreatedOrder(null);
    };
    const gs = () => setActiveTab('guests');
    window.addEventListener(OPEN_UPGRADE, up);
    window.addEventListener(OPEN_GUESTS, gs);
    return () => {
      window.removeEventListener(OPEN_UPGRADE, up);
      window.removeEventListener(OPEN_GUESTS, gs);
    };
  }, []);

  const openGuestsFor = (invId: string) => {
    handleSelectInvForGuests(invId);
    setActiveTab('guests');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const invs = await fetchInvitations(currentUser.role === 'admin' ? undefined : currentUser.id);
      setInvitations(invs);
      if (invs.length > 0) {
        setSelectedInvForGuests(invs[0].id);
        const gstList = await fetchGuests(invs[0].id);
        setGuests(gstList);
        loadEngagement(invs[0].id);
      }
      const ords = await fetchOrders();
      setOrders(ords.filter(o => currentUser.role === 'admin' || o.userId === currentUser.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Handle invitation delete
  const handleDeleteInvitation = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thiệp cưới này không? Thao tác này không thể hoàn tác.')) return;
    try {
      await deleteInvitation(id);
      setInvitations(invitations.filter(i => i.id !== id));
    } catch (err) {
      alert('Không thể xóa thiệp');
    }
  };

  // Handle publish toggle
  const handleTogglePublish = async (id: string) => {
    try {
      const res = await togglePublishInvitation(id);
      setInvitations(invitations.map(i => (i.id === id ? res.invitation : i)));
    } catch (err) {
      alert('Không thể thay đổi trạng thái xuất bản');
    }
  };

  // Switch invitation for guest management
  const handleSelectInvForGuests = async (id: string) => {
    setSelectedInvForGuests(id);
    const gstList = await fetchGuests(id);
    setGuests(gstList);
    loadEngagement(id);
  };

  // Realtime: khi có thông báo mới của thiệp đang xem → làm mới danh sách khách & lời chúc
  const latestNotifId = notifications[0]?.id;
  useEffect(() => {
    if (!latestNotifId || !selectedInvForGuests) return;
    if (notifications[0].invitationId !== selectedInvForGuests) return;
    fetchGuests(selectedInvForGuests).then(setGuests).catch(() => {});
    loadEngagement(selectedInvForGuests);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestNotifId]);

  const selectedInv = invitations.find((i) => i.id === selectedInvForGuests);

  const copyGuestLink = (guest: Guest) => {
    if (!selectedInv) return;
    copyToClipboard(buildGuestLink(selectedInv, guest), `guest-${guest.id}`);
  };

  const showGuestQr = async (guest: Guest) => {
    if (!selectedInv) return;
    const link = buildGuestLink(selectedInv, guest);
    const qr = await generateQrDataUrl(link, selectedInv.design?.palette?.primary || '#C76A82');
    setQrTitle(`Thiệp mời riêng: ${guest.name}`);
    setQrLink(link);
    setQrSlug(`${selectedInv.slug}-${guest.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-')}`);
    setQrModalUrl(qr);
  };

  // Thêm nhiều khách: mỗi dòng 1 tên (có thể kèm ", SĐT")
  const handleBulkAdd = async () => {
    if (!selectedInvForGuests) return;
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    if (!guardGuestLimit(lines.length)) return;
    setBulkSaving(true);
    try {
      const added: Guest[] = [];
      for (const line of lines.slice(0, 300)) {
        const [name, phone] = line.split(/[,;\t]/).map((x) => x.trim());
        added.push(await createGuest(selectedInvForGuests, { name, phone: phone || '', group: bulkGroup, attendeesCount: 1 }));
      }
      setGuests((prev) => [...prev, ...added]);
      setBulkText('');
      setBulkOpen(false);
    } catch (err) {
      alert('Không thể thêm danh sách khách');
    } finally {
      setBulkSaving(false);
    }
  };

  const exportGuestLinks = () => {
    if (!selectedInv || guests.length === 0) return;
    const rows = guests.map((g) => `"${g.name}","${g.phone || ''}","${buildGuestLink(selectedInv, g)}"`);
    const csv = '\uFEFF' + ['Họ Tên,Điện Thoại,Link Thiệp Riêng', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Link-Thiep-Rieng-${selectedInv.slug}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Add guest
  /** Gói Free: tối đa 20 khách / thiệp. PRO, LUXURY hoặc thiệp đã thanh toán: không giới hạn. */
  const guestLimit = (): number => {
    const inv = invitations.find((i) => i.id === selectedInvForGuests);
    return isPlanActive(currentUser) || inv?.isPaid ? Infinity : FREE_GUEST_LIMIT;
  };
  const guardGuestLimit = (adding: number): boolean => {
    const limit = guestLimit();
    if (guests.length + adding > limit) {
      alert(`Gói Miễn Phí chỉ mời tối đa ${limit} khách cho mỗi thiệp (hiện có ${guests.length}). Nâng cấp gói PRO để mời không giới hạn.`);
      setUpgradeModalOpen(true);
      return false;
    }
    return true;
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvForGuests || !newGuestData.name.trim()) return;
    if (!guardGuestLimit(1)) return;
    try {
      const added = await createGuest(selectedInvForGuests, newGuestData);
      setGuests([...guests, added]);
      setNewGuestModalOpen(false);
      setNewGuestData({ name: '', group: 'family', phone: '', email: '', attendeesCount: 1, note: '' });
    } catch (err) {
      alert('Không thể thêm khách mời');
    }
  };

  // Delete guest
  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm('Xóa khách mời này khỏi danh sách?')) return;
    try {
      await deleteGuest(selectedInvForGuests, guestId);
      setGuests(guests.filter(g => g.id !== guestId));
    } catch (err) {
      alert('Lỗi xóa khách');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (guests.length === 0) return alert('Chưa có khách mời nào để xuất file');
    const headers = ['Họ Tên', 'Nhóm', 'Số Điện Thoại', 'Email', 'Trạng Thái RSVP', 'Số Khách Dự Kiến', 'Ghi Chú'];
    const rows = guests.map(g => [
      `"${g.name}"`,
      `"${g.group}"`,
      `"${g.phone || ''}"`,
      `"${g.email || ''}"`,
      `"${g.rsvpStatus === 'attending' ? 'Tham dự' : g.rsvpStatus === 'declined' ? 'Vắng mặt' : 'Chưa phản hồi'}"`,
      g.attendeesCount,
      `"${g.note || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh-Sach-Khach-Moi-${selectedInvForGuests}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open QR modal
  const handleShowQr = async (inv: WeddingInvitation) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thieponl.vn';
    const publicUrl = `${origin}/invite/${inv.slug}`;
    const qr = await generateQrDataUrl(publicUrl, inv.design.palette.primary);
    setQrTitle('Mã QR Thiệp Cưới');
    setQrLink(publicUrl);
    setQrModalUrl(qr);
    setQrSlug(inv.slug);
  };

  // Create Order for plan upgrade with dynamic VietQR details
  const handleCreateOrder = async (planId: 'premium' | 'luxury') => {
    try {
      const res = await createOrder(planId);
      setCreatedOrder(res.order);
      setBankAccountInfo(res.bankAccount);
      setOrders([res.order, ...orders]);
      setPaymentSuccess(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo đơn hàng');
    }
  };

  // Realtime Polling for Order Payment Confirmation
  useEffect(() => {
    if (!createdOrder || createdOrder.status === 'paid' || createdOrder.status === 'manual_approved') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const { order, isPaid } = await pollOrderStatus(createdOrder.id);
        if (isPaid) {
          setCreatedOrder(order);
          setPaymentSuccess(true);
          // Sync fresh user data (plan & expiry)
          const updated = await getCurrentUser();
          if (updated && onUserUpdated) {
            onUserUpdated(updated);
          }
          const freshOrders = await fetchOrders();
          setOrders(freshOrders);
          clearInterval(interval);
        }
      } catch {
        // Polling gracefully ignores transient errors
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [createdOrder, onUserUpdated]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Stats calculation
  const totalViews = invitations.reduce((sum, i) => sum + (i.viewsCount || 0), 0);
  const attendingGuestsCount = guests.filter(g => g.rsvpStatus === 'attending').length;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header & User welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E8B7C8]/25">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#C76A82] font-semibold block mb-1">
            Bảng Điều Khiển Của Bạn
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45] flex items-center gap-2 flex-wrap">
            <span>Xin chào, {currentUser.name}!</span>
            {currentUser.role === 'admin' && (
              <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white font-black text-xs tracking-wider uppercase shadow-xs">
                ADMIN
              </span>
            )}
          </h1>
          <p className="text-xs text-[#827580] mt-1">
            Quản lý thiệp cưới, theo dõi khách mời xác nhận (RSVP) và xuất bản trang cá nhân.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <InviteGuestsButton onClick={() => setActiveTab('guests')} />
          <UpgradeProButton
            user={currentUser}
            onClick={() => {
              setUpgradeModalOpen(true);
              setCreatedOrder(null);
            }}
          />
          <button
            onClick={onNavigateToTemplates}
            className="px-4 py-2 text-xs font-bold text-white bg-[#C76A82] hover:bg-[#B0596E] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo Thiệp Mới
          </button>
        </div>
      </div>

      <ProBanner
        user={currentUser}
        onUpgrade={() => {
          setUpgradeModalOpen(true);
          setCreatedOrder(null);
        }}
      />

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E8B7C8]/30 shadow-xs">
          <span className="text-xs text-[#827580] block mb-1">Tổng Số Thiệp</span>
          <span className="font-heading text-2xl font-bold text-[#453C45] tabular-nums">
            {invitations.length}
          </span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-[#E8B7C8]/30 shadow-xs">
          <span className="text-xs text-[#827580] block mb-1">Thiệp Đã Xuất Bản</span>
          <span className="font-heading text-2xl font-bold text-[#607B64] tabular-nums">
            {invitations.filter(i => i.status === 'published').length}
          </span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-[#E8B7C8]/30 shadow-xs">
          <span className="text-xs text-[#827580] block mb-1">Lượt Xem Thiệp</span>
          <span className="font-heading text-2xl font-bold text-[#C76A82] tabular-nums">
            {totalViews}
          </span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-[#E8B7C8]/30 shadow-xs">
          <span className="text-xs text-[#827580] block mb-1">Khách Đã Xác Nhận</span>
          <span className="font-heading text-2xl font-bold text-[#8A5A44] tabular-nums">
            {attendingGuestsCount} người
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-200">
        <div className="flex gap-8 text-sm font-semibold text-[#827580] overflow-x-auto">
          <button
            onClick={() => setActiveTab('invitations')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'invitations'
                ? 'border-b-2 border-[#C76A82] text-[#C76A82]'
                : 'hover:text-[#453C45]'
            }`}
          >
            <Heart className="w-4 h-4" />
            Thiệp Cưới Của Tôi ({invitations.length})
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'guests'
                ? 'border-b-2 border-[#C76A82] text-[#C76A82]'
                : 'hover:text-[#453C45]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className={activeTab === 'guests' ? '' : 'text-[#2F7D5B] font-extrabold'}>Mời Khách</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#2F7D5B] text-white text-[10px]">{guests.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('wishes')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'wishes' ? 'border-b-2 border-[#C76A82] text-[#C76A82]' : 'hover:text-[#453C45]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Lời Chúc & Quà Mừng
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'notifications' ? 'border-b-2 border-[#C76A82] text-[#C76A82]' : 'hover:text-[#453C45]'
            }`}
          >
            <Bell className="w-4 h-4" />
            Thông Báo
            {unreadCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-b-2 border-[#C76A82] text-[#C76A82]'
                : 'hover:text-[#453C45]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Lịch Sử Đơn Hàng ({orders.length})
          </button>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="pb-3 text-xs text-[#827580] hover:text-[#C76A82] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          title="Tải lại dữ liệu mới nhất từ máy chủ"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C76A82]' : ''}`} />
          <span className="hidden sm:inline">Làm mới dữ liệu</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: THIỆP CƯỚI CỦA TÔI                                  */}
      {/* ========================================================= */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          {invitations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 p-8 max-w-md mx-auto space-y-4">
              <Heart className="w-12 h-12 text-[#E8B7C8] mx-auto" />
              <h3 className="font-heading text-lg font-bold text-[#453C45]">Bạn chưa tạo thiệp cưới nào</h3>
              <p className="text-xs text-[#827580]">
                Hãy chọn một trong 22+ mẫu thiệp cưới pastel lãng mạn để bắt đầu nhé.
              </p>
              <button
                onClick={onNavigateToTemplates}
                className="px-4 py-2 bg-[#C76A82] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#B0596E] transition-colors"
              >
                Khám Phá Mẫu Thiệp Ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white rounded-2xl overflow-hidden border border-[#E8B7C8]/30 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Preview Image */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                      {!inv.coverImage && inv.design?.motif ? (
                        <div className="w-full h-full flex items-start justify-center" style={{ background: inv.design.motif.ground }}>
                          <InvitationArtCard
                            motif={inv.design.motif}
                            groomName={inv.groomName}
                            brideName={inv.brideName}
                            weddingDate={inv.weddingDate}
                            weddingTime={inv.weddingTime}
                            venueName={inv.venueName}
                            className="w-[56%] -mt-2"
                          />
                        </div>
                      ) : (
                        <img
                          src={inv.coverImage}
                          alt={inv.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            inv.status === 'published'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : inv.status === 'pending_payment'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : inv.status === 'expired'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-neutral-800/80 text-white backdrop-blur-xs'
                          }`}
                        >
                          {inv.status === 'published'
                            ? 'Đã xuất bản'
                            : inv.status === 'pending_payment'
                            ? 'Chờ thanh toán'
                            : inv.status === 'expired'
                            ? 'Hết hạn'
                            : 'Bản nháp'}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{inv.viewsCount || 0} lượt xem</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <span className="text-[11px] text-[#827580]">
                        Ngày cưới: {formatDateVN(inv.weddingDate)}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-[#453C45] truncate">
                        {inv.title}
                      </h3>
                      <p className="text-xs text-[#827580] truncate">
                        {inv.venueName} — {inv.venueAddress}
                      </p>

                      {/* Public Link Pill */}
                      {inv.status === 'published' && (
                        <div className="pt-1 flex items-center gap-1.5 text-xs text-[#C76A82]">
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <button
                            onClick={() => onOpenPublicInvite(inv.slug)}
                            className="truncate underline font-medium hover:text-[#B0596E] cursor-pointer"
                          >
                            thieponl.vn/invite/{inv.slug}
                          </button>
                        </div>
                      )}

                      {/* Pay on publish prompt for unpaid / pending cards */}
                      {inv.status !== 'published' && (
                        <button
                          onClick={() => onEditInvitation(inv)}
                          className="w-full mt-2 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-[#D4899C] to-[#C76A82] hover:from-[#C76A82] hover:to-[#B0596E] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{currentUser.role === 'admin' ? 'Xuất bản thiệp (Admin)' : 'Thanh toán để xuất bản'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-4 pt-1 pb-0">
                    <InviteGuestsButton size="md" className="w-full justify-center" onClick={() => openGuestsFor(inv.id)} />
                  </div>
                  <div className="p-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onEditInvitation(inv)}
                      className="flex-1 py-2 px-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-[#453C45] hover:bg-neutral-50 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#C76A82]" />
                      Chỉnh sửa
                    </button>

                    <button
                      onClick={() => handleShowQr(inv)}
                      className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 cursor-pointer"
                      title="Mã QR"
                    >
                      <QrCode className="w-4 h-4 text-[#C76A82]" />
                    </button>

                    <button
                      onClick={() => handleTogglePublish(inv.id)}
                      className={`p-2 rounded-xl border text-xs font-medium cursor-pointer ${
                        inv.status === 'published'
                          ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                      }`}
                      title={inv.status === 'published' ? 'Đổi về bản nháp' : 'Xuất bản thiệp'}
                    >
                      <Globe className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteInvitation(inv.id)}
                      className="p-2 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 cursor-pointer"
                      title="Xóa thiệp"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: QUẢN LÝ KHÁCH MỜI & RSVP                            */}
      {/* ========================================================= */}
      {activeTab === 'guests' && (
        <div className="space-y-6">
          {/* Invitation Selector & CSV export */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#827580] whitespace-nowrap">Chọn thiệp cưới:</span>
              <select
                value={selectedInvForGuests}
                onChange={(e) => handleSelectInvForGuests(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-neutral-300 font-medium"
              >
                {invitations.map(i => (
                  <option key={i.id} value={i.id}>{i.title}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportGuestLinks}
                className="px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-semibold text-[#453C45] hover:bg-neutral-50 flex items-center gap-1.5 cursor-pointer"
                title="Xuất danh sách link thiệp riêng để gửi Zalo/SMS"
              >
                <Link2 className="w-3.5 h-3.5" />
                Xuất Link Riêng
              </button>
              <button
                onClick={() => setBulkOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-semibold text-[#453C45] hover:bg-neutral-50 flex items-center gap-1.5 cursor-pointer"
              >
                <ListPlus className="w-3.5 h-3.5" />
                Thêm Nhiều Khách
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-semibold text-[#453C45] hover:bg-neutral-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất File CSV
              </button>
              <button
                onClick={() => setNewGuestModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#C76A82] text-white text-xs font-bold hover:bg-[#B0596E] flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm Khách Mới {guestLimit() !== Infinity && `(${guests.length}/${FREE_GUEST_LIMIT})`}
              </button>
            </div>
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'Tất cả khách' },
              { id: 'family', label: 'Gia đình, họ hàng' },
              { id: 'groom_friends', label: 'Bạn bè chú rể' },
              { id: 'bride_friends', label: 'Bạn bè cô dâu' },
              { id: 'colleagues', label: 'Đồng nghiệp' },
            ].map(g => (
              <button
                key={g.id}
                onClick={() => setGuestGroupFilter(g.id)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer border ${
                  guestGroupFilter === g.id
                    ? 'bg-[#453C45] text-white border-[#453C45]'
                    : 'bg-white text-[#827580] border-neutral-200 hover:border-[#C76A82]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Guest Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F5] border-b border-neutral-200 text-[#827580] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Khách Mời</th>
                    <th className="py-3 px-4">Nhóm</th>
                    <th className="py-3 px-4">Điện Thoại</th>
                    <th className="py-3 px-4">Trạng Thái RSVP</th>
                    <th className="py-3 px-4">Số Người</th>
                    <th className="py-3 px-4">Đã Xem / Mừng</th>
                    <th className="py-3 px-4">Link Riêng & QR</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-[#453C45]">
                  {guests
                    .filter(g => guestGroupFilter === 'all' || g.group === guestGroupFilter)
                    .map((guest) => (
                      <tr key={guest.id} className="hover:bg-neutral-50/70">
                        <td className="py-3 px-4 font-semibold">{guest.name}</td>
                        <td className="py-3 px-4 text-neutral-500 capitalize">
                          {guest.group === 'family' ? 'Họ hàng' : guest.group === 'colleagues' ? 'Đồng nghiệp' : 'Bạn bè'}
                        </td>
                        <td className="py-3 px-4 font-mono">{guest.phone || '—'}</td>
                        <td className="py-3 px-4">
                          {guest.rsvpStatus === 'attending' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Sẽ tham dự
                            </span>
                          ) : guest.rsvpStatus === 'declined' ? (
                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                              <XCircle className="w-3 h-3" /> Vắng mặt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                              <Clock className="w-3 h-3" /> Chờ phản hồi
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">{guest.attendeesCount}</td>
                        <td className="py-3 px-4 text-[#827580] whitespace-nowrap">
                          {guest.lastViewedAt ? (
                            <span title={new Date(guest.lastViewedAt).toLocaleString('vi-VN')} className="inline-flex items-center gap-1 text-[#607B64]">
                              <Eye className="w-3 h-3" /> {guest.viewCount || 1} lần
                            </span>
                          ) : (
                            <span className="text-neutral-400">Chưa mở</span>
                          )}
                          {guest.giftSent && (
                            <span className="ml-2 inline-flex items-center gap-0.5 text-[#B6925B]" title="Đã báo gửi quà mừng">
                              <Gift className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => copyGuestLink(guest)}
                              disabled={selectedInv?.status !== 'published'}
                              className="px-2 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                              title={selectedInv?.status === 'published' ? 'Sao chép link thiệp riêng' : 'Xuất bản thiệp để gửi link'}
                            >
                              {copiedKey === `guest-${guest.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              {copiedKey === `guest-${guest.id}` ? 'Đã chép' : 'Link'}
                            </button>
                            <button
                              onClick={() => showGuestQr(guest)}
                              disabled={selectedInv?.status !== 'published'}
                              className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer disabled:opacity-40"
                              title="Mã QR thiệp riêng"
                            >
                              <QrCode className="w-3.5 h-3.5 text-[#C76A82]" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {guests.length === 0 && (
              <div className="text-center py-12 text-[#827580] text-xs">
                Chưa có khách mời nào trong danh sách. Bấm "Thêm Khách Mới" để bắt đầu ghi nhận.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: LỜI CHÚC & QUÀ MỪNG                                    */}
      {/* ========================================================= */}
      {activeTab === 'wishes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#827580] whitespace-nowrap">Chọn thiệp cưới:</span>
              <select
                value={selectedInvForGuests}
                onChange={(e) => handleSelectInvForGuests(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-neutral-300 font-medium"
              >
                {invitations.map((i) => (
                  <option key={i.id} value={i.id}>{i.title}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setAlbumOpen(true)}
              disabled={!selectedInv}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4899C] to-[#C76A82] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <BookHeart className="w-4 h-4" />
              Tạo Album Lời Chúc Kỷ Niệm
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['Lời chúc', wishes.length],
              ['Xác nhận tham dự', rsvps.filter((r) => r.isAttending).length],
              ['Báo vắng', rsvps.filter((r) => !r.isAttending).length],
              ['Quà mừng', gifts.length],
            ].map(([l, n]) => (
              <div key={l as string} className="p-4 bg-white rounded-2xl border border-[#E8B7C8]/30">
                <span className="text-xs text-[#827580] block">{l}</span>
                <span className="font-heading text-2xl font-bold text-[#453C45] tabular-nums">{n}</span>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
              <div className="p-4 border-b border-neutral-100 font-heading font-bold text-sm text-[#453C45]">Sổ lưu bút ({wishes.length})</div>
              <div className="divide-y divide-neutral-100 max-h-[520px] overflow-y-auto">
                {wishes.length === 0 ? (
                  <p className="p-6 text-center text-xs text-[#827580]">Chưa có lời chúc nào.</p>
                ) : (
                  wishes.map((w) => (
                    <div key={w.id} className="p-4 text-xs space-y-1">
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold text-[#453C45]">{w.senderName}</span>
                        <span className="text-[#827580]">{formatDateVN(w.createdAt)}</span>
                      </div>
                      <p className="text-[#453C45] leading-relaxed">"{w.message}"</p>
                      {w.signature && <img src={w.signature} alt="Chữ ký" className="max-h-12 w-auto" />}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
              <div className="p-4 border-b border-neutral-100 font-heading font-bold text-sm text-[#453C45] flex justify-between">
                <span>Quà mừng đã nhận ({gifts.length})</span>
                <span className="text-[#B6925B]">{formatVND(gifts.reduce((s, g) => s + (g.amount || 0), 0))}</span>
              </div>
              <div className="divide-y divide-neutral-100 max-h-[520px] overflow-y-auto">
                {gifts.length === 0 ? (
                  <p className="p-6 text-center text-xs text-[#827580]">Chưa có khách báo gửi quà mừng.</p>
                ) : (
                  gifts.map((g) => (
                    <div key={g.id} className="p-4 text-xs flex justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#453C45] flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5 text-[#B6925B]" /> {g.senderName}
                        </p>
                        {g.message && <p className="text-[#827580] mt-0.5">{g.message}</p>}
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="font-bold text-[#453C45]">{g.amount ? formatVND(g.amount) : '—'}</p>
                        <p className="text-[#827580]">{formatDateVN(g.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: THÔNG BÁO REALTIME                                     */}
      {/* ========================================================= */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-[#453C45] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#C76A82]" /> Hoạt động của khách mời (cập nhật tức thì)
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markNotificationsRead(notifications.filter((n) => !n.read).map((n) => n.id))}
                className="text-xs text-[#C76A82] hover:underline cursor-pointer"
              >
                Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>
          <div className="divide-y divide-neutral-100">
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-xs text-[#827580]">
                Chưa có thông báo. Khi khách mở thiệp, gửi lời chúc, xác nhận tham dự hoặc mừng cưới, bạn sẽ nhận được ngay tại đây.
              </p>
            ) : (
              notifications.map((n) => {
                const d = describeNotification(n);
                const Icon = n.type === 'gift' ? Gift : n.type === 'wish' ? MessageSquare : n.type === 'rsvp' ? CheckCircle2 : Eye;
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markNotificationsRead([n.id])}
                    className={`w-full text-left p-4 flex gap-3 text-xs hover:bg-neutral-50 cursor-pointer ${n.read ? '' : 'bg-[#FFF5F8]'}`}
                  >
                    <span className="w-8 h-8 rounded-full bg-[#F6DCE5] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#C76A82]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-[#453C45] ${n.read ? '' : 'font-bold'}`}>{d.title}</span>
                      {d.body && <span className="block text-[#827580] truncate">{d.body}</span>}
                      <span className="block text-[10px] text-neutral-400 mt-0.5">
                        {new Date(n.createdAt).toLocaleString('vi-VN')} • {n.invitationTitle}
                      </span>
                    </span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {selectedInv && (
        <WishAlbum
          isOpen={albumOpen}
          onClose={() => setAlbumOpen(false)}
          invitation={selectedInv}
          wishes={wishes}
          rsvps={rsvps}
          gifts={gifts}
          guests={guests}
        />
      )}

      {/* Thêm nhiều khách */}
      {bulkOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-3 text-xs">
            <h3 className="font-heading font-bold text-base text-[#453C45]">Thêm Nhiều Khách Mời</h3>
            <p className="text-[#827580]">Mỗi dòng một khách. Có thể thêm số điện thoại sau dấu phẩy. Mỗi khách sẽ có link & QR riêng.</p>
            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'Anh Nguyễn Văn An, 0912345678\nChị Trần Thu Hà\nGia đình chú Tư'}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm"
            />
            <select
              value={bulkGroup}
              onChange={(e) => setBulkGroup(e.target.value as Guest['group'])}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300"
            >
              <option value="family">Họ hàng, gia đình</option>
              <option value="groom_friends">Bạn chú rể</option>
              <option value="bride_friends">Bạn cô dâu</option>
              <option value="colleagues">Đồng nghiệp</option>
              <option value="other">Khác</option>
            </select>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setBulkOpen(false)} className="flex-1 py-2 rounded-xl border border-neutral-300 font-semibold text-[#827580]">
                Hủy
              </button>
              <button
                onClick={handleBulkAdd}
                disabled={bulkSaving}
                className="flex-1 py-2 rounded-xl bg-[#C76A82] text-white font-bold hover:bg-[#B0596E] disabled:opacity-60"
              >
                {bulkSaving ? 'Đang thêm…' : `Thêm ${bulkText.split('\n').filter((l) => l.trim()).length} khách`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: LỊCH SỬ ĐƠN HÀNG & NÂNG CẤP                         */}
      {/* ========================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-[#827580] uppercase tracking-wider font-semibold block">Gói hiện tại</span>
              <h3 className="font-heading text-xl font-bold text-[#453C45] capitalize mt-0.5">
                Gói {currentUser.plan.toUpperCase()}
              </h3>
              <p className="text-xs text-[#827580] mt-1">
                {currentUser.plan === 'luxury'
                  ? 'Bạn đang sở hữu quyền lợi cao cấp nhất không giới hạn.'
                  : 'Nâng cấp lên gói Premium hoặc Luxury để mở khóa đầy đủ mẫu thiệp và RSVP.'}
              </p>
            </div>
            {currentUser.plan !== 'luxury' && (
              <button
                onClick={() => {
                  setUpgradeModalOpen(true);
                  setCreatedOrder(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#C76A82] text-white text-xs font-bold hover:bg-[#B0596E] transition-colors shadow-xs"
              >
                Nâng Cấp Gói Dịch Vụ
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-neutral-100">
              <h3 className="font-heading font-bold text-sm text-[#453C45]">Lịch Sử Đơn Hàng & Chuyển Khoản</h3>
            </div>
            <div className="divide-y divide-neutral-100 text-xs">
              {orders.length === 0 ? (
                <p className="p-6 text-center text-[#827580]">Chưa có đơn hàng nào.</p>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#453C45]">Mã đơn: #{ord.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ord.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {ord.status === 'completed' ? 'Đã kích hoạt' : 'Chờ xác nhận'}
                        </span>
                      </div>
                      <p className="text-[#827580] mt-0.5">
                        Nâng cấp gói: <strong>{ord.planId.toUpperCase()}</strong> — {formatVND(ord.amount)}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Mã tham chiếu: <span className="font-mono">{ord.bankReference}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-[#827580] block">
                        Ngày tạo: {formatDateVN(ord.createdAt)}
                      </span>
                      {ord.proofNote && (
                        <span className="text-[11px] text-neutral-500 italic block mt-0.5">
                          {ord.proofNote}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Guest Modal */}
      {newGuestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-heading font-bold text-base text-[#453C45]">Thêm Khách Mời Mới</h3>
            <form onSubmit={handleAddGuest} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#453C45] mb-1">Họ Tên Khách Mời *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Anh Nguyễn Tuấn Kiệt"
                  value={newGuestData.name}
                  onChange={(e) => setNewGuestData({ ...newGuestData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#453C45] mb-1">Nhóm Khách</label>
                  <select
                    value={newGuestData.group}
                    onChange={(e) => setNewGuestData({ ...newGuestData, group: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                  >
                    <option value="family">Họ hàng, gia đình</option>
                    <option value="groom_friends">Bạn chú rể</option>
                    <option value="bride_friends">Bạn cô dâu</option>
                    <option value="colleagues">Đồng nghiệp</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#453C45] mb-1">Số Người Dự Kiến</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newGuestData.attendeesCount}
                    onChange={(e) => setNewGuestData({ ...newGuestData, attendeesCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#453C45] mb-1">Số Điện Thoại (tùy chọn)</label>
                <input
                  type="tel"
                  placeholder="0912 345 678"
                  value={newGuestData.phone}
                  onChange={(e) => setNewGuestData({ ...newGuestData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#453C45] mb-1">Ghi Chú</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bàn tiệc VIP số 3..."
                  value={newGuestData.note}
                  onChange={(e) => setNewGuestData({ ...newGuestData, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewGuestModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-neutral-300 font-semibold text-[#827580]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#C76A82] text-white font-bold hover:bg-[#B0596E]"
                >
                  Lưu Khách Mời
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal with VietQR Payment Flow */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="font-heading font-bold text-lg text-[#453C45]">Nâng Cấp Gói Dịch Vụ THIEPONL</h3>
              <button onClick={() => setUpgradeModalOpen(false)} className="text-neutral-400 p-1">
                ✕
              </button>
            </div>

            {paymentSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="font-heading text-xl font-bold text-[#453C45]">
                  🎉 Kích Hoạt Gói Thành Công!
                </h4>
                <p className="text-xs text-[#827580] leading-relaxed max-w-sm mx-auto">
                  Hệ thống đã ghi nhận thanh toán thành công qua SePay TPBank. Tài khoản của bạn đã được nâng cấp lên gói{' '}
                  <strong className="text-[#C76A82] uppercase">{createdOrder?.planId}</strong> (thời hạn 12 tháng).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setUpgradeModalOpen(false);
                    setPaymentSuccess(false);
                    setCreatedOrder(null);
                  }}
                  className="w-full py-3 rounded-xl bg-[#C76A82] text-white text-xs font-bold hover:bg-[#B0596E] shadow-sm cursor-pointer"
                >
                  Bắt Đầu Sáng Tạo Thiệp Ngay
                </button>
              </div>
            ) : !createdOrder ? (
              <div className="space-y-4">
                <p className="text-xs text-[#827580]">
                  Chọn gói dịch vụ để mở khóa toàn bộ quyền lợi thiệp cưới và tính năng AI Wedding Designer:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setSelectedUpgradePlan('premium')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedUpgradePlan === 'premium'
                        ? 'border-[#C76A82] bg-[#F6DCE5]/20 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-[#C76A82] uppercase block">Gói PRO · 15 ngày</span>
                    <span className="font-heading text-lg font-bold text-[#453C45] block mt-1">299.000 đ</span>
                    <p className="text-[11px] text-[#827580] mt-1">Mở mẫu HOT & toàn bộ mẫu, không giới hạn khách mời.</p>
                  </div>

                  <div
                    onClick={() => setSelectedUpgradePlan('luxury')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedUpgradePlan === 'luxury'
                        ? 'border-[#B6925B] bg-[#E9D8BD]/20 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-[#B6925B] uppercase block">Gói LUXURY · 3 tháng</span>
                    <span className="font-heading text-lg font-bold text-[#453C45] block mt-1">599.000 đ</span>
                    <p className="text-[11px] text-[#827580] mt-1">Toàn bộ quyền lợi PRO, gia hạn sử dụng 3 tháng.</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCreateOrder(selectedUpgradePlan)}
                  className="w-full py-3 rounded-xl bg-[#C76A82] text-white text-xs font-bold hover:bg-[#B0596E] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  Tiếp Tục Chuyển Khoản VietQR
                </button>
              </div>
            ) : (
              /* Dynamic VietQR Payment Display with Realtime Polling */
              <div className="space-y-4 text-center">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between">
                  <span>Đơn hàng: <strong>#{createdOrder.id}</strong> ({createdOrder.planId.toUpperCase()})</span>
                  <span className="text-[11px] text-emerald-600 font-bold">{formatVND(createdOrder.amount)}</span>
                </div>

                {/* Dynamic VietQR */}
                <div className="w-56 sm:w-64 mx-auto p-2 bg-[#FFFBF7] rounded-2xl border border-neutral-300 shadow-sm flex flex-col items-center justify-center">
                  <img
                    src={bankAccountInfo?.vietQrUrl || `https://qr.sepay.vn/img?acc=87583868888&bank=TPBank&amount=${createdOrder.amount}&des=${createdOrder.bankReference}&template=compact`}
                    alt={`VietQR TPBank ${createdOrder.bankReference}`}
                    className="w-full h-auto max-h-68 object-contain rounded-xl"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 font-medium">Quét mã bằng App Ngân Hàng hoặc MoMo/ZaloPay</span>
                </div>

                {/* Bank Account Details with Copy Buttons */}
                <div className="bg-neutral-50 p-3.5 rounded-xl text-left text-xs space-y-2 border border-neutral-200">
                  <div className="flex justify-between items-center">
                    <span className="text-[#827580]">Ngân hàng:</span>
                    <span className="font-semibold text-[#453C45]">TPBank (Ngân Hàng Tiên Phong)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#827580]">Chủ tài khoản:</span>
                    <span className="font-bold text-[#453C45] uppercase">TRAN MINH TIEN</span>
                  </div>
                  
                  {/* Account number with Copy */}
                  <div className="flex justify-between items-center">
                    <span className="text-[#827580]">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-base text-[#C76A82]">8758 3868 888</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('87583868888', 'acc')}
                        className="p-1 text-neutral-500 hover:text-[#C76A82] rounded bg-white border border-neutral-200 shadow-2xs cursor-pointer"
                        title="Sao chép số tài khoản"
                      >
                        {copiedKey === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Amount with Copy */}
                  <div className="flex justify-between items-center">
                    <span className="text-[#827580]">Số tiền:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-700">{formatVND(createdOrder.amount)}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(String(createdOrder.amount), 'amt')}
                        className="p-1 text-neutral-500 hover:text-[#C76A82] rounded bg-white border border-neutral-200 shadow-2xs cursor-pointer"
                        title="Sao chép số tiền"
                      >
                        {copiedKey === 'amt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Reference Note with Copy */}
                  <div className="flex justify-between items-center">
                    <span className="text-[#827580]">Nội dung CK:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[#453C45] bg-yellow-100 px-2 py-0.5 rounded border border-yellow-200">
                        {createdOrder.bankReference}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(createdOrder.bankReference, 'ref')}
                        className="p-1 text-neutral-500 hover:text-[#C76A82] rounded bg-white border border-neutral-200 shadow-2xs cursor-pointer"
                        title="Sao chép nội dung chuyển khoản"
                      >
                        {copiedKey === 'ref' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Realtime Waiting Indicator */}
                <div className="flex items-center justify-center gap-2 p-2 bg-rose-50 text-[#C76A82] rounded-xl text-xs font-medium">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C76A82] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C76A82]"></span>
                  </span>
                  <span>Đang tự động theo dõi chuyển khoản SePay...</span>
                </div>

                <p className="text-[11px] text-[#827580] leading-relaxed">
                  Gói dịch vụ sẽ tự động kích hoạt ngay khi ngân hàng nhận tiền (thường 5 - 30 giây). Bạn không cần bấm xác nhận gì thêm.
                </p>

                <button
                  type="button"
                  onClick={() => setUpgradeModalOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-[#453C45] hover:bg-neutral-50 cursor-pointer"
                >
                  Đóng (Hệ thống vẫn tiếp tục kích hoạt ngầm)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code Sharing Modal */}
      {qrModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <h3 className="font-heading font-bold text-base text-[#453C45]">{qrTitle}</h3>
            <p className="text-xs text-[#827580]">
              Quét mã bằng Zalo hoặc Camera để mở thiệp.
            </p>
            {qrLink && (
              <button
                onClick={() => copyToClipboard(qrLink, 'qr-link')}
                className="w-full text-[11px] font-mono text-[#C76A82] bg-[#FFFBF7] border border-[#E8B7C8]/40 rounded-lg px-2 py-1.5 truncate cursor-pointer"
                title="Sao chép link"
              >
                {copiedKey === 'qr-link' ? 'Đã sao chép link!' : qrLink}
              </button>
            )}
            <div className="w-56 h-56 mx-auto p-2 bg-[#FFFBF7] rounded-xl border border-[#E8B7C8]/40 shadow-inner flex items-center justify-center">
              <img src={qrModalUrl} alt="QR Code" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <a
                href={qrModalUrl}
                download={`QR-ThiepCuoi-${qrSlug}.png`}
                className="flex-1 py-2 rounded-xl bg-[#C76A82] text-white text-xs font-bold hover:bg-[#B0596E]"
              >
                Tải Ảnh QR
              </a>
              <button
                onClick={() => setQrModalUrl(null)}
                className="flex-1 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-[#453C45]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
