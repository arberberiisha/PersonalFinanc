# 💰 Personal Finance & Billing Suite

A professional, modern React application designed for seamless personal finance tracking and high-quality document generation. Manage your cash flow, analyze spending with AI, and generate industry-standard invoices in multiple languages.

## 🚀 Features

### 🏦 Personal Finance Tracker
- ✅ **Smart Entry System**: Add income or expense entries with categories and months using a streamlined action bar.
- ✅ **Real-time Analytics**: Auto-calculates total income, expenses, and balance with live-updating visual summaries.
- ✅ **Data Portability**: 
  - Export/Import Excel files using `ExcelJS` with automatic data merging.
  - Export print-ready financial PDF reports.

### 📄 Professional Bill Generator
- ✅ **Bilingual Invoicing**: Fully localized PDF generation in English 🇬🇧 and Albanian 🇦🇱, including translated month names.
- ✅ **Precision PDF Engine**: Custom-built `jsPDF` integration featuring:
  - **Branding**: Upload and display your custom business logo.
  - **Senior Design**: Decorative headers, indigo-themed table lines, and professional "Total Due" styling.
  - **Smart Units**: Automatic superscript handling (e.g., converts "m2" to "m²") and empty-by-default unit fields.
  - **Full Metadata**: Track invoice numbers, dates, payment methods, and custom notes.

### 🤖 AI & Advanced Utilities
- ✅ **AI Bill Scanner**: Extract totals and dates from physical receipts via image upload.
- ✅ **Responsive UX**: Mobile-first architecture that transforms tables into scannable "Info Cards" on smaller screens.
- ✅ **Persistence & UI**:
  - 🌓 Toggle dark/light mode with a deep slate dark theme.
  - 🧹 Clear all entries with a confirmation prompt via `SweetAlert2`.
  - ✨ Smooth row animations powered by `Framer Motion`.

## 🧰 Tech Stack

- **Frontend**: React + Bootstrap 5
- **Animations**: `Framer Motion`
- **Icons**: `Lucide-React`
- **PDF Export**: `jsPDF` & `jspdf-autotable` (for Invoices) and `html2pdf.js` (for Reports)
- **Excel Export/Import**: `ExcelJS` & `file-saver`
- **Confirmation Dialogs**: `sweetalert2`
- **Image-to-Text Parsing**: (Optional backend API for bill parsing)
