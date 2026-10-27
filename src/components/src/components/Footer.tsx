import React from 'react';
import { Heart, QrCode, Sparkles, Shield, Mail } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#FAF4F0] dark:bg-[#1A161A] border-t border-[#E8B7C8]/30 dark:border-[#3D333D] pt-16 pb-12 text-[#453C45] dark:text-[#F5EDE8] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#E8B7C8]/25 dark:border-[#3D333D]">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <button onClick={() => onNavigate('home')} className="cursor-pointer block text-left">
              <img
                src="/assets/aistudio/thiep-online_1c938423.png"
                alt="Thiệp Online — THIEPONL"
                className="h-12 w-auto object-contain"
              />
            </button>
            <p className="text-sm text-[#827580] dark:text-[#B9A9B4] leading-relaxed">
              Gửi lời yêu thương — Lưu giữ khoảnh khắc. Nền tảng tự tạo thiệp cưới điện tử tinh tế chuẩn phong cách Pastel Luxury cho các cặp đôi Việt Nam.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#827580] dark:text-[#B9A9B4]">
              <Shield className="w-4 h-4 text-[#607B64] dark:text-[#A7D8AF]" />
              <span>Bảo mật thông tin & Hỗ trợ chuyển khoản VietQR</span>
            </div>
          </div>

          {/* Col 2: Fast Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#453C45] dark:text-[#F5EDE8] mb-4">
              Khám Phá
            </h4>
            <ul className="space-y-2.5 text-sm text-[#827580] dark:text-[#B9A9B4]">
              <li>
                <button onClick={() => onNavigate('templates')} className="hover:text-[#C76A82] dark:hover:text-[#E8B7C8] transition-colors cursor-pointer">
                  22+ Mẫu Thiệp Mới Nhất
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('templates')} className="hover:text-[#C76A82] dark:hover:text-[#E8B7C8] transition-colors cursor-pointer">
                  Mẫu Thiệp Pastel Luxury
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('templates')} className="hover:text-[#C76A82] dark:hover:text-[#E8B7C8] transition-colors cursor-pointer">
                  Mẫu Thiệp Hàn Quốc Minimal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('templates')} className="hover:text-[#C76A82] dark:hover:text-[#E8B7C8] transition-colors cursor-pointer">
                  Mẫu Thiệp Truyền Thống Áo Dài
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Features & Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#453C45] dark:text-[#F5EDE8] mb-4">
              Tính Năng Nổi Bật
            </h4>
            <ul className="space-y-2.5 text-sm text-[#827580] dark:text-[#B9A9B4]">
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C76A82] dark:text-[#E8B7C8]" />
                <span>AI Wedding Designer</span>
              </li>
              <li className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#607B64] dark:text-[#A7D8AF]" />
                <span>Tạo & Tải Mã QR Thiệp Đẹp</span>
              </li>
              <li>
                <span>Xác Nhận Tham Dự (RSVP) Trực Tiếp</span>
              </li>
              <li>
                <span>Sổ Lưu Bút & Hộp Mừng Cưới VietQR</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Help */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#453C45] dark:text-[#F5EDE8] mb-4">
              Hỗ Trợ Khách Hàng
            </h4>
            <p className="text-sm text-[#827580] dark:text-[#B9A9B4] mb-3 leading-relaxed">
              Đội ngũ thiết kế luôn sẵn sàng đồng hành cùng bạn tạo nên tấm thiệp cưới hoàn hảo nhất.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#453C45] dark:text-[#F5EDE8] font-medium">
              <Mail className="w-4 h-4 text-[#C76A82] dark:text-[#E8B7C8]" />
              <span>hotro@thieponl.vn</span>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8B7C8]/20 dark:border-[#3D333D] flex items-center gap-2 text-xs text-[#827580] dark:text-[#B9A9B4]">
              <span>Tương thích 100% iPhone, Android & Mọi Trình Duyệt</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright & legal */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#827580] dark:text-[#B9A9B4]">
          <div className="flex flex-wrap items-center gap-4">
            <p>© 2026 THIEPONL. Tất cả các quyền được bảo lưu.</p>
            <button
              onClick={() => onNavigate('terms')}
              className="hover:text-[#C76A82] dark:hover:text-[#E8B7C8] underline transition-colors cursor-pointer"
            >
              Điều Khoản Dịch Vụ
            </button>
            <button
              onClick={() => onNavigate('privacy')}
              className="hover:text-[#C76A82] dark:hover:text-[#E8B7C8] underline transition-colors cursor-pointer"
            >
              Chính Sách Bảo Mật
            </button>
            <button
              onClick={() => onNavigate('refund')}
              className="hover:text-[#C76A82] dark:hover:text-[#E8B7C8] underline transition-colors cursor-pointer"
            >
              Thanh Toán & Hoàn Tiền
            </button>
          </div>
          <div className="flex items-center gap-1">
            <span>Thiết kế bằng trọn vẹn yêu thương</span>
            <Heart className="w-3.5 h-3.5 text-[#C76A82] dark:text-[#E8B7C8] fill-current" />
            <span>dành cho các cặp đôi Việt Nam</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
