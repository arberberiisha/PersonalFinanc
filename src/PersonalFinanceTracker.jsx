import React, { useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import Swal from "sweetalert2";

export default function PersonalFinanceTracker() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    type: "Expense",
    category: "",
    description: "",
    actual: "",
    month: "January",
  });

  const pdfRef = useRef();

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
    const toHide = element.querySelectorAll(".no-print");
    toHide.forEach((el) => (el.style.display = "none"));

    const options = {
      margin: 0.5,
      filename: "finance-report.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf()
      .set(options)
      .from(element)
      .save()
      .then(() => {
        toHide.forEach((el) => (el.style.display = ""));
      });
  };

  const clearAllEntries = async () => {
    const result = await Swal.fire({
      title: "Clear All?",
      text: "This will remove all your data permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, clear it!",
    });
  
    if (result.isConfirmed) {
      setEntries([]);
      Swal.fire("Cleared!", "All entries have been removed.", "success");
    }
  };
  

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Finance Report");

    sheet.mergeCells("A1", "E1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "Personal Finance Report";
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

    sheet.columns.forEach((col) => {
      col.width = 20;
    });

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
  };

  return (
    <>
      <div className="container py-4 no-print">
        <input
          type="file"
          accept=".xlsx"
          className="form-control mb-3"
          onChange={handleFileUpload}
        />
      </div>

      <div className="container py-5" ref={pdfRef}>
        <h1 className="text-center mb-4">Personal Finance Tracker</h1>

        {/* Form inputs */}
        <div className="no-print row g-3 mb-4">
          <div className="col-md-2">
            <select
              className="form-select"
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
            >
              <option>Income</option>
              <option>Expense</option>
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={form.month}
              onChange={(e) => handleChange("month", e.target.value)}
            >
              {[
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
              ].map((month) => (
                <option key={month}>{month}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Category"
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Amount"
              value={form.actual}
              onChange={(e) => handleChange("actual", e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-danger w-100"
              onClick={addEntry}
            >
              Add Entry
            </button>
          </div>
        </div>

        {/* Table */}
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>Month</th>
              <th>Type</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
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
            <strong className="text-success">Total Income:</strong> ${totalIncome}
          </p>
          <p>
            <strong className="text-danger">Total Expense:</strong> ${totalExpense}
          </p>
          <p>
            <strong className="text-primary">Balance:</strong> ${balance}
          </p>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="container d-flex gap-3 mt-3">
        <button className="btn btn-primary" onClick={exportToPDF}>
          Export as PDF
        </button>
        <button className="btn btn-success" onClick={exportToExcel}>
          Export as Excel
        </button>
        <button className="btn btn-outline-danger" onClick={clearAllEntries}>
          Clear All
        </button>
      </div>
    </>
  );
}
