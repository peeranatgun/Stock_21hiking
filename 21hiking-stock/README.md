# 🏔️ 21Hiking Stock

ระบบจัดการสต็อกสินค้าเดินป่ามือสอง — Back Office สำหรับ 2 ผู้ใช้งาน

---

## 🚀 การติดตั้งและ Deploy

### 1. สร้าง Supabase Project

1. ไปที่ [supabase.com](https://supabase.com) และสร้าง Project ใหม่
2. ไปที่ **SQL Editor** และรัน SQL ใน `sql/schema.sql`
3. ไปที่ **Storage** → สร้าง Bucket ชื่อ `product-images` ตั้งเป็น **Public**
4. ไปที่ **Authentication** → **Users** → สร้างบัญชีสำหรับ Owner และ Partner

### 2. ตั้งค่า Environment Variables

เปิดไฟล์ `env.js` และใส่ค่าจาก Supabase:

```js
window.__ENV__ = {
  SUPABASE_URL: 'https://xxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGci...',
};
```

ค่าเหล่านี้อยู่ใน **Supabase Dashboard → Settings → API**

### 3. Deploy บน Vercel

1. Push โปรเจกต์ขึ้น GitHub
2. ไปที่ [vercel.com](https://vercel.com) → Import Repository
3. Deploy เลย (ไม่ต้องตั้ง build command)

---

## 📁 โครงสร้างไฟล์

```
/
├── index.html          Dashboard
├── login.html          หน้า Login
├── products.html       จัดการสินค้า
├── brands.html         จัดการแบรนด์
├── sales.html          ยอดขาย
├── expenses.html       รายจ่าย
├── reports.html        รายงาน + Export Excel
├── style.css           Design System
├── env.js              ⚠️ ตั้งค่า Supabase Keys ที่นี่
├── supabase.js         Supabase Client
├── auth.js             Authentication
├── app.js              Shared UI (Toast, Modal, etc.)
├── brands.js           Brand CRUD
├── products.js         Product CRUD + Dashboard Stats
├── sales.js            Sales Data
├── expenses.js         Expense CRUD
├── reports.js          Report + Excel Export
├── storage.js          Supabase Storage
├── manifest.json       PWA Manifest
├── sw.js               Service Worker
├── vercel.json         Vercel Config
└── sql/
    └── schema.sql      Database Schema + RLS + Seed Data
```

---

## ✨ Features

| Feature | รายละเอียด |
|---------|-----------|
| 🔐 Authentication | Login/Logout ด้วย Email + Password |
| 👕 สินค้า | CRUD + Upload รูป + ค้นหา + Filter |
| 🏷️ แบรนด์ | CRUD + นับจำนวนสินค้า |
| 💰 ยอดขาย | Mark As Sold + คำนวณกำไร |
| 🧾 รายจ่าย | CRUD + รวมยอด |
| 📊 Dashboard | Stats Cards + Charts |
| 📈 รายงาน | Monthly Charts + Export Excel |
| 📱 PWA | Install บน iPhone, iPad, Desktop |
| 🔄 Offline | Cache HTML/CSS/JS |

---

## 💡 Tips

- **กำไร** = ราคาขาย − ต้นทุน
- **กำไรสุทธิ** = กำไรรวม − รายจ่ายทั้งหมด
- รูปสินค้าอัปโหลดไปที่ Supabase Storage (ไม่เก็บ Base64)
- RLS เปิดทุก Table — ต้อง Login ก่อนใช้งาน

