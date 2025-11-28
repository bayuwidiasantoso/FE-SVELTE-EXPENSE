📘 Expense Tracker – SvelteKit + Spring Boot + PostgreSQL

Aplikasi pencatatan keuangan harian (Expense Tracker) yang memungkinkan pengguna mengelola pemasukan, pengeluaran, kategori, dan melihat ringkasan keuangan secara real-time.
Dibangun menggunakan arsitektur modern: SvelteKit (TypeScript + TailwindCSS) untuk frontend, Spring Boot 3 (JWT Security) untuk backend, dan PostgreSQL sebagai database.

⭐ Fitur Utama
🔐 Authentication

Login & Registrasi

JWT-based Authentication

Proteksi halaman (dashboard, kategori, transaksi)

Redirect otomatis setelah login/logout

🏷️ Kategori

Tambah, edit, hapus kategori

Dua tipe: INCOME / EXPENSE

Filtering kategori pada transaksi

Pagination + Sorting

💰 Transaksi

CRUD transaksi lengkap

Filtering: tanggal, tipe, kategori

Modal popup untuk create/edit

Pagination server-side

Sorting server-side

📊 Dashboard

Total pemasukan

Total pengeluaran

Saldo akhir

Tabel transaksi terbaru

(opsional) grafik bulanan

📄 Export / Import

Export Excel

Export PDF

Import Excel (mapping by categoryId)

Template import Excel

🎨 UI/UX

Sidebar layout

Responsive design

TailwindCSS

Halaman login tanpa sidebar

🚀 Tech Stack
Frontend

SvelteKit (latest)

TypeScript

TailwindCSS

LocalStorage-based Auth

Modal UI components

Backend

Spring Boot 3.x

Spring Web

Spring Security (JWT)

PostgreSQL Driver

Lombok

Apache POI (Excel)

OpenPDF / iTextPDF (PDF Export)

Database

PostgreSQL 16+

📂 Project Structure
Frontend
src/
 ├─ lib/
 │   ├─ stores/auth.ts
 │   ├─ config.ts
 │   └─ utils/
 ├─ routes/
 │   ├─ login/+page.svelte
 │   ├─ dashboard/+page.svelte
 │   ├─ categories/+page.svelte
 │   └─ transactions/+page.svelte
 ├─ routes/+layout.svelte
 └─ app.css

Backend
src/main/java/com/expense/
 ├─ config/
 ├─ controller/
 ├─ service/
 ├─ repository/
 ├─ dto/
 ├─ model/
 ├─ util/ (JWT Utils)
 └─ ExpenseTrackerApplication.java

🗄️ Database Schema (DDL)
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

🔧 Instalasi & Setup
1️⃣ Backend

Clone project:

git clone <url-backend-repository>


Edit konfigurasi database:

src/main/resources/application.properties

spring.datasource.url=jdbc:postgresql://localhost:5432/expense_db
spring.datasource.username=postgres
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update


Jalankan:

mvn spring-boot:run

2️⃣ Frontend

Clone project:

git clone <url-frontend-repository>


Install dependencies:

npm install


Jalankan:

npm run dev


Konfigurasi API:

src/lib/config.ts

export const API_BASE_URL = "http://localhost:8080/api";

🔐 Authentication Flow

User login → backend generate JWT

Frontend simpan token + user di localStorage

Token dipakai untuk semua request:

Authorization: Bearer <token>


Backend validasi token → user authorized

Route yang membutuhkan login otomatis terproteksi

📁 API Docs (Ringkas)
AUTH
POST /auth/register
POST /auth/login

CATEGORY
GET    /categories?userId=X
POST   /categories
PUT    /categories/{id}
DELETE /categories/{id}

TRANSACTION
GET    /transactions?userId=X&page=0&size=10&sortBy=date&sortDir=desc
POST   /transactions
PUT    /transactions/{id}
DELETE /transactions/{id}

GET    /transactions/export/excel
GET    /transactions/export/pdf
POST   /transactions/import/excel
GET    /transactions/import/template

📦 Import/Export Format
Template Import Excel
amount | type | date | description | categoryId

Export

transactions.xlsx

transactions.pdf

🎯 Future Improvements

Grafik interaktif (ApexCharts)

Multi-user role

Budget planning module

Monthly report auto-generation

Recurring transactions

👨‍💻 Author

Bayu Widia Santoso
Fullstack Developer – Spring Boot, SvelteKit, PostgreSQL