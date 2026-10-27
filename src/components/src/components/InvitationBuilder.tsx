import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Globe,
  Smartphone,
  Monitor,
  Eye,
  Undo2,
  Redo2,
  Share2,
  QrCode,
  Sparkles,
  Heart,
  Palette,
  Calendar,
  Users,
  Image as ImageIcon,
  Check,
  Plus,
  Trash2,
  ChevronRight,
  ExternalLink,
  Gift,
  Loader2,
  AlertCircle,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { WeddingInvitation, DesignConfig, User, Order } from '../types/wedding';
import { PublicInvitationView } from './PublicInvitationView';
import { WatermarkOverlay } from './WatermarkOverlay';
import { PublishPlanModal } from './PublishPlanModal';
import { PaymentModal } from './PaymentModal';
import { PublishedSuccessModal } from './PublishedSuccessModal';
import {
  createInvitation,
  updateInvitation,
  togglePublishInvitation,
  createOrder,
  adminPublishInvitation,
  publishInvitation,
  isAdminUser,
  getFreeTrialStatus,
} from '../utils/api';
import { upsertPreview, buildPreviewLink } from '../utils/engagement';
import { MusicPicker } from './MusicPicker';
import { GalleryEffectPicker } from './GalleryEffectPicker';
import { auth } from '../firebase';
import { generateQrDataUrl } from '../utils/formatters';
import { uploadImageToStorage, uploadImagesBatch } from '../utils/imageUpload';

interface InvitationBuilderProps {
  initialInvitation: WeddingInvitation;
  onSaveSuccess?: (inv: WeddingInvitation) => void;
  onOpenAIDesigner?: () => void;
  onNavigateBack?: () => void;
  currentUser?: User | null;
  onRequireAuth?: () => void;
  onNavigate?: (view: string, params?: any) => void;
}

export const InvitationBuilder: React.FC<InvitationBuilderProps> = ({
  initialInvitation,
  onSaveSuccess,
  onOpenAIDesigner,
  onNavigateBack,
  currentUser,
  onRequireAuth,
  onNavigate,
}) => {
  const [invitation, setInvitation] = useState<WeddingInvitation>(initialInvitation);
  const [history, setHistory] = useState<WeddingInvitation[]>([initialInvitation]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [activeTab, setActiveTab] = useState<'info' | 'time_place' | 'style' | 'sections' | 'gift'>('info');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  // Autosave and persistence state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'unsaved' | 'error'>('saved');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Uploading state
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [galleryProgress, setGalleryProgress] = useState<{ done: number; total: number } | null>(null);
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);

  // Modals & Workflow state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [previewQrUrl, setPreviewQrUrl] = useState('');
  const [previewLink, setPreviewLink] = useState('');
  const [previewQrLoading, setPreviewQrLoading] = useState(false);
  const [freeTrialAvailable, setFreeTrialAvailable] = useState(true);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  // Publish & Payment workflow state
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [publishedSuccessModalOpen, setPublishedSuccessModalOpen] = useState(false);
  const [adminCompletionModalOpen, setAdminCompletionModalOpen] = useState(false);
  const [adminAssignedPlan, setAdminAssignedPlan] = useState<'free' | 'premium' | 'luxury'>('premium');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [bankAccountInfo, setBankAccountInfo] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Refs for autosave debounce & state tracking
  const autoSaveTimerRef = useRef<any>(null);
  const invitationRef = useRef<WeddingInvitation>(invitation);
  invitationRef.current = invitation;
  const isSavingRef = useRef<boolean>(false);

  // Push state to undo/redo history & trigger 2s debounced autosave
  const updateState = (updater: (prev: WeddingInvitation) => WeddingInvitation) => {
    setInvitation((prev) => {
      const next = updater(prev);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(next);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return next;
    });

    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
    setSaveErrorMessage(null);

    // 2-second debounced autosave
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      performSave();
    }, 2000);
  };

  // Perform save to Firestore (handles both new draft creation & existing doc update)
  const performSave = async (overrideStatus?: 'draft' | 'published'): Promise<WeddingInvitation | null> => {
    if (isSavingRef.current) return null;
    isSavingRef.current = true;
    setSaveStatus('saving');
    setSaveErrorMessage(null);

    const current = invitationRef.current;
    const targetStatus = overrideStatus || current.status || 'draft';
    const isDraftNew = current.id.startsWith('draft-');

    try {
      const payload: Partial<WeddingInvitation> = {
        ...current,
        status: targetStatus,
      };

      let saved: WeddingInvitation;
      if (isDraftNew) {
        // First explicit save or autosave: create document in Firestore
        // Remove temporary client-side draft ID so backend assigns clean ID
        const { id, ...createPayload } = payload;
        saved = await createInvitation(createPayload);
        // Update URL to match real persisted ID
        window.history.replaceState({}, '', `/builder/${saved.id}`);
      } else {
        // Update existing document in Firestore
        saved = await updateInvitation(current.id, payload);
      }

      setInvitation(saved);
      invitationRef.current = saved;
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      setSaveErrorMessage(null);

      if (onSaveSuccess) {
        onSaveSuccess(saved);
      }

      return saved;
    } catch (err: any) {
      console.error('Detailed save error in InvitationBuilder:', err);
      const errorMsg = err?.message || 'Lỗi khi lưu thiệp cưới lên máy chủ.';
      setSaveStatus('error');
      setSaveErrorMessage(errorMsg);
      return null;
    } finally {
      isSavingRef.current = false;
    }
  };

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Browser beforeunload protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges || saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = 'Bạn có thay đổi chưa được lưu vào hệ thống. Bạn có chắc chắn muốn rời đi?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, saveStatus]);

  // Handle explicit Save button click
  const handleManualSave = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    const saved = await performSave();
    if (saved) {
      setSaveToast('Đã lưu thiệp cưới thành công!');
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  // Handle Complete (Hoàn thành) Workflow
  const handleCompleteWorkflow = async () => {
    // 1. Mandatory Fields Validation
    if (!invitation.groomName || !invitation.groomName.trim()) {
      setSaveToast('Vui lòng nhập tên Chú Rể trước khi hoàn thành');
      setActiveTab('info');
      setTimeout(() => {
        const el = document.getElementById('input-groom-name');
        if (el) el.focus();
      }, 100);
      return;
    }
    if (!invitation.brideName || !invitation.brideName.trim()) {
      setSaveToast('Vui lòng nhập tên Cô Dâu trước khi hoàn thành');
      setActiveTab('info');
      setTimeout(() => {
        const el = document.getElementById('input-bride-name');
        if (el) el.focus();
      }, 100);
      return;
    }
    if (!invitation.weddingDate || !invitation.weddingDate.trim()) {
      setSaveToast('Vui lòng chọn Ngày cưới trước khi hoàn thành');
      setActiveTab('time_place');
      setTimeout(() => {
        const el = document.getElementById('input-wedding-date');
        if (el) el.focus();
      }, 100);
      return;
    }
    if (!invitation.weddingTime || !invitation.weddingTime.trim()) {
      setSaveToast('Vui lòng nhập Giờ tổ chức hôn lễ');
      setActiveTab('time_place');
      setTimeout(() => {
        const el = document.getElementById('input-wedding-time');
        if (el) el.focus();
      }, 100);
      return;
    }
    if (!invitation.venueName?.trim() && !invitation.venueAddress?.trim()) {
      setSaveToast('Vui lòng nhập Địa điểm hoặc Nơi tổ chức tiệc cưới');
      setActiveTab('time_place');
      setTimeout(() => {
        const el = document.getElementById('input-venue-name');
        if (el) el.focus();
      }, 100);
      return;
    }

    // 2. Auth Guard
    if (!auth.currentUser && !currentUser) {
      setSaveToast('Vui lòng đăng nhập Google để lưu và xuất bản thiệp');
      if (onRequireAuth) onRequireAuth();
      return;
    }

    // 3. Save latest changes
    const saved = await performSave();
    if (!saved) {
      setSaveToast('Lỗi lưu bản nháp. Vui lòng kiểm tra lại kết nối mạng.');
      return;
    }

    // 4. Admin Privilege Check
    const isAdmin = currentUser?.role === 'admin' || isAdminUser(currentUser?.email || auth.currentUser?.email);
    if (isAdmin) {
      setAdminCompletionModalOpen(true);
      return;
    }

    // 5. Existing Active Paid Plan Check
    if (currentUser?.plan === 'premium' || currentUser?.plan === 'luxury') {
      try {
        setIsPublishing(true);
        const published = await publishInvitation(saved.id);
        setInvitation(published);
        invitationRef.current = published;
        if (onSaveSuccess) onSaveSuccess(published);
        setPublishedSuccessModalOpen(true);
      } catch (err: any) {
        alert(err.message || 'Lỗi xuất bản thiệp');
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    // 6. Regular User without active plan: kiểm tra lượt miễn phí rồi mở modal chọn gói
    const freeStatus = await getFreeTrialStatus(saved.id);
    setFreeTrialAvailable(freeStatus.available);
    setPlanModalOpen(true);
  };

  const handleSelectPlan = async (planId: 'free' | 'premium' | 'luxury') => {
    setPlanModalOpen(false);

    if (planId === 'free') {
      try {
        setIsPublishing(true);
        const published = await publishInvitation(invitation.id);
        setInvitation(published);
        invitationRef.current = published;
        if (onSaveSuccess) onSaveSuccess(published);
        setPublishedSuccessModalOpen(true);
      } catch (err: any) {
        alert(err.message || 'Không thể xuất bản gói miễn phí');
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    // Paid Plan -> Create Order with invitationId and open SePay Payment Modal
    try {
      setIsPublishing(true);
      const res = await createOrder(
        planId,
        invitation.id,
        invitation.title,
        invitation.slug
      );
      setCreatedOrder(res.order);
      setBankAccountInfo(res.bankAccount);
      setPaymentModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo đơn hàng thanh toán SePay');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePaymentSuccess = (paidOrder: Order) => {
    setPaymentModalOpen(false);
    const now = new Date().toISOString();
    setInvitation((prev) => ({
      ...prev,
      status: 'published',
      isPaid: true,
      selectedPlanId: paidOrder.planId,
      orderId: paidOrder.id,
      publishedAt: now,
    }));
    invitationRef.current = {
      ...invitationRef.current,
      status: 'published',
      isPaid: true,
      selectedPlanId: paidOrder.planId,
      orderId: paidOrder.id,
      publishedAt: now,
    };
    if (onSaveSuccess) onSaveSuccess(invitationRef.current);
    setPublishedSuccessModalOpen(true);
  };

  const handleAdminPublish = async () => {
    try {
      setIsPublishing(true);
      const published = await adminPublishInvitation(
        invitation.id,
        adminAssignedPlan,
        invitation.title,
        invitation.slug
      );
      setInvitation(published);
      invitationRef.current = published;
      if (onSaveSuccess) onSaveSuccess(published);
      setAdminCompletionModalOpen(false);
      setPublishedSuccessModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xuất bản với quyền Admin');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Publish / Unpublish button click
  const handleTogglePublish = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    const nextStatus = invitation.status === 'published' ? 'draft' : 'published';
    const saved = await performSave(nextStatus);
    if (saved) {
      setSaveToast(
        nextStatus === 'published'
          ? 'Đã lưu và xuất bản website thiệp cưới thành công!'
          : 'Đã lưu và chuyển thiệp về bản nháp'
      );
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  // Navigation exit guard
  const handleExitClick = () => {
    if (hasUnsavedChanges || saveStatus === 'unsaved' || saveStatus === 'error') {
      setExitConfirmOpen(true);
    } else if (onNavigateBack) {
      onNavigateBack();
    }
  };

  const handleConfirmExitSave = async () => {
    setExitConfirmOpen(false);
    const saved = await performSave();
    if (saved && onNavigateBack) {
      onNavigateBack();
    }
  };

  const handleConfirmExitDiscard = () => {
    setExitConfirmOpen(false);
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setInvitation(prev);
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => performSave(), 2000);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setInvitation(next);
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => performSave(), 2000);
    }
  };

  // Image Upload: Cover Photo
  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setUploadMessage('Đang nén & tải ảnh bìa lên Firebase Storage...');
    try {
      const folder = `invitations/${invitation.id || 'draft'}/cover`;
      const url = await uploadImageToStorage(file, folder);
      updateState((prev) => ({ ...prev, coverImage: url }));
      setSaveToast('Đã tải ảnh bìa lên Firebase thành công!');
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi khi tải ảnh bìa lên Firebase Storage.');
    } finally {
      setIsUploadingCover(false);
      setUploadMessage(null);
      e.target.value = '';
    }
  };

  // Ảnh album: chọn nhiều ảnh / kéo thả → nén nhanh WebP → tải song song → tự thêm vào trình chiếu
  const uploadGalleryFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    if (!auth.currentUser) {
      setSaveToast('Vui lòng đăng nhập Google để tải ảnh lên album');
      if (onRequireAuth) onRequireAuth();
      return;
    }

    setIsUploadingGallery(true);
    setGalleryProgress({ done: 0, total: files.length });
    setUploadMessage(`Đang nén & tải ${files.length} ảnh...`);
    const folder = `invitations/${invitation.id || 'draft'}/gallery`;

    try {
      const { urls, errors } = await uploadImagesBatch(files, folder, (p) => {
        setGalleryProgress({ done: p.done, total: p.total });
        setUploadMessage(
          `Đã xử lý ${p.done}/${p.total} ảnh` +
            (p.savedBytes > 0 ? ` • tiết kiệm ${(p.savedBytes / 1024 / 1024).toFixed(1)}MB` : '')
        );
      });

      if (urls.length > 0) {
        updateState((prev) => ({
          ...prev,
          // Ảnh mẫu Unsplash mặc định được thay bằng ảnh thật của cặp đôi
          galleryImages: [
            ...(prev.galleryImages || []).filter((u) => !u.includes('images.unsplash.com')),
            ...urls,
          ],
        }));
      }
      setSaveToast(
        `Đã thêm ${urls.length} ảnh vào album trình chiếu` + (errors.length ? ` (${errors.length} ảnh lỗi)` : '')
      );
      if (errors.length) console.warn('Lỗi tải ảnh:', errors);
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi khi tải ảnh album lên Firebase Storage.');
    } finally {
      setIsUploadingGallery(false);
      setGalleryProgress(null);
      setUploadMessage(null);
    }
  };

  const handleGalleryPhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) await uploadGalleryFiles(files);
    e.target.value = '';
  };

  const moveGalleryImage = (from: number, to: number) => {
    updateState((prev) => {
      const arr = [...(prev.galleryImages || [])];
      if (to < 0 || to >= arr.length) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return { ...prev, galleryImages: arr };
    });
  };

  /** Mở QR: luôn có QR xem trước bản đang soạn; khi đã xuất bản có thêm QR link chính thức. */
  const handleOpenQr = async () => {
    setQrModalOpen(true);
    if (!auth.currentUser && !currentUser) {
      setPreviewQrUrl('');
      return;
    }
    try {
      setPreviewQrLoading(true);
      const saved = (await performSave()) || invitationRef.current;
      if (!saved || saved.id.startsWith('draft-')) return;
      const key = await upsertPreview(saved);
      if (!saved.previewKey) {
        setInvitation((prev) => ({ ...prev, previewKey: key }));
        invitationRef.current = { ...invitationRef.current, previewKey: key };
      }
      const link = buildPreviewLink(key);
      setPreviewLink(link);
      setPreviewQrUrl(await generateQrDataUrl(link, invitation.design.palette.primary));
    } catch (err) {
      console.warn('Không tạo được QR xem trước:', err);
    } finally {
      setPreviewQrLoading(false);
    }
  };

  // Generate QR for sharing
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thieponl.vn';
    const publicUrl = `${origin}/invite/${invitation.slug || invitation.id}`;
    generateQrDataUrl(publicUrl, invitation.design.palette.primary).then((url) => setQrDataUrl(url));
  }, [invitation.slug, invitation.id, invitation.design.palette.primary]);

  // Color preset options
  const colorPresets = [
    { name: 'Pastel Rose', primary: '#D4899C', secondary: '#E8B7C8', bg: '#FFFBF7', surface: '#FDF2F4' },
    { name: 'Korean Warm', primary: '#7E6B5D', secondary: '#D8CEC4', bg: '#FAF8F5', surface: '#FFFFFF' },
    { name: 'Sage Garden', primary: '#5B7065', secondary: '#DCE8D8', bg: '#F9FAF9', surface: '#EEF3EC' },
    { name: 'Champagne Gold', primary: '#B6925B', secondary: '#E9D8BD', bg: '#FCFBF7', surface: '#F8F4EC' },
    { name: 'Traditional Red', primary: '#A82828', secondary: '#E5A93C', bg: '#FFFDF9', surface: '#FDF4F4' },
    { name: 'Lavender Mist', primary: '#856E96', secondary: '#E8DFF5', bg: '#FCFAFF', surface: '#F6F0FC' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-[#F8F5F2] overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 bg-white border-b border-[#E8B7C8]/30 px-3 sm:px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          {onNavigateBack && (
            <button
              onClick={handleExitClick}
              className="p-1.5 rounded-xl hover:bg-neutral-100 text-[#453C45] transition-colors cursor-pointer flex items-center gap-1"
              title="Trở về trang Quản lý"
            >
              <ArrowLeft className="w-4 h-4 text-[#C76A82]" />
              <span className="hidden md:inline text-xs font-semibold">Quản lý</span>
            </button>
          )}

          <span className="font-heading font-bold text-xs sm:text-sm text-[#453C45] truncate max-w-[120px] sm:max-w-xs">
            {invitation.title || 'Thiệp Cưới'}
          </span>

          {/* Status Badge */}
          <span
            className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
              invitation.status === 'published'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {invitation.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
          </span>

          {/* Realtime Save Status Indicator */}
          <div className="flex items-center">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span className="hidden sm:inline">Đang lưu…</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Đã lưu</span>
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="hidden sm:inline">Chưa lưu (tự lưu sau 2s)</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 max-w-[200px] truncate"
                title={saveErrorMessage || 'Lỗi lưu thiệp'}
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span className="truncate">Lỗi: {saveErrorMessage || 'Không thể lưu'}</span>
                <button
                  onClick={handleManualSave}
                  className="ml-1 underline font-bold hover:text-red-900 cursor-pointer"
                >
                  Thử lại
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Device Switcher */}
        <div className="hidden sm:flex items-center bg-neutral-100 p-1 rounded-xl">
          <button
            onClick={() => setPreviewDevice('mobile')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
              previewDevice === 'mobile'
                ? 'bg-white shadow-xs text-[#C76A82]'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
            title="Xem trước màn hình điện thoại"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
          <button
            onClick={() => setPreviewDevice('desktop')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
              previewDevice === 'desktop'
                ? 'bg-white shadow-xs text-[#C76A82]'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
            title="Xem trước màn hình máy tính"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="hidden md:flex items-center gap-1 mr-1 border-r border-neutral-200 pr-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
              title="Hoàn tác (Undo)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
              title="Làm lại (Redo)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setPreviewModalOpen(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-neutral-300 text-xs font-medium text-[#453C45] hover:bg-neutral-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#C76A82]" />
            <span className="hidden sm:inline">Xem thử</span>
          </button>

          {/* Explicit Save button */}
          <button
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
            className="px-3 py-1.5 rounded-xl border border-[#E8B7C8] bg-white text-xs font-medium text-[#C76A82] hover:bg-[#F6DCE5]/30 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {saveStatus === 'saving' ? 'Đang lưu…' : 'Lưu thiệp'}
            </span>
          </button>

          {/* Hoàn Thành Button */}
          <button
            onClick={handleCompleteWorkflow}
            disabled={saveStatus === 'saving' || isPublishing}
            className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer text-white disabled:opacity-60 ${
              invitation.status === 'published'
                ? 'bg-[#607B64] hover:bg-[#47634C]'
                : 'bg-[#C76A82] hover:bg-[#B0596E]'
            }`}
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : invitation.status === 'published' ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{invitation.status === 'published' ? 'Đã Xuất Bản' : 'Hoàn Thành'}</span>
          </button>

          <button
            onClick={handleOpenQr}
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#453C45] cursor-pointer"
            title="Mã QR xem trước trên điện thoại & chia sẻ"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4-Step Progress Stepper */}
      <div className="bg-[#FAF8F5] dark:bg-[#1F1A1F] border-b border-[#E8B7C8]/25 dark:border-[#3D333D] px-3 sm:px-6 py-2 flex items-center justify-between overflow-x-auto text-xs shrink-0 z-10 transition-colors">
        <div className="flex items-center gap-2 sm:gap-4 max-w-3xl mx-auto w-full justify-between sm:justify-center">
          {/* Step 1: Chọn mẫu */}
          <button
            onClick={() => {
              if (onNavigateBack) onNavigateBack();
              else if (onNavigate) onNavigate('templates');
            }}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 font-medium hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            title="Nhấn để đổi mẫu thiệp khác"
          >
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
            <span className="font-semibold">1. Chọn mẫu</span>
          </button>

          <div className="w-3 sm:w-6 h-0.5 bg-neutral-200 dark:bg-neutral-700 shrink-0" />

          {/* Step 2: Thông tin */}
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              activeTab === 'info' || activeTab === 'time_place'
                ? 'bg-[#C76A82] text-white shadow-xs'
                : 'text-[#453C45] dark:text-[#F5EDE8] hover:bg-neutral-100 dark:hover:bg-[#2A232A]'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px] font-bold">2</span>
            <span>2. Thông tin</span>
          </button>

          <div className="w-3 sm:w-6 h-0.5 bg-neutral-200 dark:bg-neutral-700 shrink-0" />

          {/* Step 3: Tùy chỉnh */}
          <button
            onClick={() => setActiveTab('style')}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              activeTab === 'style' || activeTab === 'sections' || activeTab === 'gift'
                ? 'bg-[#C76A82] text-white shadow-xs'
                : 'text-[#453C45] dark:text-[#F5EDE8] hover:bg-neutral-100 dark:hover:bg-[#2A232A]'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px] font-bold">3</span>
            <span>3. Tùy chỉnh</span>
          </button>

          <div className="w-3 sm:w-6 h-0.5 bg-neutral-200 dark:bg-neutral-700 shrink-0" />

          {/* Step 4: Hoàn thành */}
          <button
            onClick={handleCompleteWorkflow}
            className={`flex items-center gap-1.5 py-1 px-3 rounded-lg font-bold transition-all shadow-xs cursor-pointer shrink-0 ${
              invitation.status === 'published'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gradient-to-r from-[#D4899C] to-[#C76A82] text-white hover:brightness-105'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">4</span>
            <span>{invitation.status === 'published' ? 'Đã hoàn thành' : '4. Hoàn thành'}</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#453C45] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Uploading Notification Toast */}
      {uploadMessage && (
        <div className="fixed top-20 right-6 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs flex items-center gap-2 animate-fade-in">
          <Loader2 className="w-4 h-4 animate-spin text-[#C76A82]" />
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Main Workspace (Sidebar + Center Live Preview) */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT EDITING SIDEBAR                                      */}
        {/* ========================================================= */}
        <div className="w-full md:w-[420px] lg:w-[460px] bg-white border-r border-[#E8B7C8]/30 flex flex-col shrink-0 z-10 shadow-sm">
          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-neutral-200 text-xs font-semibold text-[#827580] bg-[#FAF8F5] overflow-x-auto">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'info'
                  ? 'border-[#C76A82] text-[#C76A82] bg-white'
                  : 'border-transparent hover:text-[#453C45]'
              }`}
            >
              Cặp Đôi & Ảnh Bìa
            </button>
            <button
              onClick={() => setActiveTab('time_place')}
              className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'time_place'
                  ? 'border-[#C76A82] text-[#C76A82] bg-white'
                  : 'border-transparent hover:text-[#453C45]'
              }`}
            >
              Thời Gian & Nơi Tổ Chức
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'style'
                  ? 'border-[#C76A82] text-[#C76A82] bg-white'
                  : 'border-transparent hover:text-[#453C45]'
              }`}
            >
              Giao Diện
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'sections'
                  ? 'border-[#C76A82] text-[#C76A82] bg-white'
                  : 'border-transparent hover:text-[#453C45]'
              }`}
            >
              Section & Album Ảnh
            </button>
            <button
              onClick={() => setActiveTab('gift')}
              className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'gift'
                  ? 'border-[#C76A82] text-[#C76A82] bg-white'
                  : 'border-transparent hover:text-[#453C45]'
              }`}
            >
              Hộp Mừng
            </button>
          </div>

          {/* Form Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* TAB 1: CẶP ĐÔI, ẢNH BÌA & GIA ĐÌNH */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#F6DCE5]/30 rounded-xl border border-[#E8B7C8]/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#C76A82] block">Cần gợi ý lời văn hay?</span>
                    <span className="text-[11px] text-[#827580]">Sử dụng AI để gợi ý thi văn lãng mạn</span>
                  </div>
                  {onOpenAIDesigner && (
                    <button
                      onClick={onOpenAIDesigner}
                      className="px-2.5 py-1 bg-white text-xs font-semibold text-[#C76A82] rounded-lg border border-[#E8B7C8] hover:bg-[#F6DCE5]/20 flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Gợi ý
                    </button>
                  )}
                </div>

                {/* Bride & Groom names */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#453C45] mb-1">
                      Tên Chú Rể <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="input-groom-name"
                      type="text"
                      placeholder="Ví dụ: Quốc Bảo"
                      value={invitation.groomName || ''}
                      onChange={(e) => updateState((prev) => ({ ...prev, groomName: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#453C45] mb-1">
                      Tên Cô Dâu <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="input-bride-name"
                      type="text"
                      placeholder="Ví dụ: Minh Anh"
                      value={invitation.brideName || ''}
                      onChange={(e) => updateState((prev) => ({ ...prev, brideName: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-[#453C45] mb-1">
                    Tiêu Đề Thiệp Cưới
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hôn Lễ Quốc Bảo & Minh Anh"
                    value={invitation.title || ''}
                    onChange={(e) => updateState((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50"
                  />
                </div>

                {/* Cover Image Upload (Firebase Storage + Compression) */}
                <div className="p-3.5 rounded-xl border border-[#E8B7C8]/40 bg-[#FFFBF7] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-[#453C45]">
                        Ảnh Bìa Cưới (Cover Image)
                      </label>
                      <span className="text-[11px] text-[#827580]">
                        Tự động nén tối đa 1600px & tải lên Firebase Storage
                      </span>
                    </div>

                    <label
                      htmlFor="cover-file-upload"
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs ${
                        isUploadingCover
                          ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                          : 'bg-[#C76A82] text-white hover:bg-[#B0596E]'
                      }`}
                    >
                      {isUploadingCover ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UploadCloud className="w-3.5 h-3.5" />
                      )}
                      <span>{isUploadingCover ? 'Đang tải lên…' : 'Tải ảnh từ máy'}</span>
                    </label>
                    <input
                      id="cover-file-upload"
                      type="file"
                      accept="image/*"
                      disabled={isUploadingCover}
                      onChange={handleCoverPhotoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Thumbnail Preview */}
                  {invitation.coverImage && (
                    <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                      <img
                        src={invitation.coverImage}
                        alt="Ảnh bìa xem trước"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md">
                        Đang sử dụng
                      </div>
                    </div>
                  )}

                  {/* URL Input Fallback */}
                  <div>
                    <label className="block text-[11px] text-neutral-500 mb-1">
                      Hoặc dán trực tiếp đường dẫn URL ảnh:
                    </label>
                    <input
                      type="url"
                      value={invitation.coverImage || ''}
                      onChange={(e) => updateState((prev) => ({ ...prev, coverImage: e.target.value }))}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Parents Information */}
                <div className="pt-2 border-t border-neutral-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#827580] mb-3">
                    Thông Tin Phụ Mẫu Hai Nhà
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#453C45] mb-1">
                          Thân phụ chú rể
                        </label>
                        <input
                          type="text"
                          placeholder="Ông: ..."
                          value={invitation.groomParents?.father || ''}
                          onChange={(e) =>
                            updateState((prev) => ({
                              ...prev,
                              groomParents: { ...prev.groomParents!, father: e.target.value },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#453C45] mb-1">
                          Thân mẫu chú rể
                        </label>
                        <input
                          type="text"
                          placeholder="Bà: ..."
                          value={invitation.groomParents?.mother || ''}
                          onChange={(e) =>
                            updateState((prev) => ({
                              ...prev,
                              groomParents: { ...prev.groomParents!, mother: e.target.value },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#453C45] mb-1">
                          Thân phụ cô dâu
                        </label>
                        <input
                          type="text"
                          placeholder="Ông: ..."
                          value={invitation.brideParents?.father || ''}
                          onChange={(e) =>
                            updateState((prev) => ({
                              ...prev,
                              brideParents: { ...prev.brideParents!, father: e.target.value },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#453C45] mb-1">
                          Thân mẫu cô dâu
                        </label>
                        <input
                          type="text"
                          placeholder="Bà: ..."
                          value={invitation.brideParents?.mother || ''}
                          onChange={(e) =>
                            updateState((prev) => ({
                              ...prev,
                              brideParents: { ...prev.brideParents!, mother: e.target.value },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div>
                  <label className="block text-xs font-semibold text-[#453C45] mb-1">
                    Thông Điệp Mời Cưới
                  </label>
                  <textarea
                    rows={3}
                    value={invitation.invitationMessage || ''}
                    onChange={(e) => updateState((prev) => ({ ...prev, invitationMessage: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#453C45] mb-1">
                    Lời Cảm Ơn Cuối Thiệp
                  </label>
                  <textarea
                    rows={2}
                    value={invitation.thankYouMessage || ''}
                    onChange={(e) => updateState((prev) => ({ ...prev, thankYouMessage: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50 resize-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: THỜI GIAN & ĐỊA ĐIỂM */}
            {activeTab === 'time_place' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#453C45] mb-1">
                      Ngày Tổ Chức (Dương Lịch) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="input-wedding-date"
                      type="date"
                      value={invitation.weddingDate || ''}
                      onChange={(e) => updateState((prev) => ({ ...prev, weddingDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#453C45] mb-1">
                      Giờ Khai Tiệc
                    </label>
                    <input
                      id="input-wedding-time"
                      type="time"
                      value={invitation.weddingTime || '11:00'}
                      onChange={(e) => updateState((prev) => ({ ...prev, weddingTime: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#453C45] mb-1">
                    Ngày Âm Lịch (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Ngày 20 tháng 10 năm Bính Ngọ"
                    value={invitation.lunarDate || ''}
                    onChange={(e) => updateState((prev) => ({ ...prev, lunarDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#453C45] mb-1">
                    Tên Trung Tâm Tiệc Cưới / Nhà Khách
                  </label>
                  <input
                    id="input-venue-name"
                    type="text"
                    placeholder="Ví dụ: Trung Tâm Tiệc Cưới GEM Center"
                    value={invitation.venueName || ''}
                    onChange={(e) => updateState((prev) => ({ ...prev, venueName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#453C45] mb-1">
                    Địa Chỉ Chi Tiết
                  </label>
                  <textarea
                    id="input-venue-address"
                    rows={2}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    value={invitation.venueAddress || ''}
                    onChange={(e) => updateState((prev) => ({ ...prev, venueAddress: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#453C45] mb-1">
                    Link Bản Đồ Google Maps (Xem chỉ đường)
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/?q=..."
                    value={invitation.mapUrl || ''}
                    onChange={(e) => updateState((prev) => ({ ...prev, mapUrl: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: GIAO DIỆN & MÀU SẮC */}
            {activeTab === 'style' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#827580] mb-2">
                    Bảng Phối Màu Đề Xuất
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() =>
                          updateState((prev) => ({
                            ...prev,
                            design: {
                              ...prev.design,
                              palette: {
                                ...prev.design.palette,
                                primary: preset.primary,
                                secondary: preset.secondary,
                                background: preset.bg,
                                surface: preset.surface,
                                accent: preset.primary,
                              },
                              envelopeColor: preset.secondary,
                              sealColor: preset.primary,
                            },
                          }))
                        }
                        className="p-2.5 rounded-xl border border-neutral-200 hover:border-[#C76A82] flex items-center gap-2 text-left transition-all cursor-pointer"
                      >
                        <div className="flex -space-x-1">
                          <span
                            className="w-5 h-5 rounded-full border border-white"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <span
                            className="w-5 h-5 rounded-full border border-white"
                            style={{ backgroundColor: preset.secondary }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[#453C45]">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
                  <div>
                    <label className="block text-xs font-semibold text-[#453C45] mb-1">
                      Màu Chủ Đạo (Tiêu đề)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={invitation.design.palette.primary}
                        onChange={(e) =>
                          updateState((prev) => ({
                            ...prev,
                            design: {
                              ...prev.design,
                              palette: { ...prev.design.palette, primary: e.target.value, accent: e.target.value },
                            },
                          }))
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-300"
                      />
                      <span className="text-xs font-mono">{invitation.design.palette.primary}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#453C45] mb-1">
                      Màu Nền Thiệp
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={invitation.design.palette.background}
                        onChange={(e) =>
                          updateState((prev) => ({
                            ...prev,
                            design: {
                              ...prev.design,
                              palette: { ...prev.design.palette, background: e.target.value },
                            },
                          }))
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-300"
                      />
                      <span className="text-xs font-mono">{invitation.design.palette.background}</span>
                    </div>
                  </div>
                </div>

                {/* Wax seal initial */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#453C45] mb-1">
                      Chữ Viết Tắt Con Dấu Sáp
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={invitation.design.sealInitial || ''}
                      onChange={(e) =>
                        updateState((prev) => ({
                          ...prev,
                          design: { ...prev.design, sealInitial: e.target.value },
                        }))
                      }
                      placeholder="M & B"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#453C45] mb-1">
                      Màu Con Dấu Sáp
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={invitation.design.sealColor || '#C76A82'}
                        onChange={(e) =>
                          updateState((prev) => ({
                            ...prev,
                            design: { ...prev.design, sealColor: e.target.value },
                          }))
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-300"
                      />
                      <span className="text-xs font-mono">{invitation.design.sealColor || '#C76A82'}</span>
                    </div>
                  </div>
                </div>

                {/* Font Choices */}
                <div>
                  <label className="block text-xs font-semibold text-[#453C45] mb-1">
                    Phông Chữ Tiêu Đề
                  </label>
                  <select
                    value={invitation.design.fontHeading}
                    onChange={(e) =>
                      updateState((prev) => ({
                        ...prev,
                        design: { ...prev.design, fontHeading: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300"
                  >
                    <option value="Playfair Display, Georgia, serif">Playfair Display (Sang trọng lãng mạn)</option>
                    <option value="Cormorant Garamond, serif">Cormorant Garamond (Quý phái, thanh thoát)</option>
                    <option value="Plus Jakarta Sans, sans-serif">Plus Jakarta Sans (Hiện đại, tối giản)</option>
                  </select>
                </div>

                {/* Nhạc nền: thư viện nhạc cưới + tải lên / dán link */}
                <MusicPicker
                  value={invitation.musicUrl || ''}
                  title={invitation.design.musicTitle}
                  accent={invitation.design.palette.primary}
                  onChange={(url, title) =>
                    updateState((prev) => ({
                      ...prev,
                      musicUrl: url,
                      design: { ...prev.design, musicTitle: title || '' },
                    }))
                  }
                />

                {/* Hiệu ứng trình chiếu album ảnh */}
                <GalleryEffectPicker
                  value={invitation.design.galleryEffect}
                  templateId={invitation.templateId}
                  sampleImages={invitation.galleryImages}
                  onChange={(effect) =>
                    updateState((prev) => ({ ...prev, design: { ...prev.design, galleryEffect: effect } }))
                  }
                />
              </div>
            )}

            {/* TAB 4: SECTION & ALBUM ẢNH */}
            {activeTab === 'sections' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#827580] mb-3">
                    Hiển Thị Các Mục Trên Thiệp
                  </h4>
                  <div className="space-y-2 text-xs">
                    {[
                      { key: 'countdown', label: 'Đếm ngược thời gian ngày cưới' },
                      { key: 'parents', label: 'Thông tin đại diện gia đình hai nhà' },
                      { key: 'eventInfo', label: 'Thời gian, địa điểm & Bản đồ chỉ đường' },
                      { key: 'loveStory', label: 'Chuyện tình yêu (Love Story timeline)' },
                      { key: 'timeline', label: 'Lịch trình chi tiết buổi lễ' },
                      { key: 'gallery', label: 'Album ảnh cưới (Photo Gallery)' },
                      { key: 'rsvp', label: 'Xác nhận tham dự (RSVP form)' },
                      { key: 'wishes', label: 'Sổ lưu bút online (Guestbook)' },
                      { key: 'giftBox', label: 'Hộp mừng cưới trực tuyến (VietQR)' },
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 cursor-pointer"
                      >
                        <span className="text-[#453C45] font-medium">{label}</span>
                        <input
                          type="checkbox"
                          checked={Boolean(
                            invitation.sectionsVisibility[key as keyof typeof invitation.sectionsVisibility]
                          )}
                          onChange={(e) =>
                            updateState((prev) => ({
                              ...prev,
                              sectionsVisibility: {
                                ...prev.sectionsVisibility,
                                [key]: e.target.checked,
                              },
                            }))
                          }
                          className="w-4 h-4 text-[#C76A82] rounded accent-[#C76A82]"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Album Images Section (Firebase Storage + Compression) */}
                <div className="pt-4 border-t border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#827580]">
                        Ảnh Album Cưới ({invitation.galleryImages?.length || 0} ảnh)
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Chọn nhiều ảnh cùng lúc • nén nhanh • tự trình chiếu theo hiệu ứng đã chọn
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="gallery-file-upload"
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors ${
                          isUploadingGallery
                            ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                            : 'bg-[#C76A82] text-white hover:bg-[#B0596E]'
                        }`}
                      >
                        {isUploadingGallery ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UploadCloud className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploadingGallery ? 'Đang tải…' : 'Tải ảnh từ máy'}</span>
                      </label>
                      <input
                        id="gallery-file-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        disabled={isUploadingGallery}
                        onChange={handleGalleryPhotosUpload}
                        className="hidden"
                      />

                      <button
                        onClick={() =>
                          updateState((prev) => ({
                            ...prev,
                            galleryImages: [
                              ...(prev.galleryImages || []),
                              'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
                            ],
                          }))
                        }
                        className="px-2 py-1.5 text-xs font-semibold text-[#C76A82] bg-[#F6DCE5]/40 rounded-lg flex items-center gap-1 hover:bg-[#F6DCE5]"
                        title="Thêm link URL mẫu"
                      >
                        <Plus className="w-3.5 h-3.5" /> Link URL
                      </button>
                    </div>
                  </div>

                  {/* Kéo thả ảnh + tiến trình nén/tải */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPhotos(true);
                    }}
                    onDragLeave={() => setIsDraggingPhotos(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPhotos(false);
                      if (!isUploadingGallery && e.dataTransfer.files?.length) uploadGalleryFiles(e.dataTransfer.files);
                    }}
                    className={`rounded-xl border-2 border-dashed p-3 text-center text-[11px] transition-colors ${
                      isDraggingPhotos ? 'border-[#C76A82] bg-[#F6DCE5]/40 text-[#C76A82]' : 'border-neutral-200 text-[#827580]'
                    }`}
                  >
                    {galleryProgress ? (
                      <div className="space-y-1.5">
                        <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                          <div
                            className="h-full bg-[#C76A82] transition-all"
                            style={{ width: `${Math.round((galleryProgress.done / galleryProgress.total) * 100)}%` }}
                          />
                        </div>
                        <p>{uploadMessage}</p>
                      </div>
                    ) : (
                      <p>Kéo thả nhiều ảnh vào đây — ảnh được nén nhanh (WebP ≤1600px) và tự ghép vào album trình chiếu.</p>
                    )}
                  </div>

                  {/* Visual Gallery Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {invitation.galleryImages?.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 aspect-[4/3]"
                      >
                        <img
                          src={url}
                          alt={`Album ảnh ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white font-mono bg-black/50 px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => moveGalleryImage(idx, idx - 1)}
                                disabled={idx === 0}
                                className="px-1.5 py-0.5 text-[10px] bg-white/90 rounded disabled:opacity-40"
                                title="Đưa lên trước"
                              >
                                ◀
                              </button>
                              <button
                                onClick={() => moveGalleryImage(idx, idx + 1)}
                                disabled={idx === (invitation.galleryImages?.length || 0) - 1}
                                className="px-1.5 py-0.5 text-[10px] bg-white/90 rounded disabled:opacity-40"
                                title="Đưa ra sau"
                              >
                                ▶
                              </button>
                              <button
                                onClick={() => updateState((prev) => ({ ...prev, coverImage: url }))}
                                className="px-1.5 py-0.5 text-[10px] bg-white/90 rounded"
                                title="Đặt làm ảnh bìa"
                              >
                                Bìa
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newArr = invitation.galleryImages.filter((_, i) => i !== idx);
                              updateState((prev) => ({ ...prev, galleryImages: newArr }));
                            }}
                            className="self-end p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: HỘP MỪNG CƯỚI & VIETQR */}
            {activeTab === 'gift' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFFBF7] border border-[#E8B7C8]/40">
                  <div>
                    <span className="text-xs font-semibold text-[#453C45] block">Bật Hộp Mừng Cưới</span>
                    <span className="text-[11px] text-[#827580]">
                      Hiển thị tài khoản và mã VietQR cho khách gửi quà mừng
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={invitation.giftBank.enabled}
                    onChange={(e) =>
                      updateState((prev) => ({
                        ...prev,
                        giftBank: { ...prev.giftBank, enabled: e.target.checked },
                      }))
                    }
                    className="w-5 h-5 accent-[#C76A82]"
                  />
                </div>

                {invitation.giftBank.enabled && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#453C45] mb-1">
                        Tên Ngân Hàng
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: TPBank, Vietcombank, Techcombank, MB Bank..."
                        value={invitation.giftBank.bankName}
                        onChange={(e) =>
                          updateState((prev) => ({
                            ...prev,
                            giftBank: { ...prev.giftBank, bankName: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#453C45] mb-1">
                        Số Tài Khoản
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 87583868888"
                        value={invitation.giftBank.accountNumber}
                        onChange={(e) =>
                          updateState((prev) => ({
                            ...prev,
                            giftBank: { ...prev.giftBank, accountNumber: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#453C45] mb-1">
                        Chủ Tài Khoản (In hoa không dấu)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: TRAN MINH TIEN"
                        value={invitation.giftBank.accountHolder}
                        onChange={(e) =>
                          updateState((prev) => ({
                            ...prev,
                            giftBank: { ...prev.giftBank, accountHolder: e.target.value.toUpperCase() },
                          }))
                        }
                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#453C45] mb-1">
                        Nội Dung Chuyển Khoản Mặc Định
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Mung cuoi Minh Anh & Quoc Bao"
                        value={invitation.giftBank.note || ''}
                        onChange={(e) =>
                          updateState((prev) => ({
                            ...prev,
                            giftBank: { ...prev.giftBank, note: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* CENTER LIVE INTERACTIVE PREVIEW                           */}
        {/* ========================================================= */}
        <div className="flex-1 bg-[#F5EFEA] dark:bg-[#1a161a] overflow-y-auto p-4 sm:p-8 flex items-center justify-center transition-colors">
          <div
            className={`transition-all duration-300 relative ${
              previewDevice === 'mobile'
                ? 'w-full max-w-[390px] h-[780px] rounded-[44px] shadow-2xl border-[10px] border-[#2C2B2A] overflow-hidden relative bg-white'
                : 'w-full max-w-4xl min-h-[800px] rounded-2xl shadow-xl overflow-hidden bg-white relative'
            }`}
          >
            {/* Mobile Notch simulation */}
            {previewDevice === 'mobile' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-36 bg-[#2C2B2A] rounded-b-xl z-40 pointer-events-none" />
            )}

            {/* Scrollable preview inner container */}
            <div className="h-full overflow-y-auto relative">
              {/* Draft / Unpaid Watermark Overlay */}
              {invitation.status !== 'published' && (
                <WatermarkOverlay showBadge={true} />
              )}
              <PublicInvitationView invitation={invitation} isPreviewMode={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="h-14 bg-white/10 backdrop-blur-md px-6 flex items-center justify-between text-white shrink-0">
            <span className="font-heading font-bold text-sm">Xem Thử Thực Tế — {invitation.title}</span>
            <button
              onClick={() => setPreviewModalOpen(false)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Đóng xem thử
            </button>
          </div>
          <div className="flex-1 overflow-y-auto relative">
            {invitation.status !== 'published' && <WatermarkOverlay showBadge={true} />}
            <PublicInvitationView invitation={invitation} isPreviewMode={false} />
          </div>
        </div>
      )}

      {/* QR & Share Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#2A232A] rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 border border-[#E8B7C8]/40 dark:border-[#3D333D]">
            <h3 className="font-heading font-bold text-base text-[#453C45] dark:text-[#F5EDE8]">Quét QR Xem Thiệp Trên Điện Thoại</h3>

            {/* QR xem trước bản đang soạn — dùng được bất cứ lúc nào, trước và sau khi xuất bản */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#C76A82]">Bản xem trước (cập nhật theo chỉnh sửa mới nhất)</p>
              {!auth.currentUser && !currentUser ? (
                <p className="text-xs text-[#827580]">Đăng nhập Google để tạo mã QR xem trước thiệp đang soạn.</p>
              ) : previewQrLoading ? (
                <div className="w-48 h-48 mx-auto flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#C76A82]" />
                </div>
              ) : previewQrUrl ? (
                <>
                  <div className="w-48 h-48 mx-auto p-2 bg-[#FFFBF7] dark:bg-[#1F1A1F] rounded-xl border border-[#E8B7C8]/40 shadow-inner">
                    <img src={previewQrUrl} alt="QR xem trước" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex items-center justify-center gap-3 text-[11px]">
                    <a href={previewLink} target="_blank" rel="noreferrer" className="text-[#C76A82] underline">Mở bản xem trước</a>
                    <button onClick={() => navigator.clipboard.writeText(previewLink)} className="text-[#827580] underline cursor-pointer">Sao chép link</button>
                    <a href={previewQrUrl} download={`QR-XemTruoc-${invitation.slug || 'thiep'}.png`} className="text-[#827580] underline">Tải QR</a>
                  </div>
                </>
              ) : (
                <p className="text-xs text-[#827580]">Lưu thiệp để tạo mã QR xem trước.</p>
              )}
            </div>

            {invitation.status === 'published' && qrDataUrl && (
              <div className="space-y-2 pt-3 border-t border-[#E8B7C8]/30">
                <p className="text-xs font-semibold text-[#607B64]">Link chính thức gửi khách mời</p>
                <div className="w-40 h-40 mx-auto p-2 bg-[#FFFBF7] dark:bg-[#1F1A1F] rounded-xl border border-[#E8B7C8]/40 shadow-inner">
                  <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                </div>
              </div>
            )}
            <div className="pt-2 flex items-center gap-2">
              {invitation.status === 'published' && (
                <a
                  href={qrDataUrl}
                  download={`QR-Thiep-${invitation.slug || 'cuoi'}.png`}
                  className="flex-1 py-2.5 rounded-xl bg-[#C76A82] text-white text-xs font-semibold hover:bg-[#B0596E] transition-colors"
                >
                  Tải QR chính thức
                </a>
              )}
              <button
                onClick={() => setQrModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-[#3D333D] text-xs font-semibold text-[#453C45] dark:text-[#F5EDE8]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal before exiting */}
      {exitConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#2A232A] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-[#E8B7C8]/40 dark:border-[#3D333D]">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-heading font-bold text-base text-[#453C45] dark:text-[#F5EDE8]">
                Bạn có thay đổi chưa được lưu
              </h3>
              <p className="text-xs text-[#827580] dark:text-[#B9A9B4] leading-relaxed">
                Các chỉnh sửa gần nhất của bạn chưa được lưu lại vào hệ thống. Bạn có muốn lưu trước khi rời khỏi trang thiết kế không?
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleConfirmExitSave}
                className="w-full py-2.5 bg-[#C76A82] text-white text-xs font-bold rounded-xl hover:bg-[#B0596E] transition-colors shadow-xs cursor-pointer"
              >
                Lưu thay đổi rồi thoát
              </button>
              <button
                onClick={handleConfirmExitDiscard}
                className="w-full py-2.5 bg-neutral-100 dark:bg-[#332A33] text-[#453C45] dark:text-[#F5EDE8] text-xs font-semibold rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Rời đi không lưu
              </button>
              <button
                onClick={() => setExitConfirmOpen(false)}
                className="w-full py-2 text-neutral-400 text-xs hover:text-neutral-600 transition-colors cursor-pointer"
              >
                Ở lại tiếp tục chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* WORKFLOW MODALS                                           */}
      {/* ========================================================= */}

      {/* 1. Modal Chọn Gói Dịch Vụ Xuất Bản (PublishPlanModal) */}
      <PublishPlanModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        invitation={invitation}
        onSelectPlan={handleSelectPlan}
        isLoading={isPublishing}
        freeTrialAvailable={freeTrialAvailable}
      />

      {/* 2. Modal Thanh Toán SePay VietQR (PaymentModal) */}
      {createdOrder && bankAccountInfo && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          order={createdOrder}
          bankAccount={bankAccountInfo}
          onPaymentSuccess={handlePaymentSuccess}
          onCreateNewOrder={() => {
            setPaymentModalOpen(false);
            setPlanModalOpen(true);
          }}
          isAdmin={currentUser?.role === 'admin' || isAdminUser(currentUser?.email || auth.currentUser?.email)}
        />
      )}

      {/* 3. Modal Thiệp Đã Sẵn Sàng (PublishedSuccessModal) */}
      <PublishedSuccessModal
        isOpen={publishedSuccessModalOpen}
        onClose={() => setPublishedSuccessModalOpen(false)}
        invitation={invitation}
        onManageGuests={() => {
          setPublishedSuccessModalOpen(false);
          if (onNavigateBack) onNavigateBack();
          else if (onNavigate) onNavigate('dashboard');
        }}
        onContinueEditing={() => setPublishedSuccessModalOpen(false)}
      />

      {/* 4. Modal Hoàn Thành Của Quản Trị Viên (Admin Privilege Completion Modal) */}
      {adminCompletionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-[#2A232A] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-[#E8B7C8]/40 dark:border-[#3D333D] transition-colors">
            <button
              onClick={() => setAdminCompletionModalOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-600 dark:hover:text-[#F5EDE8] p-1.5 rounded-xl cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Đặc Quyền Quản Trị Viên (Admin)</span>
              </div>
              <h3 className="font-heading text-2xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
                Xuất Bản Miễn Phí
              </h3>
              <p className="text-xs text-[#827580] dark:text-[#B9A9B4]">
                Tài khoản <strong className="text-purple-700 dark:text-purple-300">{currentUser?.email || auth.currentUser?.email}</strong> có quyền Quản trị viên (Admin). Thiệp cưới được xuất bản ngay lập tức mà không cần thanh toán hoặc tạo đơn hàng.
              </p>
            </div>

            {/* Select assigned plan */}
            <div className="space-y-3 mb-6 bg-[#FAF8F5] dark:bg-[#1F1A1F] p-4 rounded-2xl border border-[#E8B7C8]/30 dark:border-[#3D333D]">
              <label className="text-xs font-bold uppercase tracking-wider text-[#827580] dark:text-[#B9A9B4] block">
                Gán gói dịch vụ cho thiệp này:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['free', 'premium', 'luxury'] as const).map((planKey) => (
                  <button
                    key={planKey}
                    type="button"
                    onClick={() => setAdminAssignedPlan(planKey)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      adminAssignedPlan === planKey
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-200 ring-2 ring-purple-600/30 font-bold'
                        : 'border-neutral-200 dark:border-[#3D333D] text-[#453C45] dark:text-[#F5EDE8] hover:bg-neutral-50 dark:hover:bg-[#332A33]'
                    }`}
                  >
                    <div className="text-xs uppercase font-extrabold">{planKey}</div>
                    <div className="text-[10px] text-[#827580] dark:text-[#B9A9B4] mt-0.5">
                      {planKey === 'free' ? '0đ' : planKey === 'premium' ? '299.000đ' : '599.000đ'}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#827580] dark:text-[#B9A9B4] italic pt-1">
                * Dùng khi tạo thiệp tặng bạn bè hoặc hỗ trợ khách hàng. Hoạt động này được lưu vào nhật ký Admin (không tính vào doanh thu).
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAdminPublish}
                disabled={isPublishing}
                className="flex-1 py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Xác Nhận Xuất Bản Ngay</span>
              </button>
              <button
                onClick={() => setAdminCompletionModalOpen(false)}
                className="py-3 px-4 rounded-xl border border-neutral-300 dark:border-[#3D333D] text-[#453C45] dark:text-[#F5EDE8] text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
