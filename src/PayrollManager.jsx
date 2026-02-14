import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Trash2, Download, FileSpreadsheet } from "lucide-react";
import { useTranslations } from "./LanguageContext"; // Import Translations
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from 'file-saver'; 

const PayrollManager = () => {
  const { translations: t } = useTranslations(); // Hook for language
  
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: "", gross: "" });

  // --- KOSOVO PAYROLL LOGIC (2025 Rules) ---
  const calculateSalary = (gross) => {
    const grossVal = Number(gross);
    
    // 1. Pension (Trusti)
    const pensionEmployee = grossVal * 0.05; 
    const pensionEmployer = grossVal * 0.05; 
    
    // 2. Taxable Salary
    const taxableSalary = grossVal - pensionEmployee;

    // 3. TAP (Personal Income Tax) Brackets
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
      totalCost: grossVal + pensionEmployer 
    };
  };

  const addEmployee = () => {
    if (newEmployee.name && newEmployee.gross) {
      const calc = calculateSalary(newEmployee.gross);
      setEmployees([...employees, { ...newEmployee, ...calc, id: Date.now() }]);
      setNewEmployee({ name: "", gross: "" });
    }
  };

  const removeEmployee = (id) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  // --- EXCEL EXPORT (NEW) ---
  const downloadPayrollExcel = async () => {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Payroll");

    // Columns with Translations
    sheet.columns = [
      { header: t.employeeName, key: 'name', width: 25 },
      { header: 'Gross (€)', key: 'gross', width: 15 },
      { header: t.trust, key: 'trust', width: 15 },
      { header: t.taxTAP, key: 'tax', width: 15 },
      { header: t.netSalary, key: 'net', width: 15 },
      { header: 'Total Cost', key: 'cost', width: 20 },
    ];

    // Header Style
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Indigo

    // Data
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

    // Footer Row (Total Cost)
    sheet.addRow([]);
    const totalRow = sheet.addRow(["TOTAL", "", "", "", "", totalCost]);
    totalRow.font = { bold: true };
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Payroll_${new Date().getFullYear()}.xlsx`);
  };

  // --- PDF EXPORT (UPDATED) ---
  const downloadPayrollPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(t.payrollReport, 14, 20); // Translated Title
    doc.setFontSize(10);
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
      head: [[t.employeeName, "Gross", t.trust, t.taxTAP, t.netSalary]], // Translated Headers
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save("Payroll_List.pdf");
  };

  const totalCost = employees.reduce((sum, e) => sum + e.totalCost, 0);

  return (
    <div className="container mt-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card shadow-sm border-0">
        <div className="card-body p-4">
          
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold text-primary mb-1"><Users className="me-2"/> {t.payrollTitle}</h3>
              <p className="text-muted small">{t.payrollSubtitle}</p>
            </div>
            <div className="text-end bg-light p-2 rounded">
              <span className="text-muted small d-block fw-bold text-uppercase">{t.totalCost}</span>
              <h3 className="fw-bold text-dark mb-0">€{totalCost.toFixed(2)}</h3>
            </div>
          </div>

          {/* Input Area */}
          <div className="row g-3 align-items-end mb-4 bg-light p-3 rounded mx-0">
            <div className="col-md-5">
              <label className="small fw-bold text-muted">{t.employeeName}</label>
              <input type="text" className="form-control border-0 shadow-sm" placeholder="e.g. Drilon Aliu" 
                value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} />
            </div>
            <div className="col-md-4">
              <label className="small fw-bold text-muted">{t.grossSalary}</label>
              <input type="number" className="form-control border-0 shadow-sm" placeholder="0.00" 
                value={newEmployee.gross} onChange={e => setNewEmployee({...newEmployee, gross: e.target.value})} />
            </div>
            <div className="col-md-3">
              <button className="btn btn-primary w-100 shadow-sm" onClick={addEmployee}>
                <Plus size={18} className="me-1"/> {t.addEmployee}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="text-muted small text-uppercase">{t.employeeName}</th>
                  <th className="text-end text-muted small text-uppercase">Gross</th>
                  <th className="text-end text-muted small text-uppercase">{t.trust}</th>
                  <th className="text-end text-muted small text-uppercase">{t.taxTAP}</th>
                  <th className="text-end text-primary small text-uppercase fw-bold">{t.netSalary}</th>
                  <th className="text-end"></th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-5 text-muted fst-italic">{t.noEmployees}</td></tr>
                ) : (
                  employees.map(e => (
                    <tr key={e.id}>
                      <td className="fw-bold">{e.name}</td>
                      <td className="text-end">€{e.gross.toFixed(2)}</td>
                      <td className="text-end text-danger small">-€{e.pensionEmployee.toFixed(2)}</td>
                      <td className="text-end text-danger small">-€{e.tax.toFixed(2)}</td>
                      <td className="text-end fw-bold text-success">€{e.net.toFixed(2)}</td>
                      <td className="text-end">
                        <button className="btn btn-sm text-danger" onClick={() => removeEmployee(e.id)}><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          {employees.length > 0 && (
             <div className="d-flex justify-content-end gap-3 mt-3">
                <button className="btn btn-success text-white shadow-sm" onClick={downloadPayrollExcel}>
                   <FileSpreadsheet size={18} className="me-2"/> Excel
                </button>
                <button className="btn btn-primary shadow-sm" onClick={downloadPayrollPDF}>
                   <Download size={18} className="me-2"/> PDF
                </button>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PayrollManager;