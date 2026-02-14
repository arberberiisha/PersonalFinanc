import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Plus, Trash2, Download, FileSpreadsheet, 
  Wallet, Building, PieChart 
} from "lucide-react";
import { useTranslations } from "./LanguageContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from 'file-saver'; 

const PayrollManager = () => {
  const { translations: t } = useTranslations();
  
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: "", gross: "" });

  // --- KOSOVO PAYROLL LOGIC (Standard 2025 Rules) ---
  const calculateSalary = (gross) => {
    const grossVal = Number(gross);
    
    // 1. Pension (Trusti) - 5% Employee, 5% Employer
    const pensionEmployee = grossVal * 0.05; 
    const pensionEmployer = grossVal * 0.05; 
    
    // 2. Taxable Salary (Gross - Pension Employee)
    const taxableSalary = grossVal - pensionEmployee;

    // 3. TAP (Personal Income Tax) Progressive Rates
    let tax = 0;
    if (taxableSalary > 450) {
      tax += (taxableSalary - 450) * 0.10; 
      tax += (450 - 250) * 0.08;           
      tax += (250 - 80) * 0.04;            
    } else if (taxableSalary > 250) {
      tax += (taxableSalary - 250) * 0.08;
      tax += (250 - 80) * 0.04;
    } else if (taxableSalary > 80) {
      tax += (taxableSalary - 80) * 0.04;
    }

    const net = taxableSalary - tax;

    return {
      gross: grossVal,
      pensionEmployee,
      pensionEmployer,
      tax,
      net,
      totalCost: grossVal + pensionEmployer // Company pays Gross + 5% Pension Employer
    };
  };

  const addEmployee = () => {
    if (newEmployee.name.trim() && Number(newEmployee.gross) > 0) {
      const calc = calculateSalary(newEmployee.gross);
      setEmployees(prev => [...prev, { ...newEmployee, ...calc, id: Date.now() }]);
      setNewEmployee({ name: "", gross: "" });
    }
  };

  const removeEmployee = (id) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  // --- AGGREGATE TOTALS FOR DASHBOARD ---
  const totals = useMemo(() => {
    return employees.reduce((acc, e) => ({
      cost: acc.cost + e.totalCost,
      net: acc.net + e.net,
      taxes: acc.taxes + e.tax + e.pensionEmployee + e.pensionEmployer
    }), { cost: 0, net: 0, taxes: 0 });
  }, [employees]);

  // --- EXCEL EXPORT ---
  const downloadPayrollExcel = async () => {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Payroll");

    sheet.columns = [
      { header: t.employeeName, key: 'name', width: 25 },
      { header: 'Gross Salary', key: 'gross', width: 15 },
      { header: 'Pension (5%)', key: 'trust', width: 15 },
      { header: 'Tax (TAP)', key: 'tax', width: 15 },
      { header: 'Net Salary', key: 'net', width: 15 },
      { header: 'Total Cost', key: 'cost', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

    employees.forEach(e => {
        sheet.addRow({
            name: e.name,
            gross: e.gross,
            trust: e.pensionEmployee,
            tax: e.tax,
            net: e.net,
            cost: e.totalCost
        });
    });

    sheet.addRow([]);
    const totalRow = sheet.addRow(["TOTALS", "", "", "", "", totals.cost]);
    totalRow.font = { bold: true };
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Payroll_${new Date().toLocaleDateString()}.xlsx`);
  };

  // --- PDF EXPORT ---
  const downloadPayrollPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(79, 70, 229);
    doc.text(t.payrollReport || "Payroll Summary", 14, 20);
    
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    
    const tableData = employees.map(e => [
      e.name,
      `€${e.gross.toFixed(2)}`,
      `€${e.pensionEmployee.toFixed(2)}`,
      `€${e.tax.toFixed(2)}`,
      `€${e.net.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [[t.employeeName, "Gross", t.trust, t.taxTAP, t.netSalary]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: { 4: { fontStyle: 'bold', textColor: [16, 185, 129] } } // Green Net Salary
    });

    // Summary Box in PDF
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(245, 245, 245);
    doc.rect(14, finalY, 80, 25, 'F');
    doc.setFontSize(10); doc.setTextColor(0);
    doc.text(`Total Company Cost: €${totals.cost.toFixed(2)}`, 18, finalY + 8);
    doc.text(`Total Net Pay: €${totals.net.toFixed(2)}`, 18, finalY + 16);

    doc.save("Payroll_List.pdf");
  };

  return (
    <div className="container mt-4 mb-5">
      {/* 1. DASHBOARD SUMMARY CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
            <div className="p-4 bg-white rounded-3 shadow-sm border-start border-primary border-4 h-100">
                <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary"><Building size={20}/></div>
                    <span className="text-muted small fw-bold uppercase">Total Company Cost</span>
                </div>
                <h2 className="fw-bold text-dark mb-0">€{totals.cost.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
            </div>
        </div>
        <div className="col-md-4">
            <div className="p-4 bg-white rounded-3 shadow-sm border-start border-success border-4 h-100">
                <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success"><Wallet size={20}/></div>
                    <span className="text-muted small fw-bold uppercase">Total Net Payout</span>
                </div>
                <h2 className="fw-bold text-success mb-0">€{totals.net.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
            </div>
        </div>
        <div className="col-md-4">
            <div className="p-4 bg-white rounded-3 shadow-sm border-start border-warning border-4 h-100">
                <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="bg-warning bg-opacity-10 p-2 rounded-circle text-warning-emphasis"><PieChart size={20}/></div>
                    <span className="text-muted small fw-bold uppercase">Total Taxes & Pension</span>
                </div>
                <h2 className="fw-bold text-dark mb-0">€{totals.taxes.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
            </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card shadow-sm border-0">
        <div className="card-body p-4">
          
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold text-primary mb-1"><Users className="me-2"/> {t.payrollTitle}</h4>
              <p className="text-muted small mb-0">{t.payrollSubtitle}</p>
            </div>
          </div>

          {/* 2. EMPLOYEE ENTRY FORM */}
          <div className="bg-light p-4 rounded-3 mb-4 border border-dashed">
             <div className="row g-3 align-items-end">
                <div className="col-md-5">
                   <label className="small fw-bold text-muted mb-1">{t.employeeName}</label>
                   <input type="text" className="form-control border-0 shadow-sm" placeholder="Full Name..." 
                     value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} />
                </div>
                <div className="col-md-4">
                   <label className="small fw-bold text-muted mb-1">{t.grossSalary}</label>
                   <div className="input-group shadow-sm">
                      <span className="input-group-text bg-white border-0 text-muted">€</span>
                      <input type="number" className="form-control border-0" placeholder="0.00" 
                        value={newEmployee.gross} onChange={e => setNewEmployee({...newEmployee, gross: e.target.value})} />
                   </div>
                </div>
                <div className="col-md-3">
                   <button className="btn btn-primary w-100 fw-bold shadow-sm" onClick={addEmployee}>
                     <Plus size={18} className="me-1"/> {t.addEmployee}
                   </button>
                </div>
             </div>
          </div>

          {/* 3. SALARY TABLE */}
          <div className="table-responsive rounded-3 border">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4 py-3 text-muted small text-uppercase fw-bold" style={{width: '30%'}}>{t.employeeName}</th>
                  <th className="text-end text-muted small text-uppercase fw-bold">Gross</th>
                  <th className="text-end text-muted small text-uppercase fw-bold">{t.trust} (5%)</th>
                  <th className="text-end text-muted small text-uppercase fw-bold">{t.taxTAP}</th>
                  <th className="text-end text-primary small text-uppercase fw-bold">{t.netSalary}</th>
                  <th className="text-end pe-4" style={{width: '50px'}}></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {employees.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-5 text-muted fst-italic bg-white">No employees added to this payroll run.</td></tr>
                  ) : (
                    employees.map(e => (
                      <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout className="bg-white">
                        <td className="ps-4 fw-bold text-dark">{e.name}</td>
                        <td className="text-end text-muted">€{e.gross.toFixed(2)}</td>
                        <td className="text-end text-danger small">-€{e.pensionEmployee.toFixed(2)}</td>
                        <td className="text-end text-danger small">-€{e.tax.toFixed(2)}</td>
                        <td className="text-end fw-bold text-success bg-success bg-opacity-10">€{e.net.toFixed(2)}</td>
                        <td className="text-end pe-3">
                          <button className="btn btn-sm btn-light text-danger border-0" onClick={() => removeEmployee(e.id)}><Trash2 size={16}/></button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* 4. EXPORT ACTIONS */}
          {employees.length > 0 && (
             <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                <button className="btn btn-outline-success fw-bold d-flex align-items-center gap-2" onClick={downloadPayrollExcel}>
                   <FileSpreadsheet size={18}/> Export Excel
                </button>
                <button className="btn btn-primary fw-bold shadow-sm d-flex align-items-center gap-2 px-4" onClick={downloadPayrollPDF}>
                   <Download size={18}/> Download Payroll PDF
                </button>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PayrollManager;