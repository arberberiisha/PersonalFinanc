import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { useTranslations } from "./LanguageContext"; 
import { 
  UploadCloud, FileSpreadsheet, Download, 
  TrendingUp, TrendingDown, Building2, AlertCircle,
  FileCheck, Trash2, CalendarCheck, Activity, Users
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from 'file-saver'; 

const TaxAccountant = () => {
  const { translations: t, language } = useTranslations();
  
  const [year, setYear] = useState(new Date().getFullYear());
  const [businessType, setBusinessType] = useState("LLC"); 
  const [companyName, setCompanyName] = useState("RB Tech");
  const [entries, setEntries] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  const TAX_RATES = {
    PROFIT_TAX: 0.10,
    VAT: 0.18,
    PENSION: 0.05
  };

  const fileInputRef = useRef();

  // --- BATCH IMPORT LOGIC (UPDATED FOR PAYROLL INTEGRATION) ---
  const handleBatchImport = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const ExcelJS = await import("exceljs");
    let aggregatedEntries = [];
    let fileMetadata = [];

    Swal.fire({ title: t.importDesc || 'Analyzing...', didOpen: () => Swal.showLoading() });

    for (const file of files) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.getWorksheet(1);
      
      // Determine file type
      const headerRow = worksheet.getRow(1).values;
      const isPayrollFile = headerRow.includes('Employee Name') && headerRow.includes('Total Company Cost');

      fileMetadata.push({ 
          name: file.name, 
          size: (file.size / 1024).toFixed(1) + " KB",
          type: isPayrollFile ? 'PAYROLL' : 'STANDARD'
      });

      if (isPayrollFile) {
          // --- PAYROLL FILE LOGIC ---
          // In the PayrollManager export, we store total sum in the row after data
          // But safer to just iterate and sum up the 'Total Company Cost' column (index 7 based on export)
          let totalPayrollCost = 0;
          let monthStr = "General";

          worksheet.eachRow((row, rowNumber) => {
             if (rowNumber > 1) {
                 const vals = row.values;
                 // Check if it's a data row (has name and cost)
                 if (vals[1] && vals[7] && vals[1] !== "TOTALS" && vals[1] !== "META") {
                     totalPayrollCost += Number(vals[7]);
                 }
                 // Check if it is the META row we added in PayrollManager
                 if (vals[1] === "META") {
                     monthStr = vals[2]; // Month from meta
                 }
             }
          });

          if (totalPayrollCost > 0) {
              aggregatedEntries.push({
                  type: "Expense",
                  category: "Pagat & Kontributet", // Official Category Name
                  amount: totalPayrollCost,
                  month: monthStr,
                  source: "Payroll"
              });
          }

      } else {
          // --- STANDARD LOGIC (Old Logic) ---
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 2) {
                const rowVal = row.values;
                if(rowVal[3] && rowVal[6]) {
                    aggregatedEntries.push({
                        type: rowVal[3], 
                        category: rowVal[4],
                        amount: Number(rowVal[6]),
                        month: rowVal[1],
                        source: "Bank/Manual"
                    });
                }
            }
          });
      }
    }

    setUploadedFiles(prev => [...prev, ...fileMetadata]);
    setEntries(prev => [...prev, ...aggregatedEntries]);
    Swal.close();
    Swal.fire("Success", `Imported successfully.`, "success");
    e.target.value = null;
  };

  // --- CALCULATIONS ---
  const totalIncome = entries.filter(e => ["Income", "Të ardhura"].includes(e.type)).reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = entries.filter(e => ["Expense", "Shpenzime"].includes(e.type)).reduce((sum, e) => sum + e.amount, 0);
  
  const grossProfit = totalIncome - totalExpense;
  const taxableProfit = grossProfit > 0 ? grossProfit : 0;
  
  const estimatedVAT_Owe = totalIncome * TAX_RATES.VAT;
  // Note: Payroll expenses (Salaries) do NOT have deductible VAT. 
  // We filter out Payroll from VAT Claim.
  const expensesWithVAT = entries.filter(e => 
      ["Expense", "Shpenzime"].includes(e.type) && e.category !== "Pagat & Kontributet"
  ).reduce((sum, e) => sum + e.amount, 0);

  const estimatedVAT_Claim = expensesWithVAT * TAX_RATES.VAT;
  const netVAT = estimatedVAT_Owe - estimatedVAT_Claim;

  const pensionContribution = (grossProfit * TAX_RATES.PENSION);
  const profitTax = taxableProfit * TAX_RATES.PROFIT_TAX;
  
  const totalTaxLiability = (netVAT > 0 ? netVAT : 0) + profitTax + (pensionContribution > 0 ? pensionContribution : 0);

  // --- EXCEL EXPORT ---
  const generateDeclarationExcel = async () => {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Tax Declaration");

    sheet.columns = [
      { header: t.description, key: 'desc', width: 35 },
      { header: 'Base', key: 'base', width: 20 },
      { header: 'Rate', key: 'rate', width: 15 },
      { header: t.totalPayable, key: 'total', width: 20 },
    ];

    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = `${companyName.toUpperCase()} - ${t.annualDeclaration.toUpperCase()}`;
    sheet.getCell('A1').font = { size: 16, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.addRow([`${t.fiscalYear}: ${year}`, "", "", `Generated: ${new Date().toLocaleDateString()}`]);
    sheet.addRow([`${t.entityType}: ${businessType}`, "", "", ""]);
    sheet.addRow([]); 

    const rows = [
      [t.totalRevenue, totalIncome, "-", "-"],
      [t.totalDeductions, totalExpense, "-", "-"],
      [t.netProfit, grossProfit, "-", "-"],
      ["", "", "", ""],
      [t.profitTax, taxableProfit, "10%", profitTax],
      [t.pension, grossProfit, "5%", pensionContribution],
      [t.vatBalance, netVAT > 0 ? netVAT : 0, "18%", netVAT > 0 ? netVAT : 0]
    ];

    rows.forEach(r => sheet.addRow(r));
    sheet.addRow([]);
    const totalRow = sheet.addRow(["TOTAL PAYABLE", "", "", totalTaxLiability]);
    totalRow.font = { bold: true };
    totalRow.getCell(4).numFmt = '€#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${companyName}_Tax_Declaration_${year}.xlsx`);
  };

  // --- PDF GENERATION ---
  const generateDeclarationPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const primaryColor = [79, 70, 229]; 

    doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor);
    doc.text(companyName.toUpperCase(), 15, 20); 
    
    doc.setFontSize(12); doc.setTextColor(100);
    doc.text(t.annualDeclaration, 15, 28);

    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`${t.fiscalYear}: ${year}`, 15, 35);
    doc.text(`${t.entityType}: ${businessType}`, 15, 40);
    
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 195, 20, { align: "right" });

    doc.setDrawColor(...primaryColor); doc.setLineWidth(1);
    doc.line(15, 45, 195, 45);

    autoTable(doc, {
      startY: 55,
      head: [[t.description.toUpperCase(), "BASE", "RATE", t.totalPayable.toUpperCase()]], 
      body: [
        [t.totalRevenue, `€ ${totalIncome.toFixed(2)}`, "-", "-"],
        [t.totalDeductions, `(€ ${totalExpense.toFixed(2)})`, "-", "-"],
        [t.netProfit, `€ ${grossProfit.toFixed(2)}`, "-", "-"],
        ["", "", "", ""], 
        [t.profitTax, `€ ${taxableProfit.toFixed(2)}`, "10%", `€ ${profitTax.toFixed(2)}`],
        [t.pension, `€ ${grossProfit.toFixed(2)}`, "5%", `€ ${pensionContribution.toFixed(2)}`],
        [t.vatBalance, `€ ${Math.max(0, netVAT).toFixed(2)}`, "18%", `€ ${Math.max(0, netVAT).toFixed(2)}`],
      ],
      theme: "grid",
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: "right" },
        2: { halign: "center" },
        3: { halign: "right", fontStyle: "bold" }
      },
      didParseCell: (data) => {
        if (data.row.index === 2) data.cell.styles.fontStyle = "bold"; 
      }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    
    doc.setFillColor(245, 245, 245);
    doc.rect(100, finalY - 8, 95, 18, "F"); 
    
    doc.setFontSize(12); doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text(t.totalPayable, 105, finalY + 4); 
    doc.text(`€ ${totalTaxLiability.toFixed(2)}`, 190, finalY + 4, { align: "right" });

    doc.save(`${companyName}_Tax_Declaration_${year}.pdf`);
  };

  return (
    <div className="container mt-4 mb-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card shadow-sm border-0">
        <div className="card-body p-4 p-md-5">
          
          {/* Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 border-bottom pb-4 gap-3">
            <div>
              <h2 className="fw-bold text-primary mb-1"><Building2 className="me-2"/> {t.taxAccountant}</h2>
              <div className="d-flex align-items-center gap-2">
                 <input 
                   type="text" 
                   className="form-control form-control-sm border-0 bg-light fw-bold text-muted" 
                   value={companyName}
                   onChange={(e) => setCompanyName(e.target.value)}
                   style={{width: "200px", fontSize: "14px"}}
                 />
                 <span className="text-muted small">| {t.annualDeclaration}</span>
              </div>
            </div>
            <div className="d-flex gap-3">
               <select className="form-select fw-bold border-primary text-primary" 
                 value={businessType} onChange={(e) => setBusinessType(e.target.value)} style={{width: '150px'}}>
                 <option value="LLC">SH.P.K (LLC)</option>
                 <option value="BI">B.I. (Individual)</option>
               </select>
               <select className="form-select fw-bold" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{width: '100px'}}>
                 {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
               </select>
            </div>
          </div>

          {/* MAIN ANALYSIS AREA */}
          {entries.length === 0 ? (
            <div className="text-center py-5 bg-light rounded-3 border-dashed mb-4">
              <UploadCloud size={48} className="text-muted mb-3" />
              <h4>{t.importBatch}</h4>
              <p className="text-muted mb-4">{t.importDesc}</p>
              <input type="file" ref={fileInputRef} multiple accept=".xlsx" className="d-none" onChange={handleBatchImport} />
              <button className="btn btn-primary px-4 py-2 shadow-sm" onClick={() => fileInputRef.current.click()}>
                <FileSpreadsheet className="me-2" size={18}/> {t.importBatch}
              </button>
            </div>
          ) : (
            <div className="row g-4">
              
              {/* Left Side: Summary & Analysis */}
              <div className="col-lg-8">
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25">
                      <label className="extra-small fw-bold text-success text-uppercase mb-1">{t.totalRevenue}</label>
                      <h3 className="fw-bold mb-0 text-success">€{totalIncome.toLocaleString()}</h3>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25">
                      <label className="extra-small fw-bold text-danger text-uppercase mb-1">{t.totalDeductions}</label>
                      <h3 className="fw-bold mb-0 text-danger">€{totalExpense.toLocaleString()}</h3>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className={`p-3 rounded-3 border border-opacity-25 ${grossProfit >= 0 ? 'bg-primary bg-opacity-10 border-primary' : 'bg-warning bg-opacity-10 border-warning'}`}>
                      <label className={`extra-small fw-bold text-uppercase mb-1 ${grossProfit >= 0 ? 'text-primary' : 'text-warning'}`}>{t.netProfit}</label>
                      <h3 className={`fw-bold mb-0 ${grossProfit >= 0 ? 'text-primary' : 'text-warning'}`}>€{grossProfit.toLocaleString()}</h3>
                    </div>
                  </div>
                </div>

                {/* The "Official Bill" Box */}
                <div className="bg-dark text-white p-4 rounded-3 mb-4 shadow-lg border-start border-primary border-4">
                  <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-4">
                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2"><Activity size={18}/> {t.estimatedLiability}</h5>
                    <span className="badge bg-primary px-3">{year} {businessType}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="d-flex justify-content-between mb-3">
                      <span className="text-secondary">{t.profitTax} (10%)</span>
                      <span className="fw-bold">€{profitTax.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span className="text-secondary">{t.vatBalance} (18%)</span>
                      <span className={netVAT > 0 ? "text-warning fw-bold" : "text-success fw-bold"}>
                        {netVAT > 0 ? `+ €${netVAT.toFixed(2)}` : `- €${Math.abs(netVAT).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span className="text-secondary">{t.pension} (5%)</span>
                      <span className="fw-bold">€{Math.max(0, pensionContribution).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-top border-secondary d-flex justify-content-between align-items-end">
                    <div className="text-secondary small fst-italic">Official Tax Base: €{taxableProfit.toLocaleString()}</div>
                    <div className="text-end">
                      <label className="text-primary small fw-bold d-block text-uppercase mb-1">{t.totalPayable}</label>
                      <h2 className="fw-bold mb-0 text-white display-6">€{totalTaxLiability.toFixed(2)}</h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Source Verification Sidebar */}
              <div className="col-lg-4">
                <div className="card border h-100 bg-light bg-opacity-50 shadow-none">
                  <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                      <FileCheck size={18} className="text-primary"/> {language === 'sq' ? 'Skedarët e Ngarkuar' : 'Verified Sources'}
                    </h6>
                    <button className="btn btn-sm btn-outline-danger border-0" onClick={() => { setEntries([]); setUploadedFiles([]); }}>
                      <Trash2 size={16}/>
                    </button>
                  </div>
                  <div className="card-body p-0 overflow-auto" style={{maxHeight: "400px"}}>
                    <ul className="list-group list-group-flush">
                      {uploadedFiles.map((file, idx) => (
                        <li key={idx} className="list-group-item d-flex align-items-center gap-3 py-3">
                          <div className={`p-2 bg-white rounded border ${file.type === 'PAYROLL' ? 'border-primary' : ''}`}>
                            {file.type === 'PAYROLL' ? <Users size={20} className="text-primary"/> : <FileSpreadsheet size={20} className="text-success" />}
                          </div>
                          <div className="overflow-hidden">
                            <p className="mb-0 small fw-bold text-truncate">{file.name}</p>
                            <p className="mb-0 extra-small text-muted">{file.type} • {file.size}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Period Coverage Visualizer */}
                    <div className="p-3 border-top bg-white">
                      <h6 className="extra-small fw-bold text-uppercase text-muted mb-3 d-flex align-items-center gap-2">
                        <CalendarCheck size={14}/> Period Coverage
                      </h6>
                      <div className="d-flex flex-wrap gap-1">
                        {t.months.map(m => {
                          const isImported = entries.some(e => e.month === m);
                          return (
                            <span key={m} className={`badge ${isImported ? 'bg-success' : 'bg-secondary opacity-25'} extra-small`} style={{fontSize: '9px'}}>
                              {m.substring(0,3).toUpperCase()}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="card-footer bg-white p-3 border-top">
                    <button className="btn btn-primary w-100 mb-2 shadow-sm d-flex align-items-center justify-content-center gap-2" onClick={generateDeclarationPDF}>
                      <Download size={16}/> PDF Declaration
                    </button>
                    <button className="btn btn-outline-success w-100 d-flex align-items-center justify-content-center gap-2" onClick={generateDeclarationExcel}>
                      <FileSpreadsheet size={16}/> Excel Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TaxAccountant;