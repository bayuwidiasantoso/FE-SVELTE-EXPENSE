# 📘 Expense Tracker – SvelteKit + Spring Boot + PostgreSQL

Aplikasi pencatatan keuangan harian (Expense Tracker) yang memungkinkan pengguna mengelola pemasukan, pengeluaran, kategori, dan melihat ringkasan keuangan secara real-time.
Dibangun menggunakan arsitektur modern: **SvelteKit (TypeScript + TailwindCSS)** untuk frontend, **Spring Boot 3 (JWT Security)** untuk backend, dan **PostgreSQL** sebagai database.

## ⭐ Fitur Utama

### 🔐 Authentication
- Login & Registrasi
- JWT-based Authentication
- Proteksi halaman (dashboard, kategori, transaksi)
- Redirect otomatis setelah login/logout

### 🏷️ Kategori
- Tambah, edit, hapus kategori
- Dua tipe: **INCOME** / **EXPENSE**
- Filtering kategori pada transaksi
- Pagination + Sorting

### 💰 Transaksi
- CRUD transaksi lengkap
- Filtering: tanggal, tipe, kategori
- Modal popup untuk create/edit
- Pagination server-side
- Sorting server-side

### 📊 Dashboard
- Total pemasukan
- Total pengeluaran
- Saldo akhir
- Tabel transaksi terbaru

### 📄 Export / Import
- Export Excel
- Export PDF
- Import Excel
- Template import Excel

### 🎨 UI/UX
- Sidebar layout
- Responsive design
- TailwindCSS

## 🚀 Tech Stack

### Frontend
- SvelteKit (latest)
- TypeScript
- TailwindCSS

### Backend
- Spring Boot 3.x
- Spring Security (JWT)
- PostgreSQL
- Lombok
- Apache POI (Excel)
- OpenPDF / iTextPDF (PDF Export)

### Database
- PostgreSQL 16+

## 📂 Project Structure

### Backend
src/main/java/com/expense/
 ├─ config/
 ├─ controller/
 ├─ service/
 ├─ repository/
 ├─ dto/
 ├─ model/
 ├─ util/
 └─ ExpenseTrackerApplication.java

### Frontend
src/
 ├─ lib/
 ├─ routes/
 ├─ app.css
 └─ app.html

## 🗄️ Database Schema (DDL)

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    amount NUMERIC(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

## 🔧 Instalasi & Setup

### Backend
mvn spring-boot:run

### Frontend
npm install
npm run dev

## 🔐 Authentication Flow
1. Login → backend generate JWT  
2. Token disimpan di localStorage  
3. Authorization header: Bearer <token>  
4. Backend validasi JWT

## 👨‍💻 Author
Bayu Widia Santoso
