# Thanh toán gói tự động bằng SePay

Luồng hoạt động:

1. Khách chọn gói Premium/Luxury → web tạo đơn `orders/{id}` với mã `TOPxxxxxx` và hiện **mã QR SePay** (đã điền sẵn số tiền + nội dung).
2. Khách quét QR chuyển khoản → SePay thấy tiền vào tài khoản → gọi **webhook** (Cloudflare Worker trong thư mục này).
3. Worker kiểm tra khóa bí mật, tìm đơn theo mã `TOP…`, đủ tiền → đánh dấu đơn `paid`, nâng gói tài khoản 12 tháng, xuất bản thiệp.
4. Trang thanh toán đang mở tự thấy đơn "đã thanh toán" (kiểm tra mỗi 2,5 giây) và chuyển sang màn hình thành công.

Web trên GitHub Pages là trang tĩnh nên cần Worker nhỏ này để nhận webhook. Cloudflare Workers miễn phí 100.000 lượt/ngày, không cần thẻ.

## Bước 1 — Tạo tài khoản máy "sepay-bot" trong Firebase

Dự án Firebase thuộc gói AI Studio nên không tạo được khóa tài khoản dịch vụ. Thay vào đó Worker đăng nhập bằng một tài khoản máy riêng; luật Firestore chỉ cho đúng tài khoản này xác nhận thanh toán.

1. Bật đăng nhập Email/Password: https://console.firebase.google.com/project/fresh-nexus-75v9p/authentication/providers → **Add new provider** → **Email/Password** → bật **Enable** → **Save**.
2. Tạo tài khoản: https://console.firebase.google.com/project/fresh-nexus-75v9p/authentication/users → **Add user**
   - Email: `sepay-bot@thieponl.vn` (đúng chính xác email này — luật Firestore nhận diện theo email)
   - Password: một mật khẩu mạnh (giữ bí mật)

## Bước 2 — Tạo Worker trên Cloudflare

1. Đăng ký/đăng nhập https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**.
2. Đặt tên `songhy-sepay` → **Deploy**.
3. Bấm **Edit code**, xóa code mẫu, dán toàn bộ nội dung file `worker.js` → **Deploy**.
4. Vào **Settings → Variables and Secrets**, thêm 3 biến loại **Secret**:
   - `SEPAY_API_KEY` = chuỗi bí mật bạn tự đặt (dùng lại ở SePay)
   - `BOT_EMAIL` = `sepay-bot@thieponl.vn`
   - `BOT_PASSWORD` = mật khẩu ở Bước 1
5. Ghi lại địa chỉ Worker, dạng `https://songhy-sepay.<tên-bạn>.workers.dev`. Mở trên trình duyệt phải thấy `{"ok":true,...}`.

## Bước 3 — Cấu hình SePay

1. Đăng nhập https://my.sepay.vn, liên kết tài khoản ngân hàng nhận tiền (TPBank 87583868888 — trùng với `src/data/paymentConfig.ts`).
2. Vào **Tích hợp WebHooks** → **Thêm webhooks**:
   - **Bắn webhook khi**: Có tiền vào
   - **Gọi đến URL**: `https://songhy-sepay.<tên-bạn>.workers.dev/sepay`
   - **Kiểu chứng thực**: API Key → nhập đúng chuỗi `SEPAY_API_KEY` ở Bước 2
   - **Request Content type**: application/json
   - Bỏ chọn "Bỏ qua nếu nội dung giao dịch không có Code thanh toán" (hoặc cấu hình tiền tố mã thanh toán là `TOP`).
3. Lưu, rồi bấm **Gửi thử** — Worker trả `success: true` là đã kết nối.

## Bước 4 — Cập nhật luật Firestore

Dán file `firestore.rules` mới vào Firebase (Firestore → Security → Publish). Luật mới chặn người dùng tự sửa gói, tự đánh dấu đơn/thiệp là đã thanh toán — chỉ webhook SePay (tài khoản dịch vụ) và Admin làm được.

## Kiểm thử

Tạo đơn gói Premium trên web, chuyển khoản đúng số tiền với nội dung là mã `TOP…` (quét QR là tự điền). Trong khoảng 5–30 giây trang thanh toán sẽ báo thành công. Xem log trong Cloudflare → Worker → **Logs** nếu có lỗi.

Đổi tài khoản nhận tiền: sửa `src/data/paymentConfig.ts` và liên kết tài khoản tương ứng trong SePay.
