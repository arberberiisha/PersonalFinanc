import React, { useRef, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { useTranslations } from "./LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  FileSpreadsheet, Trash2, Edit3, Plus, FileText, 
  TrendingUp, TrendingDown, DollarSign, Camera, Tag, Calendar
} from "lucide-react";

import "./FinanceModule.css";

import { exportToPDF } from "./utils/exportToPDF";
import { exportToExcel } from "./utils/exportToExcel";
import { uploadBillImage } from "./utils/billUploader";
import { showError } from "./utils/showError";

const PersonalFinance = ({ darkMode }) => {
  const { translations: t, language } = useTranslations();
  
  const getSavedMonth = () => localStorage.getItem("lastMonth");

  const monthNames = {
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    sq: ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor"],
  };

  const getCurrentMonth = (lang) => {
    const now = new Date();
    return monthNames[lang][now.getMonth()];
  };

  const [entries, setEntries] = useState([]);
  
  const [form, setForm] = useState(() => ({
    type: "Expense",
    category: "",
    description: "",
    actual: "",
    month: getSavedMonth() || getCurrentMonth(language),
    year: new Date().getFullYear(),
  }));

  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [perPage] = useState(20);
  const [page, setPage] = useState(1);

  const pdfRef = useRef();
  const imageInputRef = useRef();
  const excelInputRef = useRef();

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addEntry = () => {
    if (form.actual && form.category) {
      setEntries(prev => [
        ...prev,
        {
          ...form,
          actual: Number(form.actual),
          description: form.description || "",
        },
      ]);
      setForm(prev => ({
        ...prev,
        category: "",
        description: "",
        actual: "",
      }));
    }
    localStorage.setItem("lastMonth", form.month);
  };

  const totalIncome = entries.filter((e) => e.type === "Income").reduce((acc, e) => acc + Number(e.actual), 0);
  const totalExpense = entries.filter((e) => e.type === "Expense").reduce((acc, e) => acc + Number(e.actual), 0);
  const balance = totalIncome - totalExpense;

  const chartData = useMemo(() => {
    const data = {};
    entries.forEach(entry => {
      const key = `${entry.month} ${entry.year}`.trim();
      if (!data[key]) data[key] = { name: key, Income: 0, Expense: 0 };
      if (entry.type === "Income") data[key].Income += Number(entry.actual);
      else data[key].Expense += Number(entry.actual);
    });
    return Object.values(data);
  }, [entries]);

  const clearAllEntries = async () => {
    const result = await Swal.fire({
      title: t.clearConfirmTitle,
      text: t.clearConfirmText,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: t.confirm,
    });
    if (result.isConfirmed) setEntries([]);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const ExcelJS = await import("exceljs");
    const allEntries = [];

    for (const file of files) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.getWorksheet(1);
      const headers = worksheet.getRow(2).values.map((h) => h?.toString()?.toLowerCase()?.trim());
      const getColIndex = (name) => headers.findIndex((h) => h === name.toLowerCase());

      const colMonth = getColIndex("month"), colYear = getColIndex("year"), colType = getColIndex("type"),
            colCategory = getColIndex("category"), colDescription = getColIndex("description"), colActual = getColIndex("amount");

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 2) return;
        const values = row.values;
        if (values[colMonth] && values[colActual]) {
            allEntries.push({
                month: values[colMonth].toString(),
                year: values[colYear] ? parseInt(values[colYear]) : null,
                type: values[colType],
                category: values[colCategory],
                description: values[colDescription] || "",
                actual: Number(values[colActual]),
            });
        }
      });
    }
    setEntries((prev) => [...prev, ...allEntries]);
  };

  const handleBillImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadBillImage({ file, setEntries });
    } catch (err) {
      showError(t.aiUnavailableTitle, t.aiUnavailableMessage);
    }
  };

  const sortedEntries = useMemo(() => {
    const getMonthIndex = (m) => monthNames[language].indexOf(m);
    let data = [...entries].sort((a, b) => {
      if (a.year !== b.year) return (b.year || 0) - (a.year || 0);
      return getMonthIndex(b.month) - getMonthIndex(a.month);
    });

    if (sortBy) {
      data.sort((a, b) => {
        let aVal = a[sortBy], bVal = b[sortBy];
        if (typeof aVal === "string") { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
        return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
    }
    return data;
  }, [entries, sortBy, sortDirection, language]);

  const paginated = sortedEntries.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field) => {
    setSortDirection(prev => sortBy === field && prev === "asc" ? "desc" : "asc");
    setSortBy(field);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pf-container" ref={pdfRef}>
      
      {/* 1. DASHBOARD STATS */}
      <div className="row g-4 mb-4">
        {[
          { label: t.totalIncome, val: totalIncome, icon: <TrendingUp/>, color: "pf-income-bg" },
          { label: t.totalExpense, val: totalExpense, icon: <TrendingDown/>, color: "pf-expense-bg" },
          { label: t.balance, val: balance, icon: <DollarSign/>, color: "pf-balance-bg" }
        ].map((card, i) => (
          <div key={i} className="col-12 col-md-4">
            <div className="pf-card">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-bold text-uppercase">{card.label}</span>
                <div className={`pf-stat-icon ${card.color}`}>{card.icon}</div>
              </div>
              <h2 className="fw-bold mb-0">€{card.val.toLocaleString()}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* 2. CHART AREA */}
      {entries.length > 0 && (
        <div className="pf-card no-print">
          <h5 className="fw-bold mb-4">Financial Flow</h5>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={35} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3. PREMIUM ACTION BAR (ADD ENTRY) */}
      <div className="pf-card no-print">
        <h6 className="text-muted small fw-bold text-uppercase mb-3 tracking-wider">Quick Transaction</h6>
        <div className="pf-action-bar">
          <div className="pf-input-wrapper">
            <TrendingUp size={16} className="pf-input-icon" />
            <select className="pf-field cursor-pointer" value={form.type} onChange={e => handleChange("type", e.target.value)}>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div className="pf-input-wrapper">
            <DollarSign size={16} className="pf-input-icon" />
            <input type="number" className="pf-field" placeholder="0.00" value={form.actual === 0 ? "" : form.actual} 
              onFocus={() => form.actual === 0 && handleChange("actual", "")}
              onChange={e => handleChange("actual", e.target.value)} />
          </div>
          <div className="pf-input-wrapper">
            <Calendar size={16} className="pf-input-icon" />
            <select className="pf-field border-0 pe-2" value={form.month} onChange={e => handleChange("month", e.target.value)} style={{ width: 'auto' }}>
              {monthNames[language].map(m => <option key={m}>{m}</option>)}
            </select>
            <div className="vr mx-1" style={{ height: '15px' }}></div>
            <input type="number" className="pf-field ps-2" style={{ width: '65px' }} value={form.year} onChange={e => handleChange("year", parseInt(e.target.value))} />
          </div>
          <div className="pf-input-wrapper">
            <Tag size={16} className="pf-input-icon" />
            <input className="pf-field" placeholder="Category" value={form.category} onChange={e => handleChange("category", e.target.value)} />
          </div>
          <div className="pf-input-wrapper">
            <FileText size={16} className="pf-input-icon" />
            <input className="pf-field" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} />
          </div>
          <button className="pf-add-btn" onClick={addEntry}><Plus size={24}/></button>
        </div>
      </div>

      {/* 4. TRANSACTION TABLE */}
      <div className="pf-card p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="pf-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("month")}>Period</th>
                <th onClick={() => toggleSort("category")}>Category</th>
                <th className="d-none d-md-table-cell">Description</th>
                <th onClick={() => toggleSort("actual")} className="text-end">Amount</th>
                <th className="text-end no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paginated.map((e, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout>
                    <td data-label="Period" className="small text-muted fw-bold">{e.month} {e.year}</td>
                    <td data-label="Category"><span className={`pf-badge ${e.type === 'Income' ? 'pf-income-bg' : 'pf-expense-bg'}`}>{e.category}</span></td>
                    <td data-label="Description" className="text-muted small d-none d-md-table-cell">{e.description}</td>
                    <td data-label="Amount" className={`fw-bold text-end ${e.type === 'Income' ? 'text-success' : 'text-danger'}`}>
                      {e.type === 'Income' ? '+' : '-'}€{Number(e.actual).toLocaleString()}
                    </td>
                    <td data-label="Actions" className="text-end no-print">
                      <button className="btn btn-link text-warning p-1 me-2" onClick={() => setEntries(prev => { 
                          const idx = entries.indexOf(e);
                          /* handleEdit logic here */ 
                          return prev; 
                      })}><Edit3 size={16}/></button>
                      <button className="btn btn-link text-danger p-1" onClick={() => setEntries(prev => prev.filter(item => item !== e))}><Trash2 size={16}/></button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. TOOLBAR */}
      <div className="pf-card no-print">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary px-3" disabled={page === 1} onClick={() => setPage(page-1)}>Prev</button>
            <button className="btn btn-sm btn-outline-secondary px-3" onClick={() => setPage(page+1)}>Next</button>
          </div>
          <div className="d-flex gap-2 flex-wrap justify-content-center">
            <input type="file" ref={excelInputRef} className="d-none" onChange={handleFileUpload} multiple />
            <input type="file" ref={imageInputRef} className="d-none" onChange={handleBillImageUpload} />
            <button className="btn btn-light border btn-sm" onClick={() => excelInputRef.current.click()}><FileSpreadsheet size={14}/> Import</button>
            <button className="btn btn-light border btn-sm" onClick={() => imageInputRef.current.click()}><Camera size={14}/> Scan</button>
            <button className="btn btn-primary btn-sm px-3" onClick={async () => {
              const { value: fileName } = await Swal.fire({ title: t.enterFileName, input: "text" });
              if (fileName) exportToPDF({ element: pdfRef.current, darkMode, fileName });
            }}><FileText size={14}/> PDF</button>
            <button className="btn btn-success text-white btn-sm px-3" onClick={async () => {
              const { value: fileName } = await Swal.fire({ title: t.enterFileName, input: "text" });
              if (fileName) exportToExcel({ entries, totals: { income: totalIncome, expense: totalExpense, balance }, title: t.title, fileName });
            }}><FileSpreadsheet size={14}/> Excel</button>
            <button className="btn btn-danger btn-sm" onClick={clearAllEntries}><Trash2 size={14}/></button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PersonalFinance;