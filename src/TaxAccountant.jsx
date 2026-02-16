import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { useTranslations } from "./LanguageContext"; 
import { 
  UploadCloud, FileSpreadsheet, Download, 
  TrendingUp, TrendingDown, Building2, AlertCircle,
  FileCheck, Trash2, CalendarCheck, Activity, Users, HelpCircle,
  Scale, Landmark, Plus, ArrowRight
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from 'file-saver'; 
import { Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

const TaxAccountant = () => {
  const { translations: t, language } = useTranslations();
  
  const [year, setYear] = useState(new Date().getFullYear());
  const [businessType, setBusinessType] = useState("LLC"); 
  const [companyName, setCompanyName] = useState("RB Tech");
  const [entries, setEntries] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  const TAX_RATES = {
    PROFIT_TAX: 0.10,
    VAT: 0.18,
    PENSION: 0.05
  };

  const fileInputRef = useRef();

  // --- SMART BATCH IMPORT LOGIC ---
  const handleBatchImport = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const ExcelJS = await import("exceljs");
    let aggregatedEntries = [];
    let fileMetadata = [];

    Swal.fire({ title: t.importDesc || 'Analyzing...', didOpen: () => Swal.showLoading() });

    try {
        for (const file of files) {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(await file.arrayBuffer());
          
          const worksheet = workbook.getWorksheet(1);
          if (!worksheet) continue;

          let fileType = 'JOURNAL';
          let detectedData = [];

          // 1. SCAN FOR HEADER ROW
          let headerRowIndex = -1;
          let colMap = { amount: -1, category: -1, type: -1, date: -1 };

          worksheet.eachRow((row, rowNumber) => {
              if (rowNumber > 10 || headerRowIndex !== -1) return; 
              
              const values = row.values.map(v => v ? v.toString().toLowerCase().trim() : "");
              const hasAmount = values.some(v => v.includes('amount') || v.includes('shuma') || v.includes('total') || v.includes('actual'));

              if (hasAmount) {
                  headerRowIndex = rowNumber;
                  values.forEach((val, idx) => {
                      if (val.includes('amount') || val.includes('shuma') || val.includes('actual') || val.includes('total')) colMap.amount = idx;
                      if (val.includes('category') || val.includes('kategoria') || val.includes('desc')) colMap.category = idx;
                      if (val.includes('type') || val.includes('tipi')) colMap.type = idx;
                      if (val.includes('date') || val.includes('data')) colMap.date = idx;
                  });

                  if (values.includes('employee name') || values.includes('emri') || values.includes('net salary')) {
                      fileType = 'PAYROLL';
                  }
              }
          });

          // 2. PARSE DATA
          if (headerRowIndex !== -1) {
              worksheet.eachRow((row, rowNumber) => {
                  if (rowNumber <= headerRowIndex) return; 

                  const rowVal = row.values;
                  
                  const amountVal = colMap.amount > -1 ? rowVal[colMap.amount] : null;
                  const categoryVal = colMap.category > -1 ? rowVal[colMap.category] : "General";
                  let typeVal = colMap.type > -1 ? rowVal[colMap.type] : "Expense"; 

                  if (fileType === 'PAYROLL') typeVal = "Expense";

                  let parsedAmount = 0;
                  if (typeof amountVal === 'number') parsedAmount = amountVal;
                  else if (typeof amountVal === 'string') parsedAmount = parseFloat(amountVal.replace(/[^0-9.-]+/g,""));

                  if (parsedAmount && parsedAmount !== 0) {
                      detectedData.push({
                          type: typeVal,
                          category: categoryVal ? categoryVal.toString() : "Uncategorized",
                          amount: Math.abs(parsedAmount),
                          source: fileType
                      });
                  }
              });
          } else {
              // 3. FALLBACK BLIND EXTRACTION
              worksheet.eachRow((row, rowNumber) => {
                  const vals = row.values;
                  const numericIndex = vals.findIndex(v => typeof v === 'number');
                  
                  if (numericIndex > -1) {
                      const amount = vals[numericIndex];
                      const category = typeof vals[numericIndex - 1] === 'string' ? vals[numericIndex - 1] : "Imported Item";
                      
                      detectedData.push({
                          type: "Expense",
                          category: category,
                          amount: Math.abs(amount),
                          source: "Unknown Format"
                      });
                  }
              });
          }

          if (detectedData.length > 0) {
              aggregatedEntries = [...aggregatedEntries, ...detectedData];
              fileMetadata.push({ 
                  name: file.name, 
                  size: (file.size / 1024).toFixed(1) + " KB", 
                  type: fileType,
                  count: detectedData.length 
              });
          }
        }

        setUploadedFiles(prev => [...prev, ...fileMetadata]);
        setEntries(prev => [...prev, ...aggregatedEntries]);
        Swal.close();
        
        if (aggregatedEntries.length > 0) {
            Swal.fire({
                icon: 'success', 
                title: 'Data Merged',
                text: `Successfully combined ${aggregatedEntries.length} transactions.`
            });
        } else {
             Swal.fire("Warning", "No readable data found.", "warning");
        }
        
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to parse files.", "error");
    }
    
    e.target.value = null; 
  };

  // --- CALCULATIONS ---
  const totalIncome = entries
    .filter(e => ["Income", "Të ardhura", "Income"].includes(e.type) || (typeof e.type === 'string' && e.type.toLowerCase().includes('income')))
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalExpense = entries
    .filter(e => ["Expense", "Shpenzime", "Expenses"].includes(e.type) || (typeof e.type === 'string' && e.type.toLowerCase().includes('expense')))
    .reduce((sum, e) => sum + e.amount, 0);
  
  const grossProfit = totalIncome - totalExpense;
  const taxableProfit = grossProfit > 0 ? grossProfit : 0;
  
  const estimatedVAT_Owe = totalIncome * TAX_RATES.VAT;
  const expensesWithVAT = entries.filter(e => {
      const isExpense = ["Expense", "Shpenzime"].includes(e.type) || (typeof e.type === 'string' && e.type.toLowerCase().includes('expense'));
      const isPayroll = e.source === 'PAYROLL' || (e.category && e.category.toLowerCase().includes('pag'));
      return isExpense && !isPayroll;
  }).reduce((sum, e) => sum + e.amount, 0);

  const estimatedVAT_Claim = expensesWithVAT * TAX_RATES.VAT;
  const netVAT = estimatedVAT_Owe - estimatedVAT_Claim;

  const pensionContribution = (grossProfit * TAX_RATES.PENSION);
  const profitTax = taxableProfit * TAX_RATES.PROFIT_TAX; 
  const totalTaxLiability = (netVAT > 0 ? netVAT : 0) + profitTax;

  // --- CHARTS & EXPORT ---
  const waterfallData = [
      { name: 'Revenue', value: totalIncome, fill: '#10b981' }, 
      { name: 'Expenses', value: totalExpense, fill: '#ef4444' }, 
      { name: 'Gross Profit', value: grossProfit, fill: '#3b82f6' }, 
      { name: 'Taxes', value: totalTaxLiability, fill: '#f59e0b' }, 
      { name: 'Net Pocket', value: grossProfit - totalTaxLiability, fill: '#6366f1' } 
  ];

  const generateDeclarationExcel = async () => {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Annual Declaration");

    sheet.columns = [
      { header: 'Item', key: 'desc', width: 30 },
      { header: 'Value', key: 'val', width: 20 },
      { header: 'Notes', key: 'note', width: 40 },
    ];

    sheet.mergeCells('A1:C1');
    sheet.getCell('A1').value = `TAX DECLARATION - ${year}`;
    sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    const dataRows = [
        ["Total Revenue", totalIncome, "Gross income from all sources"],
        ["Total Expenses", totalExpense, "Includes Payroll & Operational costs"],
        ["Gross Profit", grossProfit, "Revenue - Expenses"],
        ["", "", ""],
        ["Taxable Base", taxableProfit, "Same as Gross Profit for standard LLC"],
        ["Profit Tax (10%)", profitTax, "Corporate Income Tax (CD)"],
        ["VAT Liability", netVAT > 0 ? netVAT : 0, "Net VAT payable to ATK"],
        ["", "", ""],
        ["TOTAL PAYABLE", totalTaxLiability, "Transfer this amount to Tax Admin"]
    ];

    dataRows.forEach(r => sheet.addRow(r));
    sheet.getRow(10).font = { bold: true };
    sheet.getCell('B10').numFmt = '€#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${companyName}_Official_Tax_Report_${year}.xlsx`);
  };

  const generateDeclarationPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFillColor(30, 41, 59); doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(22); doc.setTextColor(255, 255, 255);
    doc.text(companyName.toUpperCase(), 15, 20);
    doc.setFontSize(10); doc.setTextColor(200, 200, 200);
    doc.text(`Official Tax Declaration Summary - ${year}`, 15, 30);

    autoTable(doc, {
        startY: 50,
        head: [['Description', 'Amount', 'Notes']],
        body: [
            ['Total Revenue', `€ ${totalIncome.toLocaleString()}`, 'Aggregated from Sales'],
            ['Total Expenses', `(€ ${totalExpense.toLocaleString()})`, 'Operational + Payroll'],
            ['GROSS PROFIT', `€ ${grossProfit.toLocaleString()}`, 'Before Tax'],
            ['Profit Tax (10%)', `€ ${profitTax.toLocaleString()}`, 'CD Tax Line'],
            ['Net VAT', `€ ${netVAT > 0 ? netVAT.toLocaleString() : '0.00'}`, 'Payable VAT'],
            ['TOTAL LIABILITY', `€ ${totalTaxLiability.toLocaleString()}`, 'Total to Pay'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' }
    });
    doc.save(`${companyName}_Declaration_${year}.pdf`);
  };

  return (
    <div className="container mt-4 mb-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card shadow-sm border-0">
        <div className="card-body p-4 p-md-5">
          
          {/* IMPORTANT: Hidden Input must be OUTSIDE conditional blocks */}
          <input 
             type="file" 
             ref={fileInputRef} 
             multiple 
             accept=".xlsx" 
             className="d-none" 
             onChange={handleBatchImport} 
          />

          {/* HEADER */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 border-bottom pb-4 gap-3">
            <div>
              <div className="d-flex align-items-center gap-3">
                  <h2 className="fw-bold text-primary mb-1 d-flex align-items-center">
                      <Scale className="me-2"/> {t.taxAccountant || "Tax Accountant"}
                  </h2>
                  <button className="btn btn-light btn-sm text-primary border shadow-sm rounded-circle p-2" onClick={() => setShowInfoModal(true)}>
                      <HelpCircle size={18}/>
                  </button>
              </div>
              <p className="text-muted mb-0 small">
                  {language === 'sq' ? "Agregoni të dhënat nga të gjitha burimet për mbylljen vjetore." : "Aggregate data from all sources for annual closing."}
              </p>
            </div>
            
            <div className="d-flex gap-2 align-items-center bg-light p-2 rounded shadow-sm border">
               <Building2 size={18} className="text-muted ms-2"/>
               <input type="text" className="form-control form-control-sm border-0 bg-transparent fw-bold" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{width: "140px"}}/>
               <div className="vr text-muted"></div>
               <select className="form-select form-select-sm border-0 bg-transparent fw-bold" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{width: '80px'}}>
                 {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
               </select>
            </div>
          </div>

          {/* MAIN CONTENT */}
          {entries.length === 0 ? (
            <div className="text-center py-5 bg-white border rounded-4 border-dashed mb-4">
              <div className="mb-3 bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block">
                  <UploadCloud size={32} className="text-primary" />
              </div>
              <h4>{language === 'sq' ? 'Filloni duke importuar të dhëna' : 'Start by importing data'}</h4>
              <p className="text-muted mb-4 px-3" style={{maxWidth: '500px', margin: '0 auto'}}>
                  {language === 'sq' ? 'Ngarkoni fajllin Excel nga "Financat Personale".' : 'Upload the Excel file from "Personal Finance".'}
              </p>
              <button className="btn btn-primary px-4 py-2 shadow-sm fw-bold" onClick={() => fileInputRef.current.click()}>
                <FileSpreadsheet className="me-2" size={18}/> {t.importBatch || "Select Excel Files"}
              </button>
            </div>
          ) : (
            <div className="row g-4">
              
              {/* LEFT DASHBOARD */}
              <div className="col-lg-8">
                {/* Waterfall Chart */}
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
                        <h6 className="fw-bold mb-0 text-dark">{language === 'sq' ? 'Analiza e Rrjedhës së Fitimit' : 'Profit Waterfall Analysis'}</h6>
                    </div>
                    <div className="card-body ps-0">
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <BarChart data={waterfallData} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} formatter={(value) => `€${value.toLocaleString()}`}/>
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={25}>
                                        {waterfallData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Tax Cards */}
                <div className="row g-3">
                    <div className="col-md-6">
                        <div className="p-4 bg-white rounded-4 shadow-sm border-start border-warning border-4 h-100 position-relative overflow-hidden">
                            <div className="d-flex justify-content-between align-items-start relative z-10">
                                <div>
                                    <span className="badge bg-warning text-dark mb-2">10% Rate</span>
                                    <h6 className="text-muted text-uppercase small fw-bold mb-1">{t.profitTax || "Profit Tax (CD)"}</h6>
                                    <h3 className="fw-bold text-dark mb-0">€{profitTax.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                                </div>
                                <Landmark className="text-warning opacity-50" size={32} />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="p-4 bg-white rounded-4 shadow-sm border-start border-info border-4 h-100 position-relative overflow-hidden">
                            <div className="d-flex justify-content-between align-items-start relative z-10">
                                <div>
                                    <span className="badge bg-info text-dark mb-2">18% Standard</span>
                                    <h6 className="text-muted text-uppercase small fw-bold mb-1">{t.vatBalance || "Net VAT Liability"}</h6>
                                    <h3 className="fw-bold text-dark mb-0">€{Math.max(0, netVAT).toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                                </div>
                                <Activity className="text-info opacity-50" size={32} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Pay Box */}
                <div className="mt-4 p-4 rounded-4 bg-dark text-white d-flex flex-column flex-md-row justify-content-between align-items-center shadow-lg">
                    <div className="mb-3 mb-md-0">
                        <h5 className="fw-bold mb-1">{language === 'sq' ? 'Totali për Pagesë' : 'Total Payable Amount'}</h5>
                        <p className="text-secondary small mb-0">{language === 'sq' ? 'Shuma totale që duhet transferuar në ATK.' : 'This is the final amount to transfer to the Tax Admin.'}</p>
                    </div>
                    <div className="text-end">
                        <h1 className="fw-bold mb-0 text-success display-5">€{totalTaxLiability.toLocaleString(undefined, {minimumFractionDigits: 2})}</h1>
                    </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR */}
              <div className="col-lg-4">
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                        <h6 className="fw-bold mb-0 small text-uppercase text-muted">{language === 'sq' ? 'Burimet e të Dhënave' : 'Data Sources'}</h6>
                        <button className="btn btn-xs btn-light text-danger" onClick={() => { setEntries([]); setUploadedFiles([]); }}>
                            <Trash2 size={14}/>
                        </button>
                    </div>
                    <div className="list-group list-group-flush">
                        {uploadedFiles.map((file, i) => (
                            <div key={i} className="list-group-item d-flex align-items-center gap-3 py-3 border-0 border-bottom">
                                <div className={`p-2 rounded ${file.type === 'PAYROLL' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-success bg-opacity-10 text-success'}`}>
                                    {file.type === 'PAYROLL' ? <Users size={16}/> : <FileSpreadsheet size={16}/>}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="mb-0 small fw-bold text-dark text-truncate">{file.name}</p>
                                    <span className="badge bg-light text-muted border extra-small">{file.type} • {file.count} items</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 bg-light border-top">
                        <button className="btn btn-outline-primary btn-sm w-100 border-dashed" onClick={() => fileInputRef.current.click()}>
                            <Plus size={14} className="me-1"/> {language === 'sq' ? 'Shto tjetër burim' : 'Add another source'}
                        </button>
                    </div>
                </div>

                <div className="d-grid gap-2">
                    <button className="btn btn-primary py-2 shadow-sm d-flex align-items-center justify-content-center gap-2" onClick={generateDeclarationPDF}>
                        <Download size={18}/> {language === 'sq' ? 'Shkarko Deklaratën PDF' : 'Download PDF Declaration'}
                    </button>
                    <button className="btn btn-white border py-2 shadow-sm d-flex align-items-center justify-content-center gap-2 text-dark" onClick={generateDeclarationExcel}>
                        <FileSpreadsheet size={18} className="text-success"/> {language === 'sq' ? 'Eksporto në Excel' : 'Export to Excel'}
                    </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* MODAL SECTION (Same as before, hidden for brevity but included in rendering) */}
      <AnimatePresence>
        {showInfoModal && (
            <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'}}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-4 shadow-2xl overflow-hidden" style={{ maxWidth: '700px', width: '90%', position: 'relative' }}>
                    <div className="bg-dark text-white p-4">
                        <h4 className="mb-1 fw-bold">{language === 'sq' ? 'Si funksionon Kontabilisti?' : 'How the Tax Accountant Works'}</h4>
                        <button onClick={() => setShowInfoModal(false)} className="position-absolute top-0 end-0 m-4 btn btn-sm text-white" style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
                    </div>
                    <div className="p-4">
                       <p className="text-muted">{language === 'sq' ? 'Ky panel shërben për të bashkuar të gjitha të dhënat financiare (Faturat, Pagat, Bankën) në një raport të vetëm përfundimtar.' : 'This panel aggregates all financial data (Invoices, Payroll, Bank) into a single final report.'}</p>
                    </div>
                    <div className="p-3 bg-light text-end">
                        <button className="btn btn-dark px-4" onClick={() => setShowInfoModal(false)}>{language === 'sq' ? 'Mbyll' : 'Close'}</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaxAccountant;