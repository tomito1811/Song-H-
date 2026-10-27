/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { TemplateGallery } from './components/TemplateGallery';
import { InvitationBuilder } from './components/InvitationBuilder';
import { PublicInvitationView } from './components/PublicInvitationView';
import { DashboardView } from './components/DashboardView';
import { AdminView } from './components/AdminView';
import { AIDesignerModal } from './components/AIDesignerModal';
import { AuthModal } from './components/AuthModal';
import { LegalPages } from './components/LegalPages';
import { WeddingInvitation, WeddingTemplate, AIDesignProposal, User } from './types/wedding';
import { WEDDING_TEMPLATES } from './data/templates';
import { fetchInvitationBySlug, fetchInvitationById, createInvitation, getCurrentUser } from './utils/api';
import { auth, onAuthStateChanged } from './firebase';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeInvitation, setActiveInvitation] = useState<WeddingInvitation | null>(null);
  const [publicInvitation, setPublicInvitation] = useState<WeddingInvitation | null>(null);

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
      const slug = path.replace('/invite/', '').split('/')[0];
      if (slug) {
        fetchInvitationBySlug(slug)
          .then((inv) => {
            if (inv) {
              setPublicInvitation(inv);
              setCurrentView('invite');
            }
          })
          .catch((err) => {
            console.warn('Could not load public invitation:', err);
          });
      }
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
      window.history.pushState({}, '', '/templates');
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
    const draftInv: WeddingInvitation = {
      id: `draft-${Date.now()}`,
      slug: '',
      userId: currentUser?.id || auth.currentUser?.uid || '',
      title: 'Thiệp Cưới Mới',
      status: 'draft',
      templateId: template.id,
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
      invitationMessage: template.defaultInvitationMessage,
      thankYouMessage: template.defaultThankYouMessage,
      coverImage: template.preview,
      galleryImages: [template.preview],
      musicUrl: 'https://assets.mixkit.co/music/preview/mixkit-wedding-waltz-298.mp3',
      design: template.design,
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
          {currentView === 'home' && (
            <HomePage
              onNavigate={navigateTo}
              onSelectTemplate={handleSelectTemplate}
              onOpenAIDesigner={() => setIsAIDesignerOpen(true)}
            />
          )}

          {currentView === 'templates' && (
            <TemplateGallery
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
              invitation={publicInvitation}
              onBackToHome={() => navigateTo('home')}
              isPreviewMode={false}
            />
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
