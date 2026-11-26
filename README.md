# Flashcard ôn thi

Ứng dụng web học bằng thẻ ghi nhớ. Giao diện chạy trên GitHub Pages, dữ liệu lưu trên Supabase (PostgreSQL). Không cần localhost.

## Cấu trúc thư mục

```
flashcard/
├── index.html    Giao diện
├── style.css     Định dạng
├── app.js        Logic ứng dụng
├── config.js     Cấu hình Supabase (điền khóa của bạn)
├── supabase.sql  Tạo bảng và bảo mật dữ liệu
└── README.md     Hướng dẫn này
```

## Bước 1: Tạo cơ sở dữ liệu trên Supabase

1. Vào https://supabase.com, đăng ký và tạo **New project**. Đặt mật khẩu database và chọn region gần nhất (Singapore).
2. Vào **SQL Editor → New query**, dán toàn bộ nội dung `supabase.sql` rồi nhấn **Run**.
3. Vào **Project Settings → API**, sao chép:
   - **Project URL** (dạng `https://xxxx.supabase.co`)
   - **anon public key**

## Bước 2: Điền cấu hình

Mở `config.js` và thay hai giá trị:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://xxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi...",
};
```

Anon key là khóa công khai, có thể để trên GitHub. Dữ liệu được bảo vệ nhờ Row Level Security trong `supabase.sql`, mỗi người chỉ thấy bộ thẻ của mình. Không bao giờ đưa **service_role key** lên đây.

## Bước 3: Đưa code lên GitHub

1. Tạo repository mới trên GitHub, ví dụ `flashcard`.
2. Upload 5 file: `index.html`, `style.css`, `app.js`, `config.js`, `supabase.sql` (và `README.md`) lên nhánh `main`.

## Bước 4: Bật GitHub Pages

1. Vào repository → **Settings → Pages**.
2. Mục **Source** chọn **Deploy from a branch**, nhánh `main`, thư mục `/ (root)`, rồi **Save**.
3. Sau vài phút, ứng dụng chạy tại: `https://<tên-github>.github.io/flashcard/`

## Bước 5: Cho phép đăng nhập từ domain GitHub Pages

1. Trong Supabase, vào **Authentication → URL Configuration**.
2. Điền **Site URL** là link GitHub Pages của bạn.
3. Nếu muốn đăng ký không cần xác nhận email: **Authentication → Providers → Email**, tắt **Confirm email**. Nếu bật, người dùng phải bấm link trong email trước khi đăng nhập.

## Cách dùng

1. Đăng ký tài khoản, đăng nhập.
2. Tạo bộ thẻ (ví dụ "Giải tích 1").
3. Thêm thẻ một cái một, hoặc dán nhiều thẻ dạng `câu hỏi | đáp án`, mỗi dòng một thẻ.
4. Bấm **Bắt đầu ôn**: bấm vào thẻ để lật, chọn **Nhớ rồi** hoặc **Chưa nhớ**. Thẻ chưa nhớ sẽ được ôn lại trước trong lượt sau.

## Nâng cấp về sau

- Thêm thuật toán lặp lại ngắt quãng (spaced repetition) như SM-2.
- Thêm chức năng chia sẻ bộ thẻ giữa bạn bè bằng cách thêm bảng và chính sách RLS mới.
- Thêm trang thống kê theo ngày, dùng bảng `cards` có sẵn.