import React, { useRef, useState, useMemo, useEffect } from "react";
import Swal from "sweetalert2";
import { useTranslations } from "./LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  FileSpreadsheet, Trash2, Plus, FileText, Edit3, X, Check, Lock, Unlock,
  TrendingUp, TrendingDown, DollarSign, Camera, Tag, Calendar,
  Percent, AlertCircle, HeartPulse, PieChart, ShieldCheck, Sparkles,
  Receipt, Lightbulb, Activity, ChevronLeft, ChevronRight, Upload, Download,
  Layers, HelpCircle
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "./FinanceModule.css";

// Assuming these utils exist
import { exportToExcel } from "./utils/exportToExcel";
import { uploadBillImage } from "./utils/billUploader";
import { showError } from "./utils/showError";
import { exportToATK } from "./utils/exportToATK"; 

const PersonalFinance = ({ darkMode }) => {
  const { translations: t, language } = useTranslations();
  const getSavedMonth = () => localStorage.getItem("lastMonth");

  // --- INFO MODAL STATE ---
  const [showInfoModal, setShowInfoModal] = useState(false);

  const monthNames = {
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    sq: ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor"],
  };

  const getCurrentMonth = (lang) => {
    const now = new Date();
    return monthNames[lang][now.getMonth()];
  };

  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showTaxTips, setShowTaxTips] = useState(false); 

  const [lockedMonths, setLockedMonths] = useState(() => {
    const saved = localStorage.getItem("lockedMonths");
    return saved ? JSON.parse(saved) : []; 
  });

  useEffect(() => {
    localStorage.setItem("lockedMonths", JSON.stringify(lockedMonths));
  }, [lockedMonths]);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const [form, setForm] = useState(() => ({
    type: "Expense",
    category: "",
    description: "",
    actual: "",
    fiscalNumber: "",
    month: getSavedMonth() || getCurrentMonth(language),
    year: new Date().getFullYear(),
    hasWithholding: false,
    taxType: "Rent",
  }));

  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const imageInputRef = useRef();
  const excelInputRef = useRef();

  const isCurrentMonthLocked = useMemo(() => {
    return lockedMonths.includes(`${form.month} ${form.year}`);
  }, [lockedMonths, form.month, form.year]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const calculateWithholding = (netAmount, type) => {
    const net = Number(netAmount);
    let rate = type === "Rent" ? 0.09 : 0.10;
    const gross = net / (1 - rate);
    const tax = gross - net;
    return { gross, tax, net };
  };

  const toggleMonthLock = () => {
    const key = `${form.month} ${form.year}`;
    if (lockedMonths.includes(key)) {
      setLockedMonths(prev => prev.filter(m => m !== key));
      Swal.fire({ icon: 'info', title: language === 'sq' ? 'U zhbllokua' : 'Unlocked', text: `${key}`, timer: 1500 });
    } else {
      setLockedMonths(prev => [...prev, key]);
      Swal.fire({ icon: 'success', title: language === 'sq' ? 'U bllokua' : 'Locked', text: `${key}`, timer: 1500 });
    }
  };

  const startEdit = (entry) => {
    if (lockedMonths.includes(`${entry.month} ${entry.year}`)) {
        Swal.fire("Locked", t.lockedMessage || (language === 'sq' ? 'Ky muaj është i mbyllur.' : 'This month is closed.'), "warning");
        return;
    }
    setEditingId(entry.id);
    const netVal = entry.taxDetails ? entry.taxDetails.netAmount : entry.actual;
    setForm({
        ...entry,
        actual: netVal,
        hasWithholding: !!entry.taxDetails,
        taxType: entry.taxDetails ? entry.taxDetails.type : "Rent"
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      type: "Expense",
      category: "",
      description: "",
      actual: "",
      month: getSavedMonth() || getCurrentMonth(language),
      year: new Date().getFullYear(),
      hasWithholding: false,
      taxType: "Rent",
      fiscalNumber: ""
    });
  };

  const addEntry = () => {
    if (isCurrentMonthLocked) {
        Swal.fire("Locked", t.lockedMessage || (language === 'sq' ? 'Ky muaj është i mbyllur.' : 'This month is closed.'), "error");
        return;
    }
    if (form.actual && form.category) {
        let finalAmount = Number(form.actual);
        let taxDetails = null;

        if (form.type === "Expense" && form.hasWithholding) {
            const { gross, tax, net } = calculateWithholding(form.actual, form.taxType);
            finalAmount = gross;
            taxDetails = { type: form.taxType, netAmount: net, taxAmount: tax };
        }

        const entryData = { 
            ...form, 
            id: editingId || Date.now() + Math.random(), 
            actual: finalAmount, 
            description: form.description || "", 
            taxDetails: taxDetails 
        };

        if (editingId) {
            setEntries(prev => prev.map(e => e.id === editingId ? entryData : e));
            setEditingId(null);
        } else {
            setEntries(prev => [...prev, entryData]);
        }

        setForm(prev => ({ ...prev, category: "", description: "", actual: "", hasWithholding: false, fiscalNumber: "" }));
    }
    localStorage.setItem("lastMonth", form.month);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => e.month === form.month && e.year === form.year);
  }, [entries, form.month, form.year]);

  const yearToDateIncome = useMemo(() => {
    return entries
      .filter(e => e.year === form.year && e.type === "Income")
      .reduce((sum, e) => sum + Number(e.actual), 0);
  }, [entries, form.year]);

  const vatLimitProgress = (yearToDateIncome / 30000) * 100;
  const totalIncome = filteredEntries.filter((e) => e.type === "Income").reduce((acc, e) => acc + Number(e.actual), 0);
  const totalExpense = filteredEntries.filter((e) => e.type === "Expense").reduce((acc, e) => acc + Number(e.actual), 0);
  const balance = totalIncome - totalExpense;

  const profitMargin = useMemo(() => {
    return totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;
  }, [totalIncome, balance]);

  const taxReserve = useMemo(() => {
    return balance > 0 ? balance * 0.20 : 0; 
  }, [balance]);

  const taxHealthAlerts = useMemo(() => {
    const alerts = [];
    const monthIncome = totalIncome;
    
    const sponsorshipTotal = filteredEntries
      .filter(e => e.category?.toLowerCase().includes("sponsor"))
      .reduce((sum, e) => sum + Number(e.actual), 0);
    const maxMonthlySponsor = monthIncome * 0.10;
    if (sponsorshipTotal < maxMonthlySponsor && monthIncome > 0) {
      const remaining = (maxMonthlySponsor - sponsorshipTotal).toFixed(2);
      alerts.push({
        type: "saving",
        icon: <Sparkles size={14} />,
        text: language === 'sq' 
          ? `Sponsorizime: Mund të zbritni edhe €${remaining} këtë muaj.` 
          : `Sponsorships: You can deduct €${remaining} more this month.`
      });
    }

    const pensionTotal = filteredEntries
      .filter(e => e.category?.toLowerCase().includes("trust") || e.category?.toLowerCase().includes("pension"))
      .reduce((sum, e) => sum + Number(e.actual), 0);
    const pensionThreshold = monthIncome * 0.15;
    if (pensionTotal < pensionThreshold && monthIncome > 0) {
        alerts.push({
            type: "pension",
            icon: <TrendingDown size={14} />,
            text: language === 'sq'
              ? "Këshillë: Konsideroni kontributet vullnetare për të ulur bazën tatimore."
              : "Tax Tip: Consider voluntary contributions to lower your taxable base."
        });
    }

    const hasFuel = filteredEntries.some(e => e.category?.toLowerCase().includes("naft") || e.category?.toLowerCase().includes("fuel"));
    const hasUtilities = filteredEntries.some(e => e.category?.toLowerCase().includes("rrym") || e.category?.toLowerCase().includes("electric"));

    if ((!hasFuel || !hasUtilities) && filteredEntries.length > 0) {
      alerts.push({
        type: "missing",
        icon: <Receipt size={14} />, 
        text: language === 'sq' 
          ? `Kujtesë: Sigurohuni që të gjitha shpenzimet operative për muajin ${form.month} janë regjistruar.` 
          : `Reminder: Ensure all business operating costs for ${form.month} are logged.`
      });
    }

    return alerts;
  }, [filteredEntries, totalIncome, language, form.month]);

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

  const handleDownloadFinancePDF = async () => {
    if (filteredEntries.length === 0) {
      Swal.fire("Info", language === 'sq' ? 'Nuk ka shënime për këtë muaj' : "No entries to export for this month", "info");
      return;
    }
    const { value: fileName } = await Swal.fire({ 
      title: t.enterFileName, input: "text", inputValue: `Report_${form.month}_${form.year}`
    });
    if (!fileName) return;

    const doc = new jsPDF("p", "mm", "a4");
    autoTable(doc, {
      startY: 65,
      head: [[t.month, t.category, t.description, "Tax Info", t.amount]],
      body: [...filteredEntries].map(e => [
        `${e.month} ${e.year}`, e.category, e.description || "---",
        e.taxDetails ? `${e.taxDetails.type} Tax: €${e.taxDetails.taxAmount.toFixed(2)}` : "-",
        `${e.type === 'Income' ? '+' : '-'}€${Number(e.actual).toLocaleString()}`
      ]),
    });
    doc.save(`${fileName}.pdf`);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    let ExcelJS;
    try { ExcelJS = await import("exceljs"); } catch (error) { return; }
    const allEntries = [];

    const isValidMonth = (val) => {
        if (!val) return false;
        const s = val.toString().trim().toLowerCase();
        return [...monthNames.en, ...monthNames.sq].some(m => s.includes(m.toLowerCase()));
    };

    for (const file of files) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.getWorksheet(1);
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 2) return;
        const values = row.values;
        if (values[1] && isValidMonth(values[1])) {
            allEntries.push({
                id: Date.now() + Math.random(),
                month: values[1].toString(),
                year: values[2] ? parseInt(values[2]) : new Date().getFullYear(),
                type: values[3] || "Expense",
                category: values[4] || "General",
                description: values[5] || "",
                actual: Number(values[6]),
                fiscalNumber: "" 
            });
        }
      });
    }
    setEntries((prev) => [...prev, ...allEntries]);
    e.target.value = null; 
  };

  const handleBillImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try { await uploadBillImage({ file, setEntries }); } catch (err) { showError(t.aiUnavailableTitle, t.aiUnavailableMessage); }
  };

  const handleSmartExport = async () => {
    const currentYear = form.year;
    const currentMonth = form.month;

    const { value: periodType } = await Swal.fire({
        title: language === 'sq' ? 'Zgjidh Periudhën e Eksportit' : 'Select Export Period',
        input: 'select',
        inputOptions: {
            'month': language === 'sq' ? `Muaji Aktual (${currentMonth})` : `Current Month (${currentMonth})`,
            'q1': 'Q1 (Jan - Mar)',
            'q2': 'Q2 (Apr - Jun)',
            'q3': 'Q3 (Jul - Sep)',
            'q4': 'Q4 (Oct - Dec)',
            'year': language === 'sq' ? `Viti i Plotë (${currentYear})` : `Full Year (${currentYear})`
        },
        inputPlaceholder: language === 'sq' ? 'Zgjidhni...' : 'Select...',
        showCancelButton: true,
        confirmButtonColor: '#1e293b', 
    });

    if (!periodType) return;

    let periodLabel = "";
    let dataToExport = [];

    const months = monthNames[language]; 

    if (periodType === 'month') {
        periodLabel = `${currentMonth}`;
        dataToExport = entries.filter(e => e.month === currentMonth && e.year === currentYear);
    } 
    else if (periodType === 'year') {
        periodLabel = `Vjetor`;
        dataToExport = entries.filter(e => e.year === currentYear);
    } 
    else {
        let targetMonths = [];
        if (periodType === 'q1') { targetMonths = [months[0], months[1], months[2]]; periodLabel = "Q1"; }
        if (periodType === 'q2') { targetMonths = [months[3], months[4], months[5]]; periodLabel = "Q2"; }
        if (periodType === 'q3') { targetMonths = [months[6], months[7], months[8]]; periodLabel = "Q3"; }
        if (periodType === 'q4') { targetMonths = [months[9], months[10], months[11]]; periodLabel = "Q4"; }

        dataToExport = entries.filter(e => e.year === currentYear && targetMonths.includes(e.month));
    }

    if (dataToExport.length === 0) {
        Swal.fire("Info", language === 'sq' ? 'Nuk ka të dhëna për këtë periudhë.' : 'No data found for this period.', "info");
        return;
    }

    exportToATK({ 
        entries: dataToExport, 
        periodLabel: periodLabel, 
        year: currentYear 
    });
  };

  const paginated = useMemo(() => {
    return filteredEntries.slice((page - 1) * perPage, page * perPage);
  }, [filteredEntries, page, perPage]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pf-container position-relative">
      
      {/* HEADER WITH INFO BUTTON */}
      <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="fw-bold text-dark mb-0">
              {t.personalFinance}
          </h4>
          <button 
            className="btn btn-light btn-sm text-muted border shadow-sm d-flex align-items-center gap-2"
            onClick={() => setShowInfoModal(true)}
          >
              <HelpCircle size={16} />
              <span className="d-none d-md-inline">{language === 'sq' ? 'Si funksionon?' : 'How it works'}</span>
          </button>
      </div>

      {/* 1. STATS CARDS */}
      <div className="row g-4 mb-4">
        {[
          { label: t.totalIncome, val: totalIncome, icon: <TrendingUp/>, color: "pf-income-bg" },
          { label: t.totalExpense, val: totalExpense, icon: <TrendingDown/>, color: "pf-expense-bg" },
          { label: t.balance, val: balance, icon: <DollarSign/>, color: "pf-balance-bg" }
        ].map((card, i) => (
          <div key={i} className="col-12 col-md-4">
            <div className="pf-card shadow-sm border-0">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-bold text-uppercase">{card.label}</span>
                <div className={`pf-stat-icon ${card.color}`}>{card.icon}</div>
              </div>
              <h2 className="fw-bold mb-0">€{card.val.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* 2. BUSINESS HEALTH SCORECARD */}
      <div className="row g-3 mb-4">
          <div className="col-12">
              <div className="pf-card border-0 bg-primary bg-opacity-10 shadow-none d-flex flex-wrap gap-4 align-items-center justify-content-between p-3">
                  <div className="d-flex align-items-center gap-3">
                      <div className="bg-white p-2 rounded-circle shadow-sm text-primary">
                          <HeartPulse size={20} />
                      </div>
                      <div>
                          <p className="text-muted small fw-bold text-uppercase mb-0">{language === 'sq' ? 'Shëndeti i Biznesit' : 'Business Health'}</p>
                          <h6 className="fw-bold mb-0">{language === 'sq' ? 'Pasqyra e Performancës' : 'Performance Insights'}</h6>
                      </div>
                  </div>
                  
                  <div className="d-flex flex-wrap gap-4 align-items-center">
                      <div className="text-center">
                          <p className="text-muted extra-small fw-bold mb-1">{t.profitMargin || 'PROFIT MARGIN'}</p>
                          <span className={`badge ${profitMargin > 20 ? 'bg-success' : 'bg-warning'} px-3 py-2 shadow-sm`}>
                             <PieChart size={12} className="me-1"/> {profitMargin}%
                          </span>
                      </div>
                      <div className="text-center">
                          <p className="text-muted extra-small fw-bold mb-1">{t.taxReserve || 'TAX RESERVE'} (20%)</p>
                          <span className="text-dark fw-bold">€{taxReserve.toLocaleString()}</span>
                      </div>

                      <div className="text-center border-start ps-4">
                          <p className="text-muted extra-small fw-bold mb-1">{language === 'sq' ? 'LIMITI VJETOR TVSH' : 'YEARLY VAT LIMIT'} (€30k)</p>
                          <div className="d-flex align-items-center gap-2">
                             <div className="progress flex-grow-1" style={{ width: '80px', height: '6px' }}>
                                <div 
                                    className={`progress-bar ${vatLimitProgress > 80 ? 'bg-danger' : 'bg-primary'}`} 
                                    style={{ width: `${Math.min(vatLimitProgress, 100)}%` }}
                                ></div>
                             </div>
                             <span className="extra-small fw-bold text-dark">{Math.round(vatLimitProgress)}%</span>
                          </div>
                      </div>

                      <button 
                        className={`btn btn-sm shadow-sm d-flex align-items-center gap-2 ${showTaxTips ? 'btn-warning' : 'btn-light border'}`}
                        onClick={() => setShowTaxTips(!showTaxTips)}
                      >
                          {showTaxTips ? <X size={14}/> : <Sparkles size={14} className="text-warning" />}
                          <span className="fw-bold">{language === 'sq' ? 'Këshilla' : 'Get Tips'}</span>
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <AnimatePresence>
        {showTaxTips && taxHealthAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
            <div className="pf-card border-0 bg-white shadow-sm p-0 overflow-hidden" style={{ borderLeft: '4px solid #f59e0b' }}>
               <div className="bg-warning bg-opacity-10 px-4 py-2 border-bottom border-warning border-opacity-25 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Lightbulb size={16} className="text-warning" />
                    <span className="small fw-bold text-warning-emphasis">SMART TAX SAVER</span>
                  </div>
                  <span className="badge bg-warning text-dark extra-small">{taxHealthAlerts.length} SUGGESTIONS</span>
               </div>
               <div className="p-3">
                  {taxHealthAlerts.map((alert, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-3 mb-2 border-bottom border-light pb-2 last-child-border-0">
                       <div className={`d-flex align-items-center justify-content-center rounded-circle shadow-sm 
                          ${alert.type === 'saving' ? 'bg-success text-white' : 
                            alert.type === 'pension' ? 'bg-primary text-white' : 'bg-warning text-dark'}`} 
                          style={{ width: '28px', height: '28px', minWidth: '28px' }}>
                          {alert.icon}
                       </div>
                       <p className="small mb-0 text-muted fw-bold">{alert.text}</p>
                    </div>
                  ))}
                  {yearToDateIncome > 25000 && (
                    <div className="mt-3 p-3 bg-danger bg-opacity-10 rounded border border-danger border-opacity-25 d-flex align-items-center gap-3">
                       <Activity size={20} className="text-danger" />
                       <div>
                          <p className="extra-small fw-bold text-danger mb-0 uppercase">Compliance Critical</p>
                          <p className="small mb-0 text-dark">
                             {language === 'sq' 
                               ? `Jeni afër limitit prej €30,000 të qarkullimit. Përgatituni për regjistrimin e TVSH-së.`
                               : `You are approaching the €30,000 turnover limit. Prepare for VAT registration requirements.`}
                          </p>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {entries.length > 0 && (
        <div className="pf-card shadow-sm border-0 no-print mb-4">
          <h5 className="fw-bold mb-4">{t.chartTitle || "Financial Flow"}</h5>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={35} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. NEW ENTRY FORM */}
      <div className={`pf-card shadow-sm border-0 no-print mb-4 p-4 ${isCurrentMonthLocked ? 'locked-form' : ''} ${editingId ? 'border-primary border-opacity-50' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
             <div className="d-flex flex-column gap-1">
                <h6 className="fw-bold text-uppercase mb-0 tracking-wider d-flex align-items-center gap-2" style={{fontSize: '0.85rem', color: editingId ? 'var(--primary)' : 'inherit'}}>
                    {editingId ? "Update Entry" : (t.newEntry || "New Entry")}
                    {isCurrentMonthLocked && <Lock size={14} className="text-danger" />}
                </h6>
                {form.type === "Expense" && (
                    <div className="form-check form-switch d-flex align-items-center gap-2 p-0 m-0">
                        <input className="form-check-input cursor-pointer ms-0" type="checkbox" 
                            disabled={isCurrentMonthLocked}
                            id="taxSwitch" checked={form.hasWithholding} 
                            onChange={(e) => handleChange("hasWithholding", e.target.checked)} 
                            style={{width: '32px', height: '16px'}}/>
                        <label className="form-check-label extra-small fw-bold text-muted cursor-pointer" htmlFor="taxSwitch" style={{fontSize: '0.75rem'}}>
                            {t.applyTax || "Withholding Tax?"}
                        </label>
                    </div>
                )}
             </div>
             {editingId ? (
                <button className="btn btn-sm btn-light text-danger fw-bold border" onClick={cancelEdit}>
                    <X size={14} className="me-1"/> {language === 'sq' ? 'Anulo' : 'Cancel Edit'}
                </button>
             ) : isCurrentMonthLocked ? (
                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 py-1 px-3">{language === 'sq' ? 'PERIUDHË E MBYLLUR' : 'PERIOD CLOSED'}</span>
             ) : <AlertCircle size={16} className="text-muted" />}
        </div>

        <div className="row g-3">
            <div className="col-12 col-md-2">
                <label className="small text-muted fw-bold mb-1">{t.type}</label>
                <div className="input-group shadow-sm">
                    <span className="input-group-text bg-light"><TrendingUp size={16}/></span>
                    <select disabled={isCurrentMonthLocked} className="form-select fw-bold text-dark" 
                        value={form.type} onChange={e => handleChange("type", e.target.value)}>
                        <option value="Income">{t.income}</option>
                        <option value="Expense">{t.expense}</option>
                    </select>
                </div>
            </div>

            <div className="col-12 col-md-2">
                <label className="small text-muted fw-bold mb-1">{t.amount}</label>
                <div className="input-group shadow-sm">
                    <span className="input-group-text bg-light"><DollarSign size={16}/></span>
                    <input disabled={isCurrentMonthLocked} type="number" className="form-control fw-bold" placeholder="0.00" 
                        value={form.actual === 0 ? "" : form.actual} 
                        onChange={e => handleChange("actual", e.target.value)} />
                </div>
            </div>

            <div className="col-12 col-md-2">
                <label className="small text-muted fw-bold mb-1">{t.date}</label>
                <div className="input-group shadow-sm">
                    <select className="form-select" value={form.month} onChange={e => handleChange("month", e.target.value)}>
                        {monthNames[language].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input type="number" className="form-control" style={{maxWidth: '80px'}} 
                        value={form.year} onChange={e => handleChange("year", parseInt(e.target.value))} />
                </div>
            </div>

            <div className="col-12 col-md-2">
                <label className="small text-muted fw-bold mb-1">Fiscal #</label>
                <div className="input-group shadow-sm">
                    <span className="input-group-text bg-light"><ShieldCheck size={16}/></span>
                    <input disabled={isCurrentMonthLocked} type="text" className="form-control" placeholder="Supplier #" 
                        value={form.fiscalNumber} onChange={e => handleChange("fiscalNumber", e.target.value)} />
                </div>
            </div>

            <div className="col-12 col-md-2">
                <label className="small text-muted fw-bold mb-1">{t.category}</label>
                <div className="input-group shadow-sm">
                    <span className="input-group-text bg-light"><Tag size={16}/></span>
                    <input disabled={isCurrentMonthLocked} type="text" className="form-control" placeholder="..." 
                        value={form.category} onChange={e => handleChange("category", e.target.value)} />
                </div>
            </div>

            <div className="col-12 col-md-2">
                <label className="small text-muted fw-bold mb-1">{t.description}</label>
                <div className="input-group shadow-sm">
                    <span className="input-group-text bg-light"><FileText size={16}/></span>
                    <input disabled={isCurrentMonthLocked} type="text" className="form-control" placeholder="..." 
                        value={form.description} onChange={e => handleChange("description", e.target.value)} />
                </div>
            </div>

            <div className="col-12 mt-3">
                <button disabled={isCurrentMonthLocked} className={`btn ${editingId ? 'btn-success' : isCurrentMonthLocked ? 'btn-secondary' : 'btn-primary'} w-100 py-2 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2`} onClick={addEntry}>
                    {editingId ? <Check size={20} strokeWidth={3}/> : <Plus size={20} strokeWidth={3} />}
                    {editingId ? (language === 'sq' ? 'Përditëso' : "Update Transaction") : t.addEntry}
                </button>
            </div>
        </div>
      </div>

      {/* 5. DATA TABLE */}
      <div className="pf-card shadow-sm border-0 p-0 overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="pf-table mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4" style={{width: '18%'}}>{t.month}</th>
                <th style={{width: '15%'}}>{t.category}</th>
                <th className="d-none d-md-table-cell" style={{width: '37%'}}>{t.description}</th>
                <th className="text-end pe-4" style={{width: '18%'}}>{t.amount}</th>
                <th className="text-end pe-4 no-print" style={{width: '12%'}}>{language === 'sq' ? 'Veprimet' : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paginated.map((e, i) => {
                  const isLocked = lockedMonths.includes(`${e.month} ${e.year}`);
                  return (
                    <motion.tr key={e.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout>
                      <td className="ps-4 small text-muted fw-bold">{e.month} {e.year}</td>
                      <td><span className={`pf-badge ${e.type === 'Income' ? 'pf-income-bg' : 'pf-expense-bg'}`}>{e.category}</span></td>
                      <td className="text-muted small d-none d-md-table-cell">
                          {e.description}
                          {e.taxDetails && <div className="mt-1"><span className="badge bg-warning text-dark border-warning bg-opacity-25 py-1">{e.taxDetails.type} {t.taxType || "Tax"}: €{e.taxDetails.taxAmount.toFixed(2)}</span></div>}
                      </td>
                      <td className="text-end pe-4">
                          <span className={`fw-bold ${e.type === 'Income' ? 'text-success' : 'text-danger'}`}>
                              {e.type === 'Income' ? '+' : '-'}€{Number(e.actual).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </span>
                      </td>
                      <td className="text-end pe-4 no-print">
                          <div className="d-flex justify-content-end gap-2">
                              {isLocked ? <Lock size={18} className="text-muted opacity-50" /> : (
                                <>
                                  <button className="btn btn-link text-primary p-1" onClick={() => startEdit(e)}><Edit3 size={18}/></button>
                                  <button className="btn btn-link text-danger p-1" onClick={() => setEntries(prev => prev.filter(item => item.id !== e.id))}><Trash2 size={18}/></button>
                                </>
                              )}
                          </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. TOOLBAR ACTIONS */}
      <div className="pf-card shadow-sm border-0 no-print p-3 bg-white">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-center gap-4">
          
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm d-flex align-items-center px-3" disabled={page === 1} onClick={() => setPage(page-1)}>
                <ChevronLeft size={16} className="me-1"/> {t.prev || "Prev"}
            </button>
            <div className="px-3 py-1 bg-light rounded-pill border small fw-bold text-muted">Page {page}</div>
            <button className="btn btn-outline-secondary btn-sm d-flex align-items-center px-3" onClick={() => setPage(page+1)}>
                {t.next || "Next"} <ChevronRight size={16} className="ms-1"/>
            </button>
          </div>

          <div className="d-flex flex-wrap gap-2 justify-content-center align-items-center">
            
            <button 
                className={`btn btn-sm d-flex align-items-center gap-2 px-3 fw-bold transition-all ${isCurrentMonthLocked ? 'btn-danger shadow-sm' : 'btn-outline-dark'}`}
                onClick={toggleMonthLock}
            >
                {isCurrentMonthLocked ? <><Lock size={14}/> {language === 'sq' ? 'Zhblloko' : 'Unlock'}</> : <><Unlock size={14}/> {language === 'sq' ? 'Blloko' : 'Lock'}</>}
            </button>

            <div className="vr d-none d-md-block mx-1 text-muted opacity-25"></div>

            <div className="btn-group shadow-sm">
                <input type="file" ref={excelInputRef} className="d-none" onChange={handleFileUpload} multiple />
                <input type="file" ref={imageInputRef} className="d-none" onChange={handleBillImageUpload} />
                <button className="btn btn-light border-secondary-subtle btn-sm text-muted d-flex align-items-center gap-2 px-3" onClick={() => excelInputRef.current.click()}>
                    <Upload size={14} className="text-primary"/> Excel
                </button>
                <button className="btn btn-light border-secondary-subtle btn-sm text-muted d-flex align-items-center gap-2 px-3" onClick={() => imageInputRef.current.click()}>
                    <Camera size={14} className="text-primary"/> Scan
                </button>
            </div>

            <div className="btn-group shadow-sm">
                <button className="btn btn-white border-secondary-subtle btn-sm text-dark d-flex align-items-center gap-2 px-3" onClick={handleDownloadFinancePDF}>
                    <FileText size={14} className="text-danger"/> PDF
                </button>
                <button className="btn btn-white border-secondary-subtle btn-sm text-dark d-flex align-items-center gap-2 px-3" onClick={async () => {
                    const { value: fileName } = await Swal.fire({ title: t.enterFileName, input: "text" });
                    if (fileName) exportToExcel({ entries: filteredEntries, totals: { income: totalIncome, expense: totalExpense, balance }, title: t.appTitle, fileName });
                }}>
                    <FileSpreadsheet size={14} className="text-success"/> Excel
                </button>
                
                <button className="btn btn-dark btn-sm d-flex align-items-center gap-2 px-3" onClick={handleSmartExport}>
                    <Layers size={14} className="text-info"/> ATK
                </button>
            </div>

            <button disabled={isCurrentMonthLocked} className="btn btn-outline-danger btn-sm shadow-sm d-flex align-items-center justify-content-center" onClick={() => setEntries([])} style={{ width: '36px', height: '32px' }} title="Clear All">
                <Trash2 size={16}/>
            </button>

          </div>
        </div>
      </div>

      {/* --- INFO MODAL POPUP (FIXED VISIBILITY & TRANSLATIONS) --- */}
      <AnimatePresence>
        {showInfoModal && (
            <div 
                style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'
                }}
            >
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-4 shadow-lg overflow-hidden"
                    style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
                >
                    <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                            <HelpCircle size={22}/> {language === 'sq' ? 'Udhëzues: Financat Ditore' : 'Guide: Personal Finance'}
                        </h5>
                        <button 
                            onClick={() => setShowInfoModal(false)}
                            className="btn btn-sm btn-close-white"
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', lineHeight: 1, cursor: 'pointer' }}
                        >
                            &times;
                        </button>
                    </div>

                    <div className="p-4">
                        <div className="row g-4">
                            <div className="col-md-6">
                                <h6 className="fw-bold text-dark mb-2">📌 {language === 'sq' ? 'Për çfarë shërben kjo faqe?' : 'What is this used for?'}</h6>
                                <p className="small text-muted mb-3">
                                    {language === 'sq' 
                                      ? "Ky është Paneli Ditor i Transaksioneve. Përdoreni këtë faqe për të regjistruar faturat dhe të hyrat në kohë reale, ashtu siç ndodhin."
                                      : "This is the Daily Operational Hub. Use this page to log every single bill, invoice, and income source as they happen."}
                                </p>
                                <ul className="small text-muted ps-3 mb-0">
                                    <li>{language === 'sq' ? 'Regjistrimi i shpenzimeve dhe faturave ditore.' : 'Recording day-to-day expenses.'}</li>
                                    <li>{language === 'sq' ? 'Monitorimi i rrjedhës së parasë (Të Hyra vs Shpenzime).' : 'Tracking cash flow (Income vs. Expense).'}</li>
                                    <li>{language === 'sq' ? 'Përgatitja e Librave të Blerjes/Shitjes për ATK.' : 'Generating Monthly ATK Reports (VAT).'}</li>
                                </ul>
                            </div>
                            <div className="col-md-6">
                                <h6 className="fw-bold text-dark mb-2">⏰ {language === 'sq' ? 'Kur duhet përdorur?' : 'When to use it?'}</h6>
                                <p className="small text-muted mb-3">
                                    {language === 'sq' ? 'Çdo ditë ose Javë. Mos i lini grumbull për fund të vitit!' : 'Daily or Weekly. Don\'t wait until the end of the year!'}
                                </p>
                                <div className="p-3 bg-info bg-opacity-10 rounded border border-info border-opacity-25 d-flex gap-2 align-items-start">
                                    <Lightbulb size={18} className="text-info mt-1 flex-shrink-0"/>
                                    <div className="small text-dark">
                                        <strong>{language === 'sq' ? 'Këshillë:' : 'Pro Tip:'}</strong> {language === 'sq' ? 'Përdorni butonin "Scan" për të fotografuar dhe ruajtur faturat fizike direkt nga telefoni.' : 'Use the "Scan Receipt" feature to quickly digitize paper bills from your phone.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-light border-top text-end">
                        <button className="btn btn-primary px-4" onClick={() => setShowInfoModal(false)}>
                            {language === 'sq' ? 'Në rregull' : 'Got it'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default PersonalFinance;