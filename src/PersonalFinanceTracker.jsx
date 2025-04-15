import React, { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useTranslations } from "./LanguageContext";

import { exportToPDF } from "./utils/exportToPDF";
import { exportToExcel } from "./utils/exportToExcel";
import { uploadBillImage } from "./utils/billUploader";
import { showError } from "./utils/showError";
import "./App.css";

export default function PersonalFinanceTracker() {
  const { translations: t, language, setLanguage } = useTranslations();

  const getSavedMonth = () => localStorage.getItem("lastMonth");

  const monthNames = {
    en: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    sq: [
      "Janar",
      "Shkurt",
      "Mars",
      "Prill",
      "Maj",
      "Qershor",
      "Korrik",
      "Gusht",
      "Shtator",
      "Tetor",
      "Nëntor",
      "Dhjetor",
    ],
  };

  const getCurrentMonth = (language) => {
    const now = new Date();
    const index = now.getMonth();
    return monthNames[language][index];
  };

  const [entries, setEntries] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const [form, setForm] = useState(() => ({
    type: "Expense",
    category: "",
    description: "",
    actual: "",
    month: getSavedMonth() || getCurrentMonth(language),
    year: new Date().getFullYear(), // default to current year
  }));

  const pdfRef = useRef();
  const imageInputRef = useRef();
  const excelInputRef = useRef();

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const addEntry = () => {
    if (form.actual && form.category) {
      setEntries([
        ...entries,
        {
          ...form,
          actual: Number(form.actual),
          description: form.description || "",
        },
      ]);

      setForm({
        type: "Expense",
        category: "",
        description: "",
        actual: "",
        month: form.month,
        year: form.year,
      });
    }

    localStorage.setItem("lastMonth", form.month);
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
      if (rowNumber <= 2) return;

      const [month, type, category, description, actual] = row.values.slice(1);
      if (
        month &&
        type &&
        category &&
        description &&
        actual &&
        !isNaN(actual)
      ) {
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
      showError(t.aiUnavailableTitle, t.aiUnavailableMessage);
    } finally {
      if (imageInputRef.current) {
        imageInputRef.current.value = null;
      }
    }
  };

  const handleEdit = async (index) => {
    const entry = entries[index];

    const { value: updated } = await Swal.fire({
      title: t.editEntry,
      html: `
        <input id="swal-type" class="swal2-input" placeholder="${t.type}" value="${entry.type}">
        <input id="swal-month" class="swal2-input" placeholder="${t.month}" value="${entry.month}">
        <input id="swal-category" class="swal2-input" placeholder="${t.category}" value="${entry.category}">
        <input id="swal-description" class="swal2-input" placeholder="${t.description}" value="${entry.description}">
        <input id="swal-actual" type="number" class="swal2-input" placeholder="${t.amount}" value="${entry.actual}">
      `,
      showCancelButton: true,
      confirmButtonText: t.save,
      preConfirm: () => {
        const type = document.getElementById("swal-type").value;
        const month = document.getElementById("swal-month").value;
        const category = document.getElementById("swal-category").value;
        const description = document.getElementById("swal-description").value;
        const actual = parseFloat(document.getElementById("swal-actual").value);

        if (!type || !month || !category || isNaN(actual)) {
          Swal.showValidationMessage(
            t.invalidInput || "Please fill in all fields."
          );
          return;
        }

        return { type, month, category, description, actual };
      },
    });

    if (updated) {
      const updatedEntries = [...entries];
      updatedEntries[index] = updated;
      setEntries(updatedEntries);
      Swal.fire(
        t.updated || "Updated!",
        t.updatedMessage || "Your entry has been updated.",
        "success"
      );
    }
  };

  const handleDelete = async (index) => {
    const result = await Swal.fire({
      title: t.deleteConfirmTitle || "Are you sure?",
      text: t.deleteConfirmText || "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t.confirm || "Yes, delete it!",
    });

    if (result.isConfirmed) {
      const updatedEntries = entries.filter((_, i) => i !== index);
      setEntries(updatedEntries);
      Swal.fire(
        t.deleted || "Deleted!",
        t.deletedMessage || "Entry has been removed.",
        "success"
      );
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
            <div className="col-md-2 d-flex gap-1 align-items-center">
              <select
                className="form-select"
                value={form.month}
                onChange={(e) => handleChange("month", e.target.value)}
              >
                {t.months.map((month, index) => (
                  <option key={index}>{month}</option>
                ))}
              </select>

              <input
                type="number"
                min="1900"
                max="2100"
                className="form-control"
                style={{ maxWidth: "80px" }}
                placeholder="Year"
                value={form.year ?? ""}
                onChange={(e) =>
                  handleChange(
                    "year",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
              />
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
                  <td>
                    {e.month}
                    {e.year ? ` ${e.year}` : ""}
                  </td>
                  <td>{e.type}</td>
                  <td>{e.category}</td>
                  <td>{e.description}</td>
                  <td>${e.actual}</td>
                  <td className="no-print">
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEdit(i)}
                    >
                      {t.edit}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(i)}
                    >
                      {t.delete}
                    </button>
                  </td>
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

      <div className="container d-flex gap-3 mt-3 mb-3">
        <button
          className="btn btn-primary"
          onClick={async () => {
            const { value: fileName } = await Swal.fire({
              title: t.enterFileName || "Enter file name",
              input: "text",
              inputPlaceholder: "finance-report",
              showCancelButton: true,
              confirmButtonText: t.exportPDF,
            });

            if (fileName) {
              exportToPDF({ element: pdfRef.current, darkMode, fileName });
            }
          }}
        >
          {t.exportPDF}
        </button>

        <button
          className="btn btn-success"
          onClick={async () => {
            const { value: fileName } = await Swal.fire({
              title: t.enterFileName || "Enter file name",
              input: "text",
              inputPlaceholder: "finance-report",
              showCancelButton: true,
              confirmButtonText: t.exportExcel,
            });

            if (fileName) {
              exportToExcel({
                entries,
                totals: {
                  income: totalIncome,
                  expense: totalExpense,
                  balance,
                },
                title: t.title,
                fileName,
              });
            }
          }}
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
