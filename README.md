# 💰 Personal Finance Tracker

A modern, responsive React app to help you manage and visualize your personal finances — track income and expenses, generate reports, and more.

## 🚀 Features

- ✅ Add income or expense entries with description, category, amount, and month
- 📊 Auto-calculates total income, total expenses, and balance
- 📄 Export data as:
  - PDF (print-ready reports)
  - Excel (styled and structured using ExcelJS)
- 📥 Import Excel files and automatically merge the data
- 🧠 Scan bills using AI and auto-extract totals (via image upload)
- 🌓 Toggle dark/light mode
- 🌐 Bilingual support: English 🇬🇧 & Albanian 🇦🇱
- 🧹 Clear all entries with a confirmation prompt (SweetAlert2)

## 🧰 Tech Stack

- **Frontend**: React + Bootstrap 5
- **PDF Export**: `html2pdf.js`
- **Excel Export/Import**: `ExcelJS`
- **Download Support**: `file-saver`
- **Confirmation Dialogs**: `sweetalert2`
- **Image-to-Text Parsing**: (optional backend API for bill parsing)

## 🛠 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
