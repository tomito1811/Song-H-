# THIEPONL — Nền Tảng Thiệp Cưới Điện Tử & AI Wedding Designer

Thiết kế và phát triển nền tảng SaaS hoàn chỉnh **THIEPONL** (Thiệp Online) dành riêng cho các cặp đôi tại Việt Nam, mang đến giải pháp tự tạo thiệp cưới điện tử tinh tế theo phong cách **Pastel Luxury & Korean Minimal**, xuất bản website đám cưới tương tác độc lập (kèm RSVP, sổ lưu bút, đếm ngược, câu chuyện tình yêu, album ảnh, mã QR) và module thiết kế thông minh bằng Gemini 2.5 Flash.

> [!IMPORTANT]
> **Quyết định đã thống nhất & Cấu hình cốt lõi:**
> - **Lưu trữ dữ liệu & Xác thực**: Hệ thống máy chủ Full-Stack Express với database adapter bền vững (lưu trữ file JSON/data persistent theo schema chuẩn hoá), mật khẩu mã hóa an toàn, phân quyền rõ ràng theo vai trò (Guest, Couple/User, Admin).
> - **AI Wedding Designer**: Tích hợp server-side Gemini API (mô hình `gemini-3.8-flash`) tại proxy endpoint `/api/ai/design` với bộ prompt schema JSON nghiêm ngặt và cơ chế Fallback Presets thông minh khi chưa có API key để bảo đảm 100% người dùng luôn trải nghiệm mượt mà không lỗi.
> - **Phân bổ thư viện mẫu (20+ Templates)**: Tập trung vào thẩm mỹ Pastel Luxury (Hồng phấn, Rose Gold, Lavender, Sage Green, Champagne) và Korean Minimal hiện đại, thanh lịch, chuẩn typography tiếng Việt.

---

## 1. Tổng Quan & Trải Nghiệm Cốt Lõi

- **Mục tiêu sản phẩm**: Giúp các cặp đôi Việt Nam tạo thiệp cưới số chỉ trong 3-5 phút với giao diện sang trọng, không cần kiến thức thiết kế hay lập trình.
- **Đối tượng người dùng**:
  - *Cặp đôi (Chủ tiệc)*: Chọn mẫu, tùy biến nội dung, tải ảnh, xuất bản website thiệp cưới riêng biệt, quản lý danh sách khách và theo dõi xác nhận tham dự (RSVP).
  - *Khách mời*: Mở liên kết thiệp cá nhân trên điện thoại/máy tính, xem câu chuyện tình yêu, xác nhận tham dự, gửi lời chúc mừng cưới, thêm sự kiện vào lịch và quét QR mừng cưới.
  - *Quản trị viên (Admin)*: Quản lý mẫu thiệp, danh mục, thành viên, duyệt lời chúc, theo dõi gói dịch vụ và đơn hàng chuyển khoản.
- **Giá trị cốt lõi**:
  - Tiết kiệm 80% chi phí in thiệp giấy truyền thống.
  - Trải nghiệm di động tối ưu vượt trội (tỉ lệ 9:16 mobile-first), vuốt chạm êm ái, tương tác cảm xúc.
  - Tích hợp công nghệ AI hỗ trợ gợi ý văn phong lời mời và phối màu thiệp cưới chuẩn gu.

---

## 2. Giao Diện & Trải Nghiệm Người Dùng (Pastel Luxury)

### Định hướng thẩm mỹ & Màu sắc
Tuân thủ nguyên tắc 60-30-10 và chuẩn mực anti-slop của Design System:
- **60% Nền chủ đạo (Neutral Canvas)**: Trắng kem sang trọng (`#FFFBF7`), ngà tự nhiên, gradient kem pastel phớt nhẹ.
- **30% Cấu trúc & Bề mặt (Structural Surfaces)**: Hồng phấn nhạt (`#F6DCE5`), Rose Pastel (`#E8B7C8`), Xanh xô thơm Sage (`#DCE8D8`), Champagne ánh vàng (`#E9D8BD`), hoa văn viền hairline tinh xảo.
- **10% Điểm nhấn hành động (Accent Budget)**: Đỏ hồng vang tinh tế hoặc Rose Gold ánh kim mờ, chữ Dark Charcoal mềm mại (`#453C45`) và Muted Gray Rose (`#827580`) bảo đảm độ tương phản WCAG AA.
- **Typography**:
  - Display / Tiêu đề: *Playfair Display* & *Cormorant Garamond* (serif thanh thoát lãng mạn, dấu tiếng Việt chuẩn xác).
  - Body / Nội dung: *Be Vietnam Pro* / *Plus Jakarta Sans* (rõ nét, dễ đọc trên màn hình di động cỡ nhỏ).
  - Tabular & Số liệu: Phông số đếm ngược thời gian và ngày tháng dùng tabular figures cân xứng.

### Hành trình người dùng chính (Core User Flows)
1. **Khám phá & Chọn mẫu**: Trang chủ giới thiệu → Thư viện 20+ mẫu thiệp phân loại rõ ràng (Pastel, Hàn Quốc, Hoa cỏ, Tối giản, Cổ điển) → Tìm kiếm, xem trước trực tiếp Desktop/Mobile.
2. **Trình tạo thiệp tương tác (Invitation Builder)**:
   - Sidebar công cụ 4 tab: *Thông tin cặp đôi & Lễ cưới*, *Tùy biến phong cách (màu, font, họa tiết)*, *Album ảnh & Nhạc nền*, *Tính năng bổ sung (RSVP, Sổ lưu bút, Đếm ngược, QR chuyển khoản)*.
   - Khu vực xem trước trung tâm (Live Interactive Preview) phản hồi tức thì với chế độ mô phỏng khung điện thoại iPhone/Android và toàn màn hình.
   - Thanh công cụ phía trên: Hoàn tác (Undo), Làm lại (Redo), Lưu nháp, Xuất bản (Publish).
3. **Website thiệp cưới riêng tư (`/invite/:slug`)**:
   - Hiệu ứng mở phong bì thiệp lãng mạn (Seal Opening Animation).
   - Đếm ngược thời gian đến ngày trọng đại.
   - Thông tin gia đình hai bên & Lịch trình hôn lễ chi tiết.
   - Bản đồ dẫn đường qua Google Maps.
   - Album ảnh cưới tương tác Lightbox mượt mà.
   - Form xác nhận tham dự (RSVP) tức thì không bắt buộc đăng nhập.
   - Sổ lưu bút số kèm thông điệp chúc phúc.
   - Hộp mừng cưới quét mã VietQR kèm số tài khoản tùy chọn của cô dâu chú rể.
4. **AI Wedding Designer**: Nhập tên cô dâu & chú rể + sở thích phong cách → Gemini API phân tích và tạo ngay 3 phương án thiết kế độc bản (layout, thi văn thiệp cưới, bảng màu) có thể chọn để tiếp tục biên tập.
5. **Bảng điều khiển (Dashboard)**: Theo dõi số lượng khách xác nhận, tỉ lệ đi xe/ăn chay, xuất file Excel/CSV, quản lý các thiệp cưới đã tạo.

---

## 3. Kiến Trúc Kỹ Thuật & Quyết Định Sản Phẩm

### Quyết định kiến trúc & Cơ sở lý luận
1. **Full-Stack Express + Vite React SPA**:
   - Express backend chạy trực tiếp trên cùng cổng 3000 phục vụ API (`/api/*`) và giao diện SPA, bảo đảm bảo mật cho `GEMINI_API_KEY` (không lộ ra browser bundle).
   - Hệ thống lưu trữ dữ liệu bền vững `src/server/db.json` với cơ chế read/write atomic và backup tự động, cung cấp đầy đủ các quan hệ: Users, Templates, Invitations, Guests, RSVPs, Wishes, Orders, Settings.
2. **Cơ chế Adapter dữ liệu mô-đun hóa (Database Service Pattern)**:
   - Toàn bộ thao tác cơ sở dữ liệu được bao bọc trong service adapter chuẩn hóa (`invitationService`, `userService`, `guestService`, `aiService`), cho phép mở rộng sang Firestore hoặc PostgreSQL khi cần chỉ với một cờ cấu hình môi trường.
3. **Tối ưu Mobile-First & SEO**:
   - Thẻ `<head>` đồng bộ meta title, OpenGraph tags, JSON-LD Schema `Event/WeddingEvent` cho các trang thiệp công khai.
   - Trình nghe nhạc nền tôn trọng chính sách Autoplay của trình duyệt di động: chỉ phát sau tương tác mở thiệp (User Gesture) và luôn có nút bật/tắt nổi tĩnh.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          THIEPONL PLATFORM                             │
├────────────────────────────────────────────────────────────────────────┤
│                           FRONTEND (React + TS)                        │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐ ┌───────────────┐ │
│  │ Landing Page │ │ Template Hub  │ │ AI Designer  │ │ User / Admin  │ │
│  │ & Pricing    │ │ (20+ Designs) │ │ (3 Proposals)│ │ Dashboard     │ │
│  └──────┬───────┘ └───────┬───────┘ └──────┬───────┘ └───────┬───────┘ │
│         │                 │                │                 │         │
│         └────────┬────────┴────────────────┴────────┬────────┘         │
│                  ▼                                  ▼                  │
│       ┌──────────────────────┐           ┌──────────────────────┐      │
│       │  Invitation Builder  │           │  Public Wedding Site │      │
│       │ (Live Mobile Preview)│           │  (/invite/:slug)     │      │
│       └──────────┬───────────┘           └──────────┬───────────┘      │
├──────────────────┼──────────────────────────────────┼──────────────────┤
│                  ▼                                  ▼                  │
│           REST API Calls                     REST API Calls            │
│                  │                                  │                  │
├──────────────────┼──────────────────────────────────┼──────────────────┤
│                  ▼                                  ▼                  │
│                        BACKEND SERVER (Express)                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Route Handlers:                                                  │  │
│  │ • /api/templates    • /api/invitations   • /api/rsvps            │  │
│  │ • /api/wishes       • /api/guests        • /api/auth             │  │
│  │ • /api/ai/design (Gemini 2.5 Flash with fallback presets)        │  │
│  │ • /api/orders & payments (VietQR Bank Transfer flow)             │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│                 ┌───────────────────────────────────────┐              │
│                 │ Persistent Data Store & Asset Storage │              │
│                 │ (Users, Invitations, RSVPs, Wishes)   │              │
│                 └───────────────────────────────────────┘              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Kế Hoạch Triển Khai Chi Tiết (Implementation Roadmap)

### Giai đoạn 1: Khung kiến trúc, Design System & Thư viện mẫu
- Thiết lập bảng mã màu CSS pastel luxury, typography Playfair Display & Be Vietnam Pro.
- Xây dựng kho dữ liệu 20+ mẫu thiệp cưới phong phú:
  1. *Hương Sắc Mùa Yêu (Pastel Romantic)*
  2. *Thanh Xuân Dịu Êm (Korean Minimalist)*
  3. *Vườn Hoa Địa Đàng (Floral Garden Luxury)*
  4. *Rượu Mừng Champagne (Champagne Elegance)*
  5. *Áo Dài Truyền Thống (Traditional Royal Red & Gold)*
  6. *Biển Vắng Chiều Hoàng Hôn (Sunset Beach Romance)*
  7. *Tình Nồng Cổ Điển (Vintage Parisian Romance)*
  8. *Tối Giản Hiện Đại (Modern Typographic Clean)*
  9. *Sắc Tím Oải Hương (Lavender Dream)*
  10. *Khu Vườn Cổ Tích (Sage Green Botanic)*
  11. *Hoa Anh Đào Nở Rộ (Blossom Whisper)*
  12. *Dạ Tiệc Tinh Tú (Starlight Gala Luxury)*
  13. *Đồng Cỏ Mùa Thu (Boho Chic Rustic)*
  14. *Cung Đình Hoàng Gia (Heritage Royal Vietnamese)*
  15. *Nốt Nhạc Tình Yêu (Editorial Classic Noir & Cream)*
  16. *Khuê Các Đoan Trang (Blush Peony Palace)*
  17. *Hồ Thu Lặng Gió (Nordic Calm Mist)*
  18. *Ban Mai Rực Rỡ (Golden Hour Glow)*
  19. *Thơ Mộng Đà Lạt (Pine & Mist Romantic)*
  20. *Mãi Mãi Bên Nhau (Modern Monochrome Luxury)*
  21. *Vườn Hồng Ban Mai (Rose Gold Symphony)*
  22. *Tình Ca Mùa Xuân (Spring Blossom)*

### Giai đoạn 2: Trình Tạo Thiệp Cưới Trực Quan (Invitation Builder)
- Trình chỉnh sửa đa năng với cấu trúc Section:
  - Header & Lời mở đầu
  - Tên cô dâu chú rể & Ảnh đại diện đôi
  - Thông điệp mời cưới & Gia đình hai bên
  - Thời gian, địa điểm tổ chức & Bản đồ định vị
  - Đếm ngược thời gian đám cưới (Wedding Countdown)
  - Album ảnh cưới (Wedding Photo Gallery)
  - Biểu mẫu RSVP khách mời
  - Sổ lưu bút chúc mừng
  - Thông tin mừng cưới (VietQR Code & Số tài khoản ngân hàng)
- Chế độ xem trước thời gian thực (Desktop & Khung mô phỏng điện thoại di động).
- Hỗ trợ đổi theme, font chữ, màu nền, họa tiết viền, và sắp xếp bật/tắt từng section.

### Giai đoạn 3: Website Thiệp Cưới Cá Nhân Hóa (`/invite/:slug`)
- Trang thiệp công khai tối ưu hóa di động, hiệu ứng mở phong bì sang trọng.
- Xử lý xác nhận tham dự (RSVP) lưu dữ liệu lập tức vào hệ thống.
- Gửi lời chúc mừng cưới thời gian thực, có bộ lọc chống spam cơ bản.
- Tính năng chia sẻ: Sao chép liên kết, tạo mã QR tùy chỉnh kèm khung tải ảnh QR sắc nét.
- Nhạc nền cưới nhẹ nhàng với nút điều khiển nổi (Floating Player).

### Giai đoạn 4: AI Wedding Designer Module
- Server proxy `/api/ai/design` kết nối Google GenAI SDK (`gemini-3.8-flash`).
- Sinh 3 phương án phối màu, layout và lời mời văn phong tiếng Việt sâu sắc dựa trên tên cặp đôi và phong cách yêu thích.
- Dự phòng thông minh (Fallback Presets) khi API Key chưa cấu hình hoặc bị giới hạn lượt gọi.

### Giai đoạn 5: Hệ Thống Người Dùng, Khách Mời & Admin Management
- Xác thực đăng ký, đăng nhập tài khoản (JWT/Session token).
- Dashboard quản lý thiệp cưới của tôi, sao chép liên kết, tải QR.
- Trang quản lý khách mời (Guest List Manager): Thêm/sửa/xóa khách, chia nhóm (Bạn bè, Nhà trai, Nhà gái, Đồng nghiệp), theo dõi trạng thái RSVP, xuất file CSV.
- Trang quản trị Admin: Thống kê tổng số thiệp, người dùng, mẫu thiệp, đơn hàng và cài đặt hệ thống.
- Bảng giá các gói (Miễn phí, Nâng cao, Cao cấp) và luồng thanh toán chuyển khoản VietQR chuẩn xác.

---

## 5. Kế Hoạch Xác Minh & Kiểm Thử (Verification Plan)

### Kịch bản kiểm thử toàn diện từ đầu đến cuối (E2E User Flow)
1. **Duyệt Thư Viện & Chọn Mẫu**:
   - Truy cập `/templates`, lọc theo phong cách *Pastel Luxury* hoặc *Korean Minimal*, chọn mẫu và bấm "Sử dụng mẫu này".
2. **Biên tập trong Invitation Builder**:
   - Nhập tên cô dâu (Ngọc Mai) & chú rể (Hoàng Nam), ngày cưới, địa điểm tại TP.HCM, viết lời mời và cập nhật album ảnh.
   - Bật tính năng RSVP và Sổ lưu bút. Kiểm tra Live Preview trên khung điện thoại. Bấm "Lưu & Xuất bản".
3. **Trải nghiệm trang thiệp thực tế (`/invite/hoang-nam-ngoc-mai`)**:
   - Mở liên kết thiệp trên thiết bị/trình duyệt, tương tác nút mở phong bì.
   - Điền form RSVP (ví dụ: Khách mời "Trần Minh", 2 người tham dự, xác nhận có mặt) → Kiểm tra lưu dữ liệu thành công.
   - Viết lời chúc vào sổ lưu bút → Lời chúc xuất hiện trên danh sách.
   - Thử nghiệm quét/tải mã QR thiệp cưới.
4. **Kiểm tra Bảng điều khiển Quản lý khách mời**:
   - Đăng nhập tài khoản, vào mục Khách mời xem bản ghi vừa gửi RSVP từ khách "Trần Minh", thử xuất danh sách ra file CSV.
5. **Thử nghiệm AI Wedding Designer**:
   - Bấm "Tạo thiệp bằng AI", nhập tên và chọn phong trào lãng mạn → Kiểm tra 3 phương án sinh ra với đầy đủ bố cục, màu sắc và lời mời tiếng Việt tinh tế.
6. **Kiểm tra Admin Dashboard**:
   - Truy cập khu vực quản trị, duyệt danh sách mẫu thiệp, xem báo cáo tổng thể.
