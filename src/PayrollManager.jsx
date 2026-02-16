import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Plus, Trash2, Download, FileSpreadsheet, 
  Building, Wallet, PieChart, Calculator, Calendar, UserCheck
} from "lucide-react";
import { useTranslations } from "./LanguageContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from 'file-saver'; 

const PayrollManager = () => {
  const { translations: t } = useTranslations();
  
  // 1. FETCH WORKERS FROM DB
  const [dbWorkers, setDbWorkers] = useState([]);
  
  useEffect(() => {
      const saved = localStorage.getItem("rb_workers");
      if (saved) setDbWorkers(JSON.parse(saved));
  }, []);

  const [employees, setEmployees] = useState([]);
  
  // State for the selection form
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [salaryOverride, setSalaryOverride] = useState("");
  const [salaryType, setSalaryType] = useState("net");

  const [period, setPeriod] = useState({
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear()
  });

  // When a worker is selected from dropdown, auto-fill salary
  const handleWorkerSelect = (e) => {
      const id = e.target.value;
      setSelectedWorkerId(id);
      
      const worker = dbWorkers.find(w => w.id.toString() === id);
      if (worker) {
          setSalaryOverride(worker.salary);
          setSalaryType(worker.salaryType || 'net');
      } else {
          setSalaryOverride("");
      }
  };

  // --- KOSOVO PAYROLL LOGIC ---
  const calculateFromGross = (grossVal) => {
    const gross = Number(grossVal);
    const pensionEmployee = gross * 0.05; 
    const pensionEmployer = gross * 0.05; 
    
    const taxableSalary = gross - pensionEmployee;

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

    return { gross, pensionEmployee, pensionEmployer, tax, net, totalCost: gross + pensionEmployer };
  };

  const calculateFromNet = (targetNet) => {
    let low = targetNet;
    let high = targetNet * 2;
    let gross = low;
    
    for (let i = 0; i < 20; i++) {
        gross = (low + high) / 2;
        const res = calculateFromGross(gross);
        if (res.net < targetNet) low = gross;
        else high = gross;
    }
    return calculateFromGross(high); 
  };

  const addEmployeeToPayroll = () => {
    if (!selectedWorkerId) return;

    const workerDef = dbWorkers.find(w => w.id.toString() === selectedWorkerId);
    if (!workerDef) return;

    // Optional: Update the "Master Database" with the new salary if it changed
    if (Number(salaryOverride) !== workerDef.salary) {
        const updatedDb = dbWorkers.map(w => 
            w.id.toString() === selectedWorkerId 
            ? { ...w, salary: Number(salaryOverride), salaryType: salaryType } 
            : w
        );
        setDbWorkers(updatedDb);
        localStorage.setItem("rb_workers", JSON.stringify(updatedDb));
    }

    let calculation;
    if (salaryType === 'gross') {
        calculation = calculateFromGross(salaryOverride);
    } else {
        calculation = calculateFromNet(Number(salaryOverride));
    }

    setEmployees(prev => [...prev, { 
        id: Date.now(), // Unique ID for this payroll run
        workerId: workerDef.id,
        name: workerDef.name, 
        role: workerDef.role,
        inputType: salaryType,
        inputAmount: salaryOverride,
        ...calculation 
    }]);

    // Reset selection
    setSelectedWorkerId("");
    setSalaryOverride("");
  };

  const removeEmployee = (id) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const totals = useMemo(() => {
    return employees.reduce((acc, e) => ({
      cost: acc.cost + e.totalCost,
      net: acc.net + e.net,
      taxes: acc.taxes + e.tax + e.pensionEmployee + e.pensionEmployer,
      taxOnly: acc.taxOnly + e.tax,
      pensionTotal: acc.pensionTotal + e.pensionEmployee + e.pensionEmployer
    }), { cost: 0, net: 0, taxes: 0, taxOnly: 0, pensionTotal: 0 });
  }, [employees]);

  // --- EXCEL EXPORT ---
  const downloadPayrollExcel = async () => {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Payroll");

    sheet.columns = [
      { header: 'Employee Name', key: 'name', width: 25 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Gross Salary', key: 'gross', width: 15 },
      { header: 'Pension Employee (5%)', key: 'trustEmp', width: 20 },
      { header: 'Pension Employer (5%)', key: 'trustComp', width: 20 },
      { header: 'Tax (TAP)', key: 'tax', width: 15 },
      { header: 'Net Salary', key: 'net', width: 15 },
      { header: 'Total Company Cost', key: 'cost', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

    employees.forEach(e => {
        sheet.addRow({
            name: e.name,
            role: e.role,
            gross: e.gross,
            trustEmp: e.pensionEmployee,
            trustComp: e.pensionEmployer,
            tax: e.tax,
            net: e.net,
            cost: e.totalCost
        });
    });

    sheet.addRow([]);
    sheet.addRow(["META", period.month, period.year, "PAYROLL_FILE"]); 

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Payroll_${period.month}_${period.year}.xlsx`);
  };

  // --- PDF EXPORT ---
  const downloadPayrollPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(79, 70, 229); 
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(t.payrollReport || "Payroll Summary", 14, 16);
    
    const tableData = employees.map(e => [
      e.name,
      `€${e.gross.toFixed(2)}`,
      `€${e.pensionEmployee.toFixed(2)}`,
      `€${e.pensionEmployer.toFixed(2)}`,
      `€${e.tax.toFixed(2)}`,
      `€${e.net.toFixed(2)}`,
      `€${e.totalCost.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [[t.employeeName, "Gross", "Trst(5%)", "Comp(5%)", "TAP", "NET", "Total Cost"]],
      body: tableData,
      theme: 'grid',
    });
    doc.save(`Payroll_${period.month}_${period.year}.pdf`);
  };

  return (
    <div className="container mt-4 mb-5">
      
      {/* 1. DASHBOARD SUMMARY CARDS (Same visual as before) */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
            <div className="p-4 bg-white rounded-4 shadow-sm border-start border-primary border-4 h-100">
                <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary"><Building size={20}/></div>
                    <span className="text-muted small fw-bold uppercase">Total Cost</span>
                </div>
                <h2 className="fw-bold text-dark mb-0">€{totals.cost.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
            </div>
        </div>
        <div className="col-md-4">
            <div className="p-4 bg-white rounded-4 shadow-sm border-start border-success border-4 h-100">
                <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success"><Wallet size={20}/></div>
                    <span className="text-muted small fw-bold uppercase">Net Payout</span>
                </div>
                <h2 className="fw-bold text-success mb-0">€{totals.net.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
            </div>
        </div>
        <div className="col-md-4">
            <div className="p-4 bg-white rounded-4 shadow-sm border-start border-warning border-4 h-100">
                <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="bg-warning bg-opacity-10 p-2 rounded-circle text-warning-emphasis"><PieChart size={20}/></div>
                    <span className="text-muted small fw-bold uppercase">State Liabilities</span>
                </div>
                <h2 className="fw-bold text-dark mb-0">€{totals.taxes.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
            </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-4 p-md-5">
          
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
            <div>
              <h4 className="fw-bold text-primary mb-1 d-flex align-items-center gap-2"><Users size={24}/> {t.payrollTitle}</h4>
              <p className="text-muted small mb-0">{t.payrollSubtitle || "Manage employee salaries and tax obligations."}</p>
            </div>
            {/* DATE SELECTOR */}
            <div className="d-flex gap-2">
                <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0"><Calendar size={14}/></span>
                    <select className="form-select border-start-0 fw-bold text-muted" value={period.month} onChange={e => setPeriod({...period, month: e.target.value})}>
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select className="form-select border-start-0 fw-bold text-muted" value={period.year} onChange={e => setPeriod({...period, year: Number(e.target.value)})}>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
            </div>
          </div>

          {/* 2. EMPLOYEE SELECTION FORM */}
          <div className="bg-light p-4 rounded-4 mb-5 border border-dashed">
             <div className="row g-3 align-items-end">
                <div className="col-md-4">
                   <label className="small fw-bold text-muted mb-1">Select Employee</label>
                   <div className="input-group shadow-sm">
                       <span className="input-group-text bg-white border-0"><UserCheck size={16} className="text-primary"/></span>
                       <select className="form-select border-0 py-2 fw-bold" value={selectedWorkerId} onChange={handleWorkerSelect}>
                           <option value="">-- Select Worker --</option>
                           {dbWorkers.map(w => (
                               <option key={w.id} value={w.id}>{w.name}</option>
                           ))}
                       </select>
                   </div>
                </div>
                <div className="col-md-5">
                   <label className="small fw-bold text-muted mb-1">{t.salary || "Salary Amount"}</label>
                   <div className="input-group shadow-sm">
                      <select className="form-select border-0 bg-white text-muted fw-bold" style={{maxWidth: '90px'}}
                        value={salaryType} onChange={e => setSalaryType(e.target.value)}>
                          <option value="gross">Gross</option>
                          <option value="net">Net</option>
                      </select>
                      <input type="number" className="form-control border-0" placeholder="0.00" 
                        value={salaryOverride} onChange={e => setSalaryOverride(e.target.value)} />
                      <span className="input-group-text bg-white border-0 text-muted">€</span>
                   </div>
                </div>
                <div className="col-md-3">
                   <button className="btn btn-primary w-100 fw-bold shadow-sm py-2" onClick={addEmployeeToPayroll} disabled={!selectedWorkerId}>
                     <Plus size={18} className="me-1"/> Add to List
                   </button>
                </div>
             </div>
             {salaryType === 'net' && salaryOverride && (
                 <div className="mt-2 text-end">
                     <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                        <Calculator size={12} className="me-1"/> Auto-Calculating Gross...
                     </span>
                 </div>
             )}
          </div>

          {/* 3. PAYROLL TABLE */}
          <div className="table-responsive rounded-4 border overflow-hidden mb-4">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4 py-3 text-muted small text-uppercase fw-bold">{t.employeeName}</th>
                  <th className="text-end text-muted small text-uppercase fw-bold">Gross</th>
                  <th className="text-end text-muted small text-uppercase fw-bold text-nowrap">{t.trust} (5%)</th>
                  <th className="text-end text-muted small text-uppercase fw-bold">{t.taxTAP}</th>
                  <th className="text-end text-muted small text-uppercase fw-bold text-nowrap">Net Salary</th>
                  <th className="text-end text-primary small text-uppercase fw-bold text-nowrap">Total Cost</th>
                  <th className="text-end pe-4" style={{width: '50px'}}></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {employees.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-5 text-muted fst-italic bg-white">Select a worker above to begin payroll.</td></tr>
                  ) : (
                    employees.map(e => (
                      <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout className="bg-white">
                        <td className="ps-4">
                            <div className="fw-bold text-dark">{e.name}</div>
                            <small className="text-muted">{e.role}</small>
                        </td>
                        <td className="text-end fw-bold text-dark">€{e.gross.toFixed(2)}</td>
                        <td className="text-end text-muted small">
                            <div className="d-flex flex-column align-items-end">
                                <span>-€{e.pensionEmployee.toFixed(2)}</span>
                                <span className="extra-small text-muted opacity-50">Emp: €{e.pensionEmployer.toFixed(2)}</span>
                            </div>
                        </td>
                        <td className="text-end text-danger fw-bold small">-€{e.tax.toFixed(2)}</td>
                        <td className="text-end">
                            <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-2" style={{fontSize: '0.9rem'}}>
                                €{e.net.toFixed(2)}
                            </span>
                        </td>
                        <td className="text-end fw-bold text-primary">€{e.totalCost.toFixed(2)}</td>
                        <td className="text-end pe-3">
                          <button className="btn btn-sm btn-white border shadow-sm text-danger" onClick={() => removeEmployee(e.id)}><Trash2 size={16}/></button>
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
             <div className="d-flex flex-column flex-md-row justify-content-end gap-3 mt-4 pt-3 border-top">
                <button className="btn btn-light border fw-bold d-flex align-items-center justify-content-center gap-2" onClick={downloadPayrollExcel}>
                   <FileSpreadsheet size={18} className="text-success"/> Export for Tax Accountant
                </button>
                <button className="btn btn-primary fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 px-4" onClick={downloadPayrollPDF}>
                   <Download size={18}/> Download Payslips (PDF)
                </button>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PayrollManager;