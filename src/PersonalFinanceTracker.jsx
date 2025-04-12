import React, { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useTranslations } from "./LanguageContext";

import { exportToPDF } from "./utils/exportToPDF";
import { exportToExcel } from "./utils/exportToExcel";
import { uploadBillImage } from "./utils/billUploader";
import "./App.css";

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
    .filter((e) => e && e.type === "Income")
    .reduce((acc, e) => acc + Number(e.actual), 0);

  const totalExpense = entries
    .filter((e) => e && e.type === "Expense")
    .reduce((acc, e) => acc + Number(e.actual), 0);
  const balance = totalIncome - totalExpense;

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ExcelJS = await import("exceljs");
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
  
    try {
      await uploadBillImage({ file, setEntries });
    } catch (err) {
      console.error("Bill analysis failed:", err);
      Swal.fire({
        icon: "info",
        title: "AI Service Unavailable",
        text: "Scan Bill (AI) is currently not available. Please try again later.",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      // Always reset the input so re-selecting the same file works
      if (imageInputRef.current) {
        imageInputRef.current.value = null;
      }
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
                className={`btn ${
                  darkMode ? "btn-light" : "btn-dark"
                } no-print`}
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? t.lightMode : t.darkMode}
              </button>
              
              <button
                className="btn btn-outline-secondary no-print"
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
              className="btn btn-outline-primary no-print"
              onClick={() => excelInputRef.current.click()}
            >
              {t.importExcel}
            </button>
            <button
              className="btn btn-outline-warning no-print"
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
              {entries.map((e, i) =>
                e ? (
                  <tr key={i}>
                    <td>{e.month}</td>
                    <td>{e.type}</td>
                    <td>{e.category}</td>
                    <td>{e.description}</td>
                    <td>${e.actual}</td>
                  </tr>
                ) : null
              )}
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
        <button
          className="btn btn-primary"
          onClick={() => exportToPDF({ element: pdfRef.current, darkMode })}
        >
          {t.exportPDF}
        </button>
        <button
          className="btn btn-success"
          onClick={() =>
            exportToExcel({
              entries,
              totals: {
                income: totalIncome,
                expense: totalExpense,
                balance,
              },
              title: t.title,
            })
          }
        >
          {t.exportExcel}
        </button>
        <button className="btn btn-outline-danger" onClick={clearAllEntries}>
          {t.clearAll}
        </button>
      </div>
    </>
  );
}
