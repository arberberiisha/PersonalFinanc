import React, { useRef, useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import Swal from "sweetalert2";
import "./App.css";
import { useTranslations } from "./LanguageContext";

export default function PersonalFinanceTracker() {
  const [entries, setEntries] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [form, setForm] = useState({
    type: "Expense",
    category: "",
    description: "",
    actual: "",
    month: "January",
  });

  const pdfRef = useRef();
  const imageInputRef = useRef();
  const excelInputRef = useRef();

  const { translations: t, language, setLanguage } = useTranslations();

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const addEntry = () => {
    if (form.actual && form.category && form.description) {
      setEntries([...entries, form]);
      setForm({
        type: "Expense",
        category: "",
        description: "",
        actual: "",
        month: "January",
      });
    }
  };

  const totalIncome = entries
    .filter((e) => e.type === "Income")
    .reduce((acc, e) => acc + Number(e.actual), 0);
  const totalExpense = entries
    .filter((e) => e.type === "Expense")
    .reduce((acc, e) => acc + Number(e.actual), 0);
  const balance = totalIncome - totalExpense;

  const exportToPDF = () => {
    const element = pdfRef.current;
    const originalDark = darkMode;
    document.body.classList.remove("dark-mode");
    const toHide = element.querySelectorAll(".no-print");
    toHide.forEach((el) => (el.style.display = "none"));

    const options = {
      margin: 0.5,
      filename: "finance-report.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf()
      .set(options)
      .from(element)
      .save()
      .then(() => {
        toHide.forEach((el) => (el.style.display = ""));
        if (originalDark) {
          document.body.classList.add("dark-mode");
        }
      });
  };

  const clearAllEntries = async () => {
    const result = await Swal.fire({
      title: t.clearConfirmTitle,
      text: t.clearConfirmText,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t.confirm,
    });

    if (result.isConfirmed) {
      setEntries([]);
      Swal.fire(t.cleared, t.clearedMessage, "success");
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Finance Report");
    sheet.mergeCells("A1", "E1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = t.title;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: "center" };

    const headerRow = sheet.addRow([
      "Month",
      "Type",
      "Category",
      "Description",
      "Amount",
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCCCCCC" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    entries.forEach((e) => {
      sheet.addRow([
        e.month,
        e.type,
        e.category,
        e.description,
        Number(e.actual),
      ]);
    });

    sheet.addRow([]);
    sheet.addRow(["Total Income", "", "", "", totalIncome]);
    sheet.addRow(["Total Expense", "", "", "", totalExpense]);
    sheet.addRow(["Balance", "", "", "", balance]);
    sheet.columns.forEach((col) => (col.width = 20));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "finance-report.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const worksheet = workbook.getWorksheet(1);

    const newEntries = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const [month, type, category, description, actual] = row.values.slice(1);
      if (month && type && category && description && actual) {
        newEntries.push({
          month,
          type,
          category,
          description,
          actual: Number(actual),
        });
      }
    });

    setEntries((prev) => [...prev, ...newEntries]);
    if (excelInputRef.current) excelInputRef.current.value = null;
  };

  const handleBillImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("bill", file);

    try {
      const res = await fetch("http://localhost:8080/api/analyze-bill", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const parsed = typeof data === "string" ? JSON.parse(data) : data;

      setEntries((prev) => [
        ...prev,
        {
          type: "Expense",
          month: "January",
          category: parsed.category || "Bill",
          description: "",
          actual: parsed.actual || "0.00",
        },
      ]);

      if (imageInputRef.current) imageInputRef.current.value = null;
    } catch (err) {
      console.error("Failed to analyze bill", err);
      alert(t.analyzeError);
    }
  };

  return (
    <>
      <div ref={pdfRef}>
        <div className="container py-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h1 className="flex-grow-1 text-center m-0">{t.title}</h1>
            <div className="d-flex gap-2 no-print">
              <button
                className={`btn ${darkMode ? "btn-light" : "btn-dark"}`}
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? t.lightMode : t.darkMode}
              </button>

              <button
                className="btn btn-outline-secondary"
                onClick={() => setLanguage(language === "en" ? "sq" : "en")}
              >
                🌐 {language === "en" ? "Shqip" : "English"}
              </button>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-3 justify-content-center mb-1 mt-5 no-print">
            <input
              type="file"
              accept=".xlsx"
              ref={excelInputRef}
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              style={{ display: "none" }}
              onChange={handleBillImageUpload}
            />

            <button
              className="btn btn-outline-primary px-4 py-2 shadow-sm fw-semibold rounded-pill"
              onClick={() => excelInputRef.current.click()}
            >
              {t.importExcel}
            </button>

            <button
              className="btn btn-outline-warning px-4 py-2 shadow-sm fw-semibold rounded-pill"
              onClick={() => imageInputRef.current.click()}
            >
              {t.scanBill}
            </button>
          </div>
        </div>

        <div className="container py-3">
          <div className="no-print row g-3 mb-4">
            <div className="col-md-2">
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
              >
                <option>{t.income}</option>
                <option>{t.expense}</option>
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={form.month}
                onChange={(e) => handleChange("month", e.target.value)}
              >
                {t.months.map((month, index) => (
                  <option key={index}>{month}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input
                className="form-control"
                placeholder={t.category}
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <input
                className="form-control"
                placeholder={t.description}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder={t.amount}
                value={form.actual}
                onChange={(e) => handleChange("actual", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button className="btn btn-danger w-100" onClick={addEntry}>
                {t.addEntry}
              </button>
            </div>
          </div>

          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>{t.month}</th>
                <th>{t.type}</th>
                <th>{t.category}</th>
                <th>{t.description}</th>
                <th>{t.amount}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i}>
                  <td>{e.month}</td>
                  <td>{e.type}</td>
                  <td>{e.category}</td>
                  <td>{e.description}</td>
                  <td>${e.actual}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4">
            <p>
              <strong className="text-success">{t.totalIncome}:</strong> $
              {totalIncome}
            </p>
            <p>
              <strong className="text-danger">{t.totalExpense}:</strong> $
              {totalExpense}
            </p>
            <p>
              <strong className="text-primary">{t.balance}:</strong> ${balance}
            </p>
          </div>
        </div>
      </div>
      <div className="container d-flex gap-3 mt-3">
        <button className="btn btn-primary" onClick={exportToPDF}>
          {t.exportPDF}
        </button>
        <button className="btn btn-success" onClick={exportToExcel}>
          {t.exportExcel}
        </button>
        <button className="btn btn-outline-danger" onClick={clearAllEntries}>
          {t.clearAll}
        </button>
      </div>
    </>
  );
}
