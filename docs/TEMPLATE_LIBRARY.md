# Thư viện mẫu thiệp cao cấp – trạng thái

Tài liệu theo dõi việc mở rộng thư viện. **Chỉ mẫu trong bảng "Đã hoàn thiện" mới có trong `src/data/premiumTemplates.ts` với `status: 'published'`.** Tên trong danh sách "Chờ thiết kế" chưa có dữ liệu, chưa có ảnh và không hiển thị trên website.

## Cách hoạt động

- Mỗi mẫu = một motif SVG vẽ mới (`src/components/templateArt/`) + bảng màu + biến thể chi tiết (`design.motif`).
- Chữ (tên, ngày, âm lịch, địa điểm) là HTML với font web hỗ trợ tiếng Việt, tự co theo độ dài tên; chữ Hỷ được nhúng dưới dạng path (Noto Serif CJK, OFL).
- `thumbnail`/`preview` là ảnh WebP render từ chính component (`tools/template-thumbs`), nên ảnh xem trước luôn khớp thiệp thật.
- Trình biên tập dùng lại schema `WeddingTemplate`/`DesignConfig` có sẵn; các trường mới đều là tùy chọn. Không ghi gì vào Firestore/Storage: dữ liệu mẫu nằm trong mã nguồn, có thể khôi phục bằng git.

## Thêm mẫu mới

1. Thêm spec với `status: 'draft'` trong `premiumTemplates.ts` (dùng motif có sẵn qua `variantOf(...)` hoặc thêm motif mới).
2. `npx vite --port 5199` rồi `node tools/template-thumbs/render.mjs <slug>` để tạo `public/assets/templates/<slug>-thumb.webp` và `-preview.webp`.
3. Kiểm tra ảnh, mở thử trong trình biên tập, rồi đổi sang `status: 'published'`.

## Đã hoàn thiện (26 mẫu)

| ID | Tên | Slug |
|---|---|---|
| `tpl-lux-song-hy-do` | Song Hỷ – Đỏ | `song-hy-do` |
| `tpl-lux-long-phung-huyen` | Long Phụng – Huyền | `long-phung-huyen` |
| `tpl-lux-minimal-do-dam` | Minimalism – Đỏ đậm | `minimalism-do-dam` |
| `tpl-lux-thanh-diep-xanh` | Thanh Diệp – Xanh | `thanh-diep-xanh` |
| `tpl-lux-lien-hoa-hong` | Liên Hoa – Hồng | `lien-hoa-hong` |
| `tpl-lux-vuon-kinh-xanh` | Vườn Kính – Xanh | `vuon-kinh-xanh` |
| `tpl-lux-baroque-vang` | Baroque – Vàng | `baroque-vang` |
| `tpl-lux-santorini-lam` | Santorini – Lam | `santorini-lam` |
| `tpl-lux-bach-su-lam` | Bạch Sứ – Lam | `bach-su-lam` |
| `tpl-lux-nhat-binh-do` | Nhật Bình – Đỏ | `nhat-binh-do` |
| `tpl-lux-chibi-do` | Chibi – Đỏ | `chibi-do` |
| `tpl-lux-hoa-kho-cam` | Hoa Khô – Cam | `hoa-kho-cam` |
| `tpl-lux-song-hy-xanh` | Song Hỷ – Xanh | `song-hy-xanh` |
| `tpl-lux-song-hy-v2-do` | Song Hỷ V2 – Đỏ | `song-hy-v2-do` |
| `tpl-lux-long-phung-do` | Long Phụng – Đỏ | `long-phung-do` |
| `tpl-lux-long-phung-lam` | Long Phụng – Lam | `long-phung-lam` |
| `tpl-lux-minimal-nau` | Minimalism – Nâu | `minimalism-nau` |
| `tpl-lux-minimal-lam-dam` | Minimalism – Lam đậm | `minimalism-lam-dam` |
| `tpl-lux-minimal-tim` | Minimalism – Tím | `minimalism-tim` |
| `tpl-lux-vuon-kinh-hong` | Vườn Kính – Hồng | `vuon-kinh-hong` |
| `tpl-lux-vuon-kinh-lam` | Vườn Kính – Lam | `vuon-kinh-lam` |
| `tpl-lux-baroque-lam` | Baroque – Lam | `baroque-lam` |
| `tpl-lux-baroque-v2-do-dam` | Baroque V2 – Đỏ đậm | `baroque-v2-do-dam` |
| `tpl-lux-bach-su-nau` | Bạch Sứ – Nâu | `bach-su-nau` |
| `tpl-lux-bach-su-v2-xanh` | Bạch Sứ V2 – Xanh | `bach-su-v2-xanh` |
| `tpl-lux-hoa-kho-v2-xanh` | Hoa Khô V2 – Xanh | `hoa-kho-v2-xanh` |

## Chờ thiết kế (theo danh sách yêu cầu)

- **Nhóm 1 – Truyền thống – Rồng Phụng – Chữ Hỷ** (6/16 xong): Song Long – Đỏ; Song Long – Xanh; Song Long – Lam; Song Phụng – Đỏ; Song Phụng – Xanh; Song Hạc – Đỏ; Long Phụng – Xanh; Long Phụng V2 – Đỏ; Long Phụng V3 – Đỏ; Long Phụng V4 – Đỏ
- **Nhóm 2 – Tối giản – Thanh lịch** (5/9 xong): Minimalism – Nâu đậm; Minimalism – Xanh; Minimalism – Đỏ; Hoa Lụa – Nâu
- **Nhóm 3 – Hoa lá – Hoa sen – Thiên nhiên** (6/24 xong): Hoa Mộc – Xanh; Hoa Mộc – Hồng; Hoa Mộc – Nâu; Liên Hoa V2 – Xanh; Mai Lan – Trắng; Anh Đào – Hồng; Vườn Xuân – Đỏ; Vườn Xuân – Xanh; Vườn Xuân – Lam; Vườn Kính – Xanh nhạt; Vườn Kính – Xanh phiên bản khác; Hoa Hướng Dương – Vàng; Hoa Dại – Hồng; Hoa Màu – Lam; Hoa Khô V2 – Lam; Tơ Duyên – Xanh; Tơ Duyên – Đỏ đậm; Tơ Duyên – Hồng
- **Nhóm 4 – Sang trọng – Hoàng gia – Châu Âu** (4/19 xong): Hoàng Kim – Đỏ; Hoàng Kim – Xanh; Hoàng Kim – Lam; Hoàng Kim II – Xanh; Hoàng Kim II – Tím; Lâu Đài – Xanh; Lâu Đài – Lam; Baroque V2 – Xanh đậm; Baroque V2 – Lam đậm; Riviera – Lam; San Miguel – Vàng; Florence – Nâu; Hoa Thủy Tinh – Lam; Hoa Thủy Tinh – Xanh; Hoa Thủy Tinh – Đỏ
- **Nhóm 5 – Cổ phục – Văn hóa** (4/16 xong): Cô Ba – Đỏ; Ren Thêu – Trắng; Bạch Sứ – Đỏ; Bạch Sứ V2 – Hồng; Bạch Sứ II – Đỏ; Thanh Cung – Lam; Thanh Cung – Vàng; Thanh Cung – Xanh; Mahal – Vàng; Kim Điện – Vàng; Gấm Hoa – Đỏ; Du Mục – Nâu
- **Nhóm 6 – Dễ thương – Nghệ thuật** (2/5 xong): Họa Tình – Đỏ; Tơ Duyên – Hồng; Hoa Dại – Hồng

Ghi chú: "Hoa Khô – Cam", "Tơ Duyên – Hồng", "Hoa Dại – Hồng" xuất hiện ở cả nhóm 3 và 6 – chỉ tính một lần (86 tên duy nhất).
