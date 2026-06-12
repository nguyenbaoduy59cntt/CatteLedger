# Catte Ledger

Web app quản lý tiền chơi bài **Cát Tê 6 lá** theo tuần — ghi nhận ván, tính nợ global, cấn trừ hai chiều, thanh toán có xác nhận, thông báo realtime.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase Postgres + Realtime
- Custom auth (username/password, httpOnly session cookie)

## Setup local

### 1. Supabase

1. Tạo project tại [supabase.com](https://supabase.com)
2. Vào **SQL Editor**, chạy file `supabase/migrations/001_init.sql`
3. Vào **Project Settings → API**, copy URL và keys

### 2. Environment

```bash
cp .env.example .env.local
```

Điền các biến từ **Supabase → Project Settings → API**:

| Biến | Lấy ở đâu |
|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** (vd. `https://abcxyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon public** — JWT dài, bắt đầu `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** — JWT dài, bắt đầu `eyJ...` (không share/public) |

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
SESSION_COOKIE_NAME=catte_session
SESSION_SECRET=your-long-random-secret
APP_BASE_URL=http://localhost:3000
```

> Key hợp lệ thường dài **200+ ký tự**. Nếu key chỉ ~40–50 ký tự thì bạn đã copy nhầm (project ref, không phải API key).

### 3. Chạy app

```bash
npm install
npm run dev
```

> **Mạng công ty / lỗi SSL:** Nếu register/login báo `fetch failed` hoặc `unable to verify the first certificate`, script `npm run dev` đã bật workaround TLS cho môi trường dev. Trên production (Vercel) thường không gặp lỗi này.

Mở [http://localhost:3000](http://localhost:3000)

## Deploy Vercel

1. Push repo lên GitHub
2. Import project trên Vercel
3. Thêm các biến môi trường giống `.env.example`
4. Set `APP_BASE_URL` = URL production

## Tính năng MVP

- Đăng ký / đăng nhập / đăng xuất
- Tạo phòng có mật khẩu, danh sách phòng public, join/leave
- Chủ phòng ghi nhận ván: thắng thường (5k), đốt (10k), đền làng
- Confirm modal trước khi ghi nhận / rollback
- Rollback ván gần nhất
- Sổ nợ cá nhân, cấn trừ nợ hai chiều
- Flow thanh toán: Tôi đã trả → Đã nhận tiền / Từ chối
- Thông báo in-app + Supabase Realtime

## Cấu trúc

```
app/           # Pages & API routes
components/    # UI components
lib/           # Business logic (auth, balances, rounds, ...)
supabase/      # SQL migrations
types/         # TypeScript types
```

Chi tiết nghiệp vụ: xem `../PLAN_catte_ledger.md`
