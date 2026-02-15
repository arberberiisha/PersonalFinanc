import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserPlus, MoreVertical, Mail, Phone, 
  Trash2, Shield, CheckCircle, XCircle, Copy
} from "lucide-react";
import Swal from "sweetalert2";

const WorkerManagement = () => {
  
  // DUMMY DATA: Your "Database" of workers
  const [workers, setWorkers] = useState([
    { id: 1, name: "Hekuran Worker", email: "Hekuran@rbtech.com", role: "Sales", status: "active", sales: 12450 },
    { id: 2, name: "Arber Worker", email: "arber@rbtech.com", role: "Logistics", status: "active", sales: 8200 },
    { id: 3, name: "Sarah Intern", email: "sarah@rbtech.com", role: "Intern", status: "inactive", sales: 0 },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: "", email: "", role: "Sales" });

  const handleAddWorker = (e) => {
    e.preventDefault();
    if (!newWorker.name || !newWorker.email) return;

    const worker = {
        id: Date.now(),
        ...newWorker,
        status: "active",
        sales: 0
    };

    setWorkers([...workers, worker]);
    setIsAdding(false);
    setNewWorker({ name: "", email: "", role: "Sales" });

    // Simulate "Credentials Generated"
    Swal.fire({
        title: 'Worker Created!',
        html: `
            <div class="text-start bg-light p-3 rounded">
                <small class="text-muted">Share these credentials:</small><br/>
                <b>Username:</b> ${worker.email}<br/>
                <b>Password:</b> 1234 (Default)
            </div>
        `,
        icon: 'success',
        confirmButtonText: 'Done'
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
        title: 'Remove Worker?',
        text: "They will lose access immediately.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, remove'
    }).then((result) => {
        if (result.isConfirmed) {
            setWorkers(workers.filter(w => w.id !== id));
            Swal.fire('Removed!', '', 'success');
        }
    });
  };

  return (
    <div className="container mt-2">
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h3 className="fw-bold text-dark mb-1">Team Management</h3>
            <p className="text-muted small mb-0">Manage access and track performance of your staff.</p>
        </div>
        <button className="btn btn-primary shadow-sm d-flex align-items-center gap-2" onClick={() => setIsAdding(!isAdding)}>
            <UserPlus size={18}/> {isAdding ? "Cancel" : "Add Worker"}
        </button>
      </div>

      {/* ADD WORKER FORM (Collapsible) */}
      <AnimatePresence>
        {isAdding && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
            >
                <form onSubmit={handleAddWorker} className="bg-white p-4 rounded-4 shadow-sm border border-primary border-opacity-25">
                    <h6 className="fw-bold text-primary mb-3">New Employee Details</h6>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <input type="text" className="form-control" placeholder="Full Name" 
                                value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})} required />
                        </div>
                        <div className="col-md-4">
                            <input type="text" className="form-control" placeholder="Username / Email" 
                                value={newWorker.email} onChange={e => setNewWorker({...newWorker, email: e.target.value})} required />
                        </div>
                        <div className="col-md-3">
                            <select className="form-select" value={newWorker.role} onChange={e => setNewWorker({...newWorker, role: e.target.value})}>
                                <option value="Sales">Sales Agent</option>
                                <option value="Logistics">Logistics</option>
                                <option value="Accountant">Accountant</option>
                            </select>
                        </div>
                        <div className="col-md-1">
                            <button type="submit" className="btn btn-success w-100"><CheckCircle size={18}/></button>
                        </div>
                    </div>
                </form>
            </motion.div>
        )}
      </AnimatePresence>

      {/* WORKERS LIST */}
      <div className="row g-3">
        {workers.map((worker) => (
            <div key={worker.id} className="col-md-6 col-xl-4">
                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card border-0 shadow-sm rounded-4 h-100 hover-shadow transition-all">
                    <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className={`rounded-circle p-3 ${worker.status === 'active' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
                                    <Users size={24}/>
                                </div>
                                <div>
                                    <h6 className="fw-bold text-dark mb-0">{worker.name}</h6>
                                    <span className="badge bg-light text-muted border mt-1">{worker.role}</span>
                                </div>
                            </div>
                            <div className="dropdown">
                                <button className="btn btn-sm btn-white text-muted" type="button" data-bs-toggle="dropdown">
                                    <MoreVertical size={18}/>
                                </button>
                                <ul className="dropdown-menu shadow-sm border-0">
                                    <li><button className="dropdown-item text-danger small" onClick={() => handleDelete(worker.id)}><Trash2 size={14} className="me-2"/> Remove</button></li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="d-flex flex-column gap-2 mb-4">
                            <div className="d-flex align-items-center gap-2 text-muted small">
                                <Mail size={14}/> {worker.email}
                            </div>
                            <div className="d-flex align-items-center gap-2 text-muted small">
                                <Shield size={14}/> Permissions: Limited
                            </div>
                        </div>

                        <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                            <div>
                                <span className="d-block extra-small text-muted text-uppercase fw-bold">Total Sales</span>
                                <span className="fw-bold text-dark">€{worker.sales.toLocaleString()}</span>
                            </div>
                            <span className={`badge rounded-pill px-3 py-2 ${worker.status === 'active' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                {worker.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        ))}

        {/* Add Button Placeholder Card */}
        <div className="col-md-6 col-xl-4">
            <div 
                className="card border-2 border-dashed border-light h-100 rounded-4 d-flex align-items-center justify-content-center text-center p-5 cursor-pointer hover-bg-light transition-all"
                onClick={() => setIsAdding(true)}
                style={{minHeight: '200px'}}
            >
                <div className="text-muted opacity-50">
                    <UserPlus size={48} className="mb-2"/>
                    <h6 className="fw-bold">Add New Worker</h6>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default WorkerManagement;