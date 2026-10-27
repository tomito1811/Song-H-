import React from 'react';
import { ArrowLeft, Shield, FileText, RefreshCw } from 'lucide-react';

interface LegalPagesProps {
  page: 'terms' | 'privacy' | 'refund';
  onBack: () => void;
  onNavigatePage: (page: 'terms' | 'privacy' | 'refund') => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({ page, onBack, onNavigatePage }) => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#827580] dark:text-[#B9A9B4] hover:text-[#C76A82] dark:hover:text-[#E8B7C8] mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại trang chủ
      </button>

      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-200 dark:border-[#3D333D] mb-8 gap-4 sm:gap-8 overflow-x-auto">
        <button
          onClick={() => onNavigatePage('terms')}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap transition-colors ${
            page === 'terms'
              ? 'border-[#C76A82] dark:border-[#E8B7C8] text-[#C76A82] dark:text-[#E8B7C8]'
              : 'border-transparent text-[#827580] dark:text-[#B9A9B4] hover:text-[#453C45] dark:hover:text-[#F5EDE8]'
          }`}
        >
          <FileText className="w-4 h-4" />
          Điều Khoản Dịch Vụ
        </button>
        <button
          onClick={() => onNavigatePage('privacy')}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap transition-colors ${
            page === 'privacy'
              ? 'border-[#C76A82] dark:border-[#E8B7C8] text-[#C76A82] dark:text-[#E8B7C8]'
              : 'border-transparent text-[#827580] dark:text-[#B9A9B4] hover:text-[#453C45] dark:hover:text-[#F5EDE8]'
          }`}
        >
          <Shield className="w-4 h-4" />
          Chính Sách Bảo Mật
        </button>
        <button
          onClick={() => onNavigatePage('refund')}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap transition-colors ${
            page === 'refund'
              ? 'border-[#C76A82] dark:border-[#E8B7C8] text-[#C76A82] dark:text-[#E8B7C8]'
              : 'border-transparent text-[#827580] dark:text-[#B9A9B4] hover:text-[#453C45] dark:hover:text-[#F5EDE8]'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Thanh Toán & Hoàn Tiền
        </button>
      </div>

      {/* Terms of Service Content */}
      {page === 'terms' && (
        <article className="prose prose-neutral max-w-none text-[#453C45] space-y-6 text-sm leading-relaxed">
          <header className="pb-4 border-b border-neutral-100">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45]">
              Điều Khoản Dịch Vụ THIEPONL
            </h1>
            <p className="text-xs text-[#827580] mt-1">Cập nhật lần cuối: Ngày 26 tháng 10 năm 2026</p>
          </header>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-[#453C45]">1. Giới thiệu và Phạm vi áp dụng</h2>
            <p>
              Chào mừng bạn đến với THIEPONL (Thiệp Online). Bằng việc truy cập hoặc sử dụng trang web và dịch vụ của chúng tôi, bạn đồng ý tuân thủ các Điều khoản Dịch vụ này. Nếu bạn không đồng ý với bất kỳ phần nào, vui lòng không sử dụng dịch vụ.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-[#453C45]">2. Tài khoản và Bảo mật</h2>
            <p>
              Người dùng đăng nhập an toàn thông qua tài khoản Google xác thực qua Firebase. Bạn có trách nhiệm bảo mật tài khoản của mình và thông báo ngay lập tức cho chúng tôi nếu phát hiện bất kỳ hành vi truy cập trái phép nào.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-[#453C45]">3. Bản quyền và Nội dung người dùng</h2>
            <p>
              Bạn giữ toàn quyền sở hữu đối với các hình ảnh, câu chuyện tình yêu và thông tin đám cưới mà bạn tải lên. Bạn cam kết rằng bạn có quyền hợp pháp đối với mọi tài liệu tải lên và không vi phạm bản quyền hay quyền riêng tư của bên thứ ba.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-[#453C45]">4. Giới hạn dịch vụ và Gói thành viên</h2>
            <p>
              THIEPONL cung cấp các gói dịch vụ Free, Premium và Luxury. Mỗi gói có quyền lợi và giới hạn được công bố rõ ràng tại bảng giá. Chúng tôi có quyền điều chỉnh tính năng để nâng cao chất lượng dịch vụ mà không làm ảnh hưởng đến quyền lợi đã kích hoạt của khách hàng.
            </p>
          </section>
        </article>
      )}

      {/* Privacy Policy Content */}
      {page === 'privacy' && (
        <article className="prose prose-neutral max-w-none text-[#453C45] space-y-6 text-sm leading-relaxed">
          <header className="pb-4 border-b border-neutral-100">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45]">
              Chính Sách Bảo Mật Quyền Riêng Tư
            </h1>
            <p className="text-xs text-[#827580] mt-1">Cập nhật lần cuối: Ngày 26 tháng 10 năm 2026</p>
          </header>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-[#453C45]">1. Thông tin chúng tôi thu thập</h2>
            <p>
              Khi bạn đăng nhập bằng Google, chúng tôi nhận các thông tin công khai cơ bản: Địa chỉ Email, Tên hiển thị và Ảnh đại diện (nếu có). Chúng tôi không lưu trữ hoặc có quyền truy cập mật khẩu Google của bạn.
            </p>
            <p>
              Chúng tôi lưu trữ thông tin thiệp cưới (họ tên cô dâu chú rể, ngày cưới, địa điểm, ảnh cưới) và danh sách khách mời, phản hồi RSVP theo sự quản lý của bạn.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-[#453C45]">2. Mục đích sử dụng thông tin</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Xuất bản trang web thiệp cưới theo đường link cá nhân hóa và mã QR của bạn.</li>
              <li>Hiển thị danh sách khách mời tham dự và lời chúc mừng hạnh phúc.</li>
              <li>Xác thực giao dịch chuyển khoản qua SePay TPBank và kích hoạt gói bản quyền.</li>
              <li>Gửi email biên nhận thanh toán và thông báo trạng thái thiệp.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-[#453C45]">3. Cam kết bảo mật</h2>
            <p>
              Dữ liệu được lưu trữ an toàn trên hạ tầng Google Cloud Firestore với các lớp phân quyền Security Rules nghiêm ngặt. Chúng tôi cam kết tuyệt đối không bán hoặc chia sẻ thông tin cá nhân của bạn cho bên thứ ba vì mục đích tiếp thị.
            </p>
          </section>
        </article>
      )}

      {/* Payment and Refund Policy */}
      {page === 'refund' && (
        <article className="prose prose-neutral max-w-none text-[#453C45] space-y-6 text-sm leading-relaxed">
          <header className="pb-4 border-b border-neutral-100">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45]">
              Chính Sách Thanh Toán & Hoàn Tiền
            </h1>
            <p className="text-xs text-[#827580] mt-1">Cập nhật lần cuối: Ngày 26 tháng 10 năm 2026</p>
          </header>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-[#453C45]">1. Phương thức thanh toán VietQR</h2>
            <p>
              THIEPONL hỗ trợ thanh toán chuyển khoản ngân hàng thông minh 24/7 qua cổng tự động SePay liên kết ngân hàng TPBank (Ngân Hàng Tiên Phong).
            </p>
            <div className="bg-[#FAF6F8] p-4 rounded-xl border border-[#E8B7C8]/40 space-y-2">
              <p className="font-semibold text-xs text-[#453C45]">Thông tin tài khoản nhận thanh toán chính thức:</p>
              <ul className="text-xs space-y-1 text-[#453C45]">
                <li>• Ngân hàng: <strong>TPBank (Ngân Hàng Tiên Phong)</strong></li>
                <li>• Chủ tài khoản: <strong>TRAN MINH TIEN</strong></li>
                <li>• Số tài khoản: <strong>8758 3868 888</strong></li>
                <li>• Cú pháp chuyển khoản: <strong>Mã đơn hàng hiển thị tại màn hình thanh toán (Ví dụ: TOP8F2K9M)</strong></li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-[#453C45]">2. Thời gian kích hoạt gói dịch vụ</h2>
            <p>
              Hệ thống webhook SePay tự động kiểm tra và nâng cấp gói trong vòng 5 - 30 giây ngay khi nhận được biến động số dư khớp mã tham chiếu. Trong trường hợp quý khách chuyển khoản sai nội dung hoặc thiếu tiền, đội ngũ Admin sẽ hỗ trợ duyệt tay trong vòng 15 phút.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-[#453C45]">3. Chính sách hoàn tiền</h2>
            <p>
              Do tính chất là sản phẩm dịch vụ phần mềm số được kích hoạt tức thì, chúng tôi hỗ trợ hoàn tiền 100% trong vòng <strong>24 giờ</strong> kể từ thời điểm thanh toán nếu hệ thống gặp sự cố kỹ thuật nghiêm trọng không thể khắc phục hoặc quý khách vô tình chuyển khoản trùng lặp 2 lần cho cùng một gói.
            </p>
            <p>
              Vui lòng liên hệ hỗ trợ kèm ảnh chụp biên lai ngân hàng qua email hỗ trợ hoặc hotline để được xử lý nhanh nhất.
            </p>
          </section>
        </article>
      )}
    </div>
  );
};
