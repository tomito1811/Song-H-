import React, { useState } from 'react';
import { Sparkles, Menu, X, Heart, ShieldCheck, User, LogOut } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { effectivePlan, PLAN_LABEL } from '../data/planRules';
import { auth, fbSignOut } from '../firebase';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  currentUser?: any;
  onOpenAuth?: () => void;
  onOpenAIDesigner?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onOpenAIDesigner,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FFFBF7]/90 dark:bg-[#1F1A1F]/90 backdrop-blur-md border-b border-[#E8B7C8]/25 dark:border-[#3D333D] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4 sm:gap-8">
          {/* Zone 1: Wordmark & Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group text-left cursor-pointer whitespace-nowrap shrink-0"
          >
            <img
              src={`${import.meta.env.BASE_URL}assets/logo.webp`} width={150} height={103} decoding="async"
              alt="Thiệp Online — THIEPONL"
              className="h-11 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#453C45] dark:text-[#F5EDE8]">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-[#C76A82] dark:hover:text-[#E8B7C8] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'home' ? 'text-[#C76A82] dark:text-[#E8B7C8] font-semibold' : ''
              }`}
            >
              Trang Chủ
            </button>
            <button
              onClick={() => onNavigate('templates')}
              className={`hover:text-[#C76A82] dark:hover:text-[#E8B7C8] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'templates' ? 'text-[#C76A82] dark:text-[#E8B7C8] font-semibold' : ''
              }`}
            >
              Mẫu Thiệp
            </button>
            <button
              onClick={() => onOpenAIDesigner && onOpenAIDesigner()}
              className="hover:text-[#C76A82] dark:hover:text-[#E8B7C8] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer text-[#8A5A44] dark:text-[#E9D8BD]"
            >
              <Sparkles className="w-4 h-4 text-[#C76A82] dark:text-[#E8B7C8]" />
              Thiết Kế AI
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className={`hover:text-[#C76A82] dark:hover:text-[#E8B7C8] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'pricing' ? 'text-[#C76A82] dark:text-[#E8B7C8] font-semibold' : ''
              }`}
            >
              Bảng Giá
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className={`hover:text-[#C76A82] dark:hover:text-[#E8B7C8] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'dashboard' ? 'text-[#C76A82] dark:text-[#E8B7C8] font-semibold' : ''
              }`}
            >
              Quản Lý Thiệp
            </button>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`hover:text-[#C76A82] dark:hover:text-[#E8B7C8] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  currentView === 'admin' ? 'text-[#C76A82] dark:text-[#E8B7C8] font-semibold' : 'text-[#827580] dark:text-[#B9A9B4]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
          </nav>

          {/* Zone 3: Actions & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Theme Switcher */}
            <ThemeToggle className="hidden sm:inline-block" />

            {currentUser?.id && (
              <NotificationBell ownerId={currentUser.id} onOpenAll={() => onNavigate('dashboard')} />
            )}

            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E8B7C8]/40 dark:border-[#3D333D] hover:bg-[#F6DCE5]/30 dark:hover:bg-[#2A232A] text-xs font-medium text-[#453C45] dark:text-[#F5EDE8] transition-colors cursor-pointer"
                >
                  {currentUser.photoURL ? (
                    <span className="relative inline-flex shrink-0">
                    <img src={currentUser.photoURL} alt="" className={`w-6 h-6 rounded-full object-cover ${effectivePlan(currentUser) !== 'free' ? 'ring-2 ring-[#D4A73C]' : ''}`} />
                    {effectivePlan(currentUser) !== 'free' && (
                      <span className="absolute -bottom-1.5 -right-2 px-1 rounded text-[8px] font-black leading-[12px] text-white shadow" style={{ background: effectivePlan(currentUser) === 'luxury' ? 'linear-gradient(135deg,#B6925B,#E9C46A)' : 'linear-gradient(135deg,#C76A82,#E8546F)' }}>
                        {PLAN_LABEL[effectivePlan(currentUser)]}
                      </span>
                    )}
                  </span>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#E8B7C8]/40 dark:bg-[#E8B7C8]/20 flex items-center justify-center text-[#C76A82] dark:text-[#E8B7C8] font-bold text-xs">
                      {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  {!currentUser.photoURL && effectivePlan(currentUser) !== 'free' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black text-white" style={{ background: effectivePlan(currentUser) === 'luxury' ? 'linear-gradient(135deg,#B6925B,#E9C46A)' : 'linear-gradient(135deg,#C76A82,#E8546F)' }}>
                      {PLAN_LABEL[effectivePlan(currentUser)]}
                    </span>
                  )}
                  <span className="max-w-[110px] truncate">{currentUser.name}</span>
                  {currentUser.role === 'admin' && (
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white font-black text-[10px] tracking-wider uppercase shadow-xs">
                      ADMIN
                    </span>
                  )}
                </button>
                <button
                  onClick={async () => {
                    await fbSignOut(auth);
                    if (onSignOut) onSignOut();
                  }}
                  className="text-xs text-[#827580] dark:text-[#B9A9B4] hover:text-[#C76A82] dark:hover:text-[#E8B7C8] p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="w-4 h-4 sm:hidden" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-[#453C45] dark:text-[#F5EDE8] hover:text-[#C76A82] dark:hover:text-[#E8B7C8] transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
            )}

            <button
              onClick={() => onNavigate('templates')}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-[#D4899C] to-[#C76A82] hover:from-[#C76A82] hover:to-[#B0596E] rounded-xl shadow-xs hover:shadow transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Tạo Thiệp Cưới</span>
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#453C45] dark:text-[#F5EDE8] hover:text-[#C76A82] dark:hover:text-[#E8B7C8] rounded-lg transition-colors cursor-pointer"
              aria-label="Mở danh mục điều hướng"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E8B7C8]/30 dark:border-[#3D333D] bg-[#FFFBF7] dark:bg-[#1F1A1F] px-4 pt-2 pb-6 space-y-3 transition-colors duration-200 shadow-xl">
          {/* Mobile Theme Toggle Section */}
          <div className="pt-1 pb-2 border-b border-[#E8B7C8]/20 dark:border-[#3D333D]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#827580] dark:text-[#B9A9B4] mb-2 px-1">
              Chế độ hiển thị
            </div>
            <ThemeToggle variant="inline-buttons" />
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 text-sm font-medium text-[#453C45] dark:text-[#F5EDE8] hover:bg-[#F6DCE5]/40 dark:hover:bg-[#2A232A] rounded-lg transition-colors"
            >
              Trang Chủ
            </button>
            <button
              onClick={() => {
                onNavigate('templates');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 text-sm font-medium text-[#453C45] dark:text-[#F5EDE8] hover:bg-[#F6DCE5]/40 dark:hover:bg-[#2A232A] rounded-lg transition-colors"
            >
              Mẫu Thiệp
            </button>
            <button
              onClick={() => {
                onOpenAIDesigner && onOpenAIDesigner();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 text-sm font-medium text-[#C76A82] dark:text-[#E8B7C8] hover:bg-[#F6DCE5]/40 dark:hover:bg-[#2A232A] rounded-lg flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Tạo Thiệp Bằng AI
            </button>
            <button
              onClick={() => {
                onNavigate('pricing');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 text-sm font-medium text-[#453C45] dark:text-[#F5EDE8] hover:bg-[#F6DCE5]/40 dark:hover:bg-[#2A232A] rounded-lg transition-colors"
            >
              Bảng Giá Dịch Vụ
            </button>
            <button
              onClick={() => {
                onNavigate('dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 text-sm font-medium text-[#453C45] dark:text-[#F5EDE8] hover:bg-[#F6DCE5]/40 dark:hover:bg-[#2A232A] rounded-lg transition-colors"
            >
              Quản Lý Thiệp Cưới Của Tôi
            </button>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2.5 px-3 text-sm font-medium text-[#827580] dark:text-[#B9A9B4] hover:bg-[#F6DCE5]/40 dark:hover:bg-[#2A232A] rounded-lg flex items-center gap-2 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Khu Vực Quản Trị Admin
              </button>
            )}
          </div>

          {/* User action in mobile menu */}
          <div className="pt-2 border-t border-[#E8B7C8]/20 dark:border-[#3D333D]">
            {currentUser ? (
              <div className="flex items-center justify-between px-1 py-1">
                <div className="flex items-center gap-2 text-xs text-[#453C45] dark:text-[#F5EDE8] font-medium">
                  {currentUser.photoURL ? (
                    <span className="relative inline-flex shrink-0">
                    <img src={currentUser.photoURL} alt="" className={`w-6 h-6 rounded-full object-cover ${effectivePlan(currentUser) !== 'free' ? 'ring-2 ring-[#D4A73C]' : ''}`} />
                    {effectivePlan(currentUser) !== 'free' && (
                      <span className="absolute -bottom-1.5 -right-2 px-1 rounded text-[8px] font-black leading-[12px] text-white shadow" style={{ background: effectivePlan(currentUser) === 'luxury' ? 'linear-gradient(135deg,#B6925B,#E9C46A)' : 'linear-gradient(135deg,#C76A82,#E8546F)' }}>
                        {PLAN_LABEL[effectivePlan(currentUser)]}
                      </span>
                    )}
                  </span>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#E8B7C8]/40 dark:bg-[#E8B7C8]/20 flex items-center justify-center text-[#C76A82] dark:text-[#E8B7C8] font-bold text-xs">
                      {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  {!currentUser.photoURL && effectivePlan(currentUser) !== 'free' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black text-white" style={{ background: effectivePlan(currentUser) === 'luxury' ? 'linear-gradient(135deg,#B6925B,#E9C46A)' : 'linear-gradient(135deg,#C76A82,#E8546F)' }}>
                      {PLAN_LABEL[effectivePlan(currentUser)]}
                    </span>
                  )}
                  <span>{currentUser.name}</span>
                  {currentUser.role === 'admin' && (
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white font-black text-[10px] tracking-wider uppercase shadow-xs">
                      ADMIN
                    </span>
                  )}
                </div>
                <button
                  onClick={async () => {
                    await fbSignOut(auth);
                    if (onSignOut) onSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-[#827580] dark:text-[#B9A9B4] hover:text-[#C76A82] dark:hover:text-[#E8B7C8] font-medium px-2 py-1 rounded transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth && onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-2 px-3 text-sm font-semibold text-[#453C45] dark:text-[#F5EDE8] hover:bg-[#F6DCE5]/40 dark:hover:bg-[#2A232A] rounded-lg transition-colors"
              >
                Đăng nhập / Đăng ký
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
