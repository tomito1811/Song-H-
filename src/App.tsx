/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { TemplateGallery } from './components/TemplateGallery';
// Tải theo nhu cầu: các màn hình nặng chỉ tải khi người dùng mở tới (trang chủ nhẹ & nhanh hơn)
const InvitationBuilder = lazy(() => import('./components/InvitationBuilder').then((m) => ({ default: m.InvitationBuilder })));
const PublicInvitationView = lazy(() => import('./components/PublicInvitationView').then((m) => ({ default: m.PublicInvitationView })));
const DashboardView = lazy(() => import('./components/DashboardView').then((m) => ({ default: m.DashboardView })));
const AdminView = lazy(() => import('./components/AdminView').then((m) => ({ default: m.AdminView })));
import { AIDesignerModal } from './components/AIDesignerModal';
import { AuthModal } from './components/AuthModal';
const LegalPages = lazy(() => import('./components/LegalPages').then((m) => ({ default: m.LegalPages })));
import { WeddingInvitation, WeddingTemplate, AIDesignProposal, User, EventType } from './types/wedding';
import { WEDDING_TEMPLATES } from './data/templates';
import { fetchInvitationBySlug, fetchInvitationById, createInvitation, getCurrentUser } from './utils/api';
import { auth, onAuthStateChanged } from './firebase';
import { ThemeProvider } from './context/ThemeContext';
import { draftFromTemplate } from './utils/draftFromTemplate';
import { fetchPreview } from './utils/engagement';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeInvitation, setActiveInvitation] = useState<WeddingInvitation | null>(null);
  const [publicInvitation, setPublicInvitation] = useState<WeddingInvitation | null>(null);
  const [publicGuestId, setPublicGuestId] = useState<string | undefined>(undefined);
  const [sandboxLabel, setSandboxLabel] = useState<string | undefined>(undefined);
  const [publicNotFound, setPublicNotFound] = useState(false);
  const [templateType, setTemplateType] = useState<EventType | undefined>(undefined);

  const [isAIDesignerOpen, setIsAIDesignerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Synchronize Firebase Auth state with Firestore user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await getCurrentUser();
          if (profile) {
            setCurrentUser(profile);
          }
        } catch (err) {
          console.warn('Could not sync user profile:', err);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check initial URL pathname
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/invite/')) {
      const slug = decodeURIComponent(path.replace('/invite/', '').split('/')[0]);
      const g = new URLSearchParams(window.location.search).get('g') || undefined;
      if (slug) {
        setCurrentView('invite');
        fetchInvitationBySlug(slug)
          .then((inv) => {
            if (inv) {
              setPublicGuestId(g);
              setPublicInvitation(inv);
            } else setPublicNotFound(true);
          })
          .catch((err) => {
            console.warn('Could not load public invitation:', err);
            setPublicNotFound(true);
          });
      }
    } else if (path.startsWith('/demo/')) {
      // Trang demo mẫu thiệp (mở từ QR "xem mẫu") — dữ liệu mẫu, không ghi gì
      const tplSlug = decodeURIComponent(path.replace('/demo/', '').split('/')[0]);
      const tpl = WEDDING_TEMPLATES.find((t) => t.slug === tplSlug || t.id === tplSlug);
      setCurrentView('invite');
      if (tpl) {
        setPublicInvitation(draftFromTemplate(tpl, '', true));
        setSandboxLabel(`Bản demo mẫu "${tpl.name}" — dữ liệu minh họa`);
      } else setPublicNotFound(true);
    } else if (path.startsWith('/preview/')) {
      // Bản xem trước thiệp đang soạn (mở từ QR trong trình thiết kế)
      const key = decodeURIComponent(path.replace('/preview/', '').split('/')[0]);
      setCurrentView('invite');
      fetchPreview(key).then((inv) => {
        if (inv) {
          setPublicInvitation({ ...inv, status: 'published' });
          setSandboxLabel(
            inv.status === 'published'
              ? 'Bản xem trước — bản mới nhất bạn đang chỉnh sửa'
              : 'Bản xem trước — thiệp chưa xuất bản, chỉ người có mã QR mới xem được'
          );
        } else setPublicNotFound(true);
      });
    } else if (path === '/builder/new' || path.startsWith('/builder/')) {
      setCurrentView('templates');
    } else if (path === '/templates') {
      setCurrentView('templates');
    } else if (path === '/dashboard') {
      setCurrentView('dashboard');
    } else if (path === '/admin') {
      setCurrentView('admin');
    } else if (path === '/terms' || path === '/privacy' || path === '/refund') {
      setCurrentView(path.slice(1));
    }
  }, []);

  // Handle URL change
  const navigateTo = (view: string, params?: any) => {
    if ((view === 'dashboard' || view === 'admin') && !currentUser && !auth.currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (view === 'admin' && currentUser && currentUser.role !== 'admin') {
      setCurrentView('home');
      return;
    }

    setCurrentView(view);
    if (view === 'home') {
      window.history.pushState({}, '', '/');
    } else if (view === 'templates') {
      const t: EventType | undefined = params?.type;
      setTemplateType(t || 'wedding');
      window.history.pushState({}, '', t && t !== 'wedding' ? `/templates?type=${t}` : '/templates');
    } else if (view === 'dashboard') {
      window.history.pushState({}, '', '/dashboard');
    } else if (view === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else if (view === 'terms' || view === 'privacy' || view === 'refund') {
      window.history.pushState({}, '', `/${view}`);
    } else if (view === 'pricing') {
      setCurrentView('home');
      setTimeout(() => {
        const el = document.getElementById('pricing');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start new invitation from template (Allows guests to design freely before signing in)
  const handleSelectTemplate = (template: WeddingTemplate) => {
    const draftInv = draftFromTemplate(template, currentUser?.id || auth.currentUser?.uid || '');

    setActiveInvitation(draftInv);
    setCurrentView('builder');
    window.history.pushState({}, '', '/builder/new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Apply AI Generated Proposal (In-memory draft)
  const handleApplyAIProposal = (proposal: AIDesignProposal) => {
    if (!currentUser && !auth.currentUser) {
      setIsAIDesignerOpen(false);
      setIsAuthModalOpen(true);
      return;
    }

    const draftInv: WeddingInvitation = {
      id: `draft-${Date.now()}`,
      slug: '',
      userId: currentUser?.id || auth.currentUser?.uid || '',
      title: `Hôn Lễ AI — ${proposal.title}`,
      status: 'draft',
      templateId: 'tpl-pastel-01',
      brideName: '',
      groomName: '',
      brideTitle: 'Cô Dâu',
      groomTitle: 'Chú Rể',
      brideParents: { father: '', mother: '' },
      groomParents: { father: '', mother: '' },
      weddingDate: '',
      weddingTime: '11:00',
      lunarDate: '',
      venueName: '',
      venueAddress: '',
      mapUrl: '',
      design: {
        fontHeading: proposal.fontHeading,
        fontBody: proposal.fontBody,
        palette: proposal.palette,
        ornamentStyle: proposal.ornamentStyle,
        envelopeColor: proposal.palette.secondary,
        envelopeLiningColor: proposal.palette.background,
        sealColor: proposal.palette.primary,
        sealInitial: 'M & B',
        heroLayout: proposal.heroLayout,
      },
      invitationMessage: proposal.invitationMessage,
      thankYouMessage: 'Sự hiện diện của quý vị là niềm vinh hạnh to lớn cho gia đình chúng tôi.',
      coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'],
      musicUrl: 'https://assets.mixkit.co/music/preview/mixkit-wedding-waltz-298.mp3',
      sectionsVisibility: {
        cover: true,
        countdown: true,
        parents: true,
        eventInfo: true,
        loveStory: true,
        timeline: true,
        gallery: true,
        rsvp: true,
        wishes: true,
        giftBox: true,
        map: true,
      },
      loveStories: [
        {
          id: 'story-1',
          yearOrDate: '',
          title: 'Lần Đầu Gặp Gỡ',
          description: 'Những ánh mắt đầu tiên trao nhau và bắt đầu một hành trình yêu thương.',
        },
        {
          id: 'story-2',
          yearOrDate: '',
          title: 'Lời Hứa Nguyện Ước',
          description: 'Khoảnh khắc trao chiếc nhẫn ước định ngày về chung một mái nhà.',
        },
      ],
      timelineEvents: [
        { id: 'time-1', time: '10:30', title: 'Đón Khách', description: 'Đón tiếp quý khách và chụp hình lưu niệm.' },
        { id: 'time-2', time: '11:30', title: 'Làm Lễ', description: 'Nghi thức trao nhẫn và cắt bánh cưới.' },
        { id: 'time-3', time: '12:00', title: 'Khai Tiệc', description: 'Bữa tiệc mừng hạnh phúc cùng gia đình hai bên.' },
      ],
      giftBank: {
        enabled: false,
        bankName: 'TPBank',
        accountNumber: '87583868888',
        accountHolder: 'TRAN MINH TIEN',
        note: 'Mừng cưới',
      },
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActiveInvitation(draftInv);
    setIsAIDesignerOpen(false);
    setCurrentView('builder');
    window.history.pushState({}, '', '/builder/new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open public invite view
  const handleOpenPublicInvite = async (slug: string) => {
    const inv = await fetchInvitationBySlug(slug);
    if (inv) {
      setPublicGuestId(undefined);
      setSandboxLabel(undefined);
      setPublicInvitation(inv);
      setCurrentView('invite');
      window.history.pushState({}, '', `/invite/${slug}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <ThemeProvider userTheme={currentUser?.theme}>
      <div className="min-h-screen flex flex-col bg-[#FFFBF7] dark:bg-[#1F1A1F] text-[#453C45] dark:text-[#F5EDE8] transition-colors duration-200">
        {/* Universal Top Navigation (Hidden in standalone public invitation) */}
        {currentView !== 'invite' && (
          <Navbar
            currentView={currentView}
            onNavigate={navigateTo}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenAIDesigner={() => setIsAIDesignerOpen(true)}
            onSignOut={() => {
              setCurrentUser(null);
              navigateTo('home');
            }}
          />
        )}

        {/* Main View Router */}
        <main className="flex-1">
          <Suspense
            fallback={
              <div className="min-h-[60vh] flex items-center justify-center text-sm text-[#827580]">
                <span className="w-6 h-6 mr-2 rounded-full border-2 border-[#C76A82] border-t-transparent animate-spin" /> Đang tải…
              </div>
            }
          >
          {currentView === 'home' && (
            <HomePage
              onNavigate={navigateTo}
              onSelectTemplate={handleSelectTemplate}
              onOpenAIDesigner={() => setIsAIDesignerOpen(true)}
            />
          )}

          {currentView === 'templates' && (
            <TemplateGallery
              key={templateType || 'init'}
              initialEventType={templateType}
              onSelectTemplate={handleSelectTemplate}
              onOpenAIDesigner={() => setIsAIDesignerOpen(true)}
            />
          )}

          {currentView === 'builder' && activeInvitation && (
            <InvitationBuilder
              initialInvitation={activeInvitation}
              currentUser={currentUser}
              onRequireAuth={() => setIsAuthModalOpen(true)}
              onNavigate={(view) => navigateTo(view)}
              onSaveSuccess={(saved) => setActiveInvitation(saved)}
              onOpenAIDesigner={() => setIsAIDesignerOpen(true)}
              onNavigateBack={() => navigateTo('dashboard')}
            />
          )}

          {currentView === 'invite' && publicInvitation && (
            <PublicInvitationView
              key={publicInvitation.id + (publicGuestId || '')}
              invitation={publicInvitation}
              onBackToHome={() => navigateTo('home')}
              isPreviewMode={false}
              guestId={publicGuestId}
              sandboxLabel={sandboxLabel}
            />
          )}

          {currentView === 'invite' && !publicInvitation && (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-sm text-[#827580] p-6 text-center">
              {publicNotFound ? (
                <>
                  <p>Không tìm thấy thiệp hoặc thiệp chưa được xuất bản.</p>
                  <button onClick={() => navigateTo('home')} className="underline text-[#C76A82] cursor-pointer">
                    Về trang chủ
                  </button>
                </>
              ) : (
                <p>Đang mở thiệp cưới…</p>
              )}
            </div>
          )}

          {currentView === 'dashboard' && currentUser && (
            <DashboardView
              currentUser={currentUser}
              onUserUpdated={(updated) => setCurrentUser(updated)}
              onEditInvitation={async (inv) => {
                try {
                  const fresh = await fetchInvitationById(inv.id);
                  setActiveInvitation(fresh || inv);
                } catch {
                  setActiveInvitation(inv);
                }
                setCurrentView('builder');
                window.history.pushState({}, '', `/builder/${inv.id}`);
              }}
              onNavigateToTemplates={() => navigateTo('templates')}
              onOpenPublicInvite={handleOpenPublicInvite}
            />
          )}

          {currentView === 'admin' && currentUser?.role === 'admin' && (
            <AdminView
              onBackToHome={() => navigateTo('home')}
              onOpenPublicInvite={handleOpenPublicInvite}
            />
          )}

          {(currentView === 'terms' || currentView === 'privacy' || currentView === 'refund') && (
            <LegalPages
              page={currentView as 'terms' | 'privacy' | 'refund'}
              onBack={() => navigateTo('home')}
              onNavigatePage={(p) => navigateTo(p)}
            />
          )}
          </Suspense>
        </main>

        {/* Global Footer (Hidden in standalone public invitation and builder) */}
        {currentView !== 'invite' && currentView !== 'builder' && (
          <Footer onNavigate={navigateTo} />
        )}

        {/* Global AI Designer Modal */}
        <AIDesignerModal
          isOpen={isAIDesignerOpen}
          onClose={() => setIsAIDesignerOpen(false)}
          onApplyProposal={handleApplyAIProposal}
        />

        {/* Global Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onOpenLegal={(page) => {
            setIsAuthModalOpen(false);
            navigateTo(page);
          }}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            if (user.role === 'admin') {
              navigateTo('admin');
            } else {
              navigateTo('dashboard');
            }
          }}
        />
      </div>
    </ThemeProvider>
  );
}
