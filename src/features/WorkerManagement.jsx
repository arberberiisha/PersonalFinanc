import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserPlus, Mail, Trash2, Edit3, CheckCircle, X, FileSpreadsheet, RefreshCw
} from "lucide-react";
import Swal from "sweetalert2";
import { initialWorkers } from "../data/workersData"; 

// Import ExcelJS dynamically to keep the app fast
// or use file-saver if you have a helper. We will implement a direct export here.
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const WorkerManagement = () => {
  
  // 1. INITIALIZE STATE
  const [workers, setWorkers] = useState(() => {
    const saved = localStorage.getItem("rb_workers");
    // If saved exists, use it. Otherwise use the imported 10 workers.
    return saved ? JSON.parse(saved) : initialWorkers;
  });

  // 2. SYNC WITH LOCAL STORAGE
  useEffect(() => {
    localStorage.setItem("rb_workers", JSON.stringify(workers));
  }, [workers]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [formData, setFormData] = useState({ 
      name: "", email: "", role: "Sales", salary: "", salaryType: "net", status: "active" 
  });

  // --- ACTIONS ---

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    if (editingId) {
        setWorkers(prev => prev.map(w => w.id === editingId ? { ...formData, id: editingId } : w));
        Swal.fire("Updated!", "Worker details have been updated.", "success");
    } else {
        const newWorker = { id: Date.now(), ...formData };
        setWorkers([...workers, newWorker]);
        Swal.fire("Added!", "New worker added to the database.", "success");
    }
    
    resetForm();
  };

  const startEdit = (worker) => {
      setEditingId(worker.id);
      setFormData(worker);
      setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    Swal.fire({
        title: 'Are you sure?',
        text: "This worker will be removed from the database.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, delete'
    }).then((result) => {
        if (result.isConfirmed) {
            setWorkers(prev => prev.filter(w => w.id !== id));
            Swal.fire('Deleted!', '', 'success');
        }
    });
  };

  const resetForm = () => {
      setEditingId(null);
      setFormData({ name: "", email: "", role: "Sales", salary: "", salaryType: "net", status: "active" });
      setIsFormOpen(false);
  };

  // --- NEW: EXPORT WORKER LIST TO EXCEL ---
  const handleExportWorkers = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Workers Database");

    // Define Columns
    worksheet.columns = [
        { header: "ID", key: "id", width: 15 },
        { header: "Full Name", key: "name", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Role", key: "role", width: 15 },
        { header: "Salary Amount", key: "salary", width: 15 },
        { header: "Salary Type", key: "salaryType", width: 12 },
        { header: "Status", key: "status", width: 10 },
    ];

    // Style Header
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "2563EB" } }; // Blue

    // Add Data
    workers.forEach(w => {
        worksheet.addRow(w);
    });

    // Save File
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `RB_Workers_List_${new Date().getFullYear()}.xlsx`);
  };

  // --- NEW: RESET TO DEFAULT DATA ---
  const handleResetData = () => {
      Swal.fire({
          title: 'Reset Database?',
          text: "This will delete current changes and reload the default 10 workers.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, Reset'
      }).then((result) => {
          if (result.isConfirmed) {
              setWorkers(initialWorkers); // Reset state to the file data
              localStorage.setItem("rb_workers", JSON.stringify(initialWorkers)); // Reset storage
              Swal.fire("Reset!", "Database has been restored to default.", "success");
          }
      });
  };

  return (
    <div className="container mt-4">
      
      {/* HEADER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <div>
            <h3 className="fw-bold text-dark mb-1">Team Management</h3>
            <p className="text-muted small mb-0">Manage {workers.length} employees in your database.</p>
        </div>
        
        <div className="d-flex gap-2">
            {/* RESET BUTTON (Fixes the "Only 2 workers" issue) */}
            <button className="btn btn-white border shadow-sm text-danger" onClick={handleResetData} title="Reset to Default Data">
                <RefreshCw size={18}/>
            </button>

            {/* EXCEL EXPORT BUTTON */}
            <button className="btn btn-success shadow-sm d-flex align-items-center gap-2" onClick={handleExportWorkers}>
                <FileSpreadsheet size={18}/> Export Excel
            </button>

            <button className="btn btn-primary shadow-sm d-flex align-items-center gap-2" onClick={() => { resetForm(); setIsFormOpen(true); }}>
                <UserPlus size={18}/> Add Worker
            </button>
        </div>
      </div>

      {/* FORM (ADD / EDIT) */}
      <AnimatePresence>
        {isFormOpen && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
            >
                <form onSubmit={handleSave} className="bg-white p-4 rounded-4 shadow-sm border border-primary border-opacity-25">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold text-primary mb-0">{editingId ? "Edit Worker" : "New Worker Details"}</h6>
                        <button type="button" className="btn btn-sm btn-light rounded-circle" onClick={resetForm}><X size={16}/></button>
                    </div>
                    
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="small fw-bold text-muted">Full Name</label>
                            <input type="text" className="form-control" value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div className="col-md-3">
                            <label className="small fw-bold text-muted">Email</label>
                            <input type="email" className="form-control" value={formData.email} 
                                onChange={e => setFormData({...formData, email: e.target.value})} required />
                        </div>
                        <div className="col-md-2">
                            <label className="small fw-bold text-muted">Role</label>
                            <select className="form-select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                <option value="Sales">Sales</option>
                                <option value="Logistics">Logistics</option>
                                <option value="Manager">Manager</option>
                                <option value="Admin">Admin</option>
                                <option value="Intern">Intern</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="small fw-bold text-muted">Salary</label>
                            <div className="input-group">
                                <input type="number" className="form-control" value={formData.salary} 
                                    onChange={e => setFormData({...formData, salary: Number(e.target.value)})} />
                                <select className="input-group-text bg-light" value={formData.salaryType} 
                                    onChange={e => setFormData({...formData, salaryType: e.target.value})}>
                                    <option value="net">Net</option>
                                    <option value="gross">Gross</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button type="submit" className="btn btn-success w-100 fw-bold">
                                {editingId ? <><CheckCircle size={18} className="me-1"/> Update</> : <><UserPlus size={18} className="me-1"/> Save</>}
                            </button>
                        </div>
                    </div>
                </form>
            </motion.div>
        )}
      </AnimatePresence>

      {/* WORKERS GRID */}
      <div className="row g-3">
        {workers.map((worker) => (
            <div key={worker.id} className="col-md-6 col-xl-4">
                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card border-0 shadow-sm rounded-4 h-100">
                    <div className="card-body p-4 position-relative">
                        {/* Status Dot */}
                        <div className={`position-absolute top-0 end-0 m-3 p-1 rounded-circle ${worker.status === 'active' ? 'bg-success' : 'bg-secondary'}`} 
                             title={worker.status}></div>

                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className={`rounded-circle p-3 d-flex align-items-center justify-content-center text-white fw-bold ${worker.role === 'Manager' ? 'bg-primary' : 'bg-dark'}`} 
                                 style={{width: '50px', height: '50px', fontSize: '1.2rem'}}>
                                {worker.name.charAt(0)}
                            </div>
                            <div>
                                <h6 className="fw-bold text-dark mb-0">{worker.name}</h6>
                                <span className="badge bg-light text-muted border mt-1">{worker.role}</span>
                            </div>
                        </div>
                        
                        <div className="d-flex flex-column gap-2 mb-4">
                            <div className="d-flex align-items-center gap-2 text-muted small">
                                <Mail size={14}/> {worker.email}
                            </div>
                            <div className="d-flex align-items-center gap-2 text-muted small">
                                <span className="fw-bold text-dark">€{worker.salary}</span> 
                                <span className="badge bg-light text-secondary border extra-small">{worker.salaryType.toUpperCase()}</span>
                            </div>
                        </div>

                        <div className="pt-3 border-top d-flex justify-content-between">
                            <button className="btn btn-sm btn-light text-primary fw-bold" onClick={() => startEdit(worker)}>
                                <Edit3 size={14} className="me-1"/> Edit
                            </button>
                            <button className="btn btn-sm btn-light text-danger hover-bg-danger-subtle" onClick={() => handleDelete(worker.id)}>
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        ))}
      </div>

    </div>
  );
};

export default WorkerManagement;