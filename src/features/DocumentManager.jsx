import React, { useState } from "react";
import { useTranslations } from "../LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2"; 
import { 
  FileText, FileSpreadsheet, Image as ImageIcon, 
  Download, Trash2, Search, Filter, FolderOpen,
  Eye
} from "lucide-react";

const DocumentManager = () => {
  const { language } = useTranslations(); // <--- Get Language State
  const isSq = language === 'sq';

  // DUMMY DATA: Simulating files stored in the cloud
  const [documents, setDocuments] = useState([
    { id: 1, name: "Invoice #INV-001 - RBTech", type: "invoice", format: "pdf", date: "2024-02-14", size: "1.2 MB" },
    { id: 2, name: "Tax Declaration Q1 2024", type: "tax", format: "excel", date: "2024-03-30", size: "450 KB" },
    { id: 3, name: "Expense Receipt - Petrol", type: "receipt", format: "image", date: "2024-02-10", size: "2.4 MB" },
    { id: 4, name: "Payroll Summary - Jan", type: "payroll", format: "pdf", date: "2024-01-31", size: "800 KB" },
    { id: 5, name: "Client Contract - Gjirafa", type: "other", format: "pdf", date: "2023-12-15", size: "3.5 MB" },
  ]);

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // FILTER LOGIC
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filter === "all" ? true : doc.type === filter;
    return matchesSearch && matchesType;
  });

  // HELPER: Get Icon based on file format
  const getFileIcon = (format) => {
    switch(format) {
      case 'pdf': return <FileText className="text-danger" size={24} />;
      case 'excel': return <FileSpreadsheet className="text-success" size={24} />;
      case 'image': return <ImageIcon className="text-primary" size={24} />;
      default: return <FolderOpen className="text-muted" size={24} />;
    }
  };

  // HELPER: Get Badge Color based on type
  const getTypeBadge = (type) => {
    switch(type) {
        case 'invoice': return 'bg-primary bg-opacity-10 text-primary';
        case 'tax': return 'bg-warning bg-opacity-10 text-warning-emphasis';
        case 'receipt': return 'bg-info bg-opacity-10 text-info';
        case 'payroll': return 'bg-success bg-opacity-10 text-success';
        default: return 'bg-secondary bg-opacity-10 text-secondary';
    }
  };

  // HELPER: Translate Filter Labels
  const getFilterLabel = (f) => {
    const labels = {
        all: isSq ? "Të gjitha" : "All",
        invoice: isSq ? "Fatura" : "Invoices",
        tax: isSq ? "Tatim" : "Tax",
        payroll: isSq ? "Paga" : "Payroll",
        receipt: isSq ? "Dëshmi" : "Receipts"
    };
    return labels[f] || f;
  };

  // --- ACTIONS (Translated Alerts) ---
  const handlePreview = (doc) => {
    Swal.fire({
        title: `<span class="fs-5">${doc.name}</span>`,
        html: `
            <div class="text-start bg-light p-3 rounded small">
                <strong>${isSq ? "Formati" : "Format"}:</strong> ${doc.format.toUpperCase()}<br/>
                <strong>${isSq ? "Madhësia" : "Size"}:</strong> ${doc.size}<br/>
                <strong>${isSq ? "Data" : "Date"}:</strong> ${doc.date}<br/>
                <hr/>
                <i class="text-muted">${isSq ? "Parapamja u ngarkua nga cloud i sigurt..." : "Preview loaded from secure cloud storage..."}</i>
            </div>
        `,
        icon: 'info',
        confirmButtonText: isSq ? 'Mbyll' : 'Close Preview',
        confirmButtonColor: '#4f46e5' 
    });
  };

  const handleDownload = (doc) => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
    
    Toast.fire({
        icon: 'success',
        title: isSq ? 'Shkarkimi Filloi' : 'Download Started',
        text: isSq ? `${doc.name} po shkarkohet...` : `${doc.name} is downloading...`
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
        title: isSq ? 'A jeni i sigurt?' : 'Are you sure?',
        text: isSq ? "Nuk do të mund ta ktheni këtë!" : "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: isSq ? 'Po, fshije!' : 'Yes, delete it!',
        cancelButtonText: isSq ? 'Anulo' : 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            setDocuments(documents.filter(d => d.id !== id));
            Swal.fire(
                isSq ? 'U Fshi!' : 'Deleted!', 
                isSq ? 'Dokumenti u fshi me sukses.' : 'Your file has been deleted.', 
                'success'
            );
        }
    });
  };

  return (
    <div className="dashboard-card p-4 p-md-5 bg-white rounded-4 shadow-sm">
      
      {/* HEADER & ACTIONS */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 gap-3">
        <div>
            <h3 className="fw-bold text-dark mb-1">{isSq ? "Arkiva e Dokumenteve" : "Documents Vault"}</h3>
            <p className="text-muted small mb-0">
                {isSq ? "Menaxhoni faturat, raportet dhe dëshmitë e ngarkuara." : "Manage your generated invoices, reports, and uploaded receipts."}
            </p>
        </div>
        <div className="d-flex gap-2 w-100 w-md-auto">
            <div className="input-group shadow-sm">
                <span className="input-group-text bg-white border-end-0"><Search size={18} className="text-muted"/></span>
                <input 
                    type="text" 
                    className="form-control border-start-0 ps-0" 
                    placeholder={isSq ? "Kërko dokumente..." : "Search files..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="d-flex gap-2 mb-4 overflow-auto pb-2 no-scrollbar">
        {['all', 'invoice', 'tax', 'payroll', 'receipt'].map((f) => (
            <button 
                key={f}
                className={`btn btn-sm rounded-pill px-3 fw-bold text-capitalize ${filter === f ? 'btn-dark' : 'btn-light text-muted'}`}
                onClick={() => setFilter(f)}
            >
                {getFilterLabel(f)}
            </button>
        ))}
      </div>

      {/* FILE LIST */}
      <div className="border rounded-4 overflow-hidden">
        {/* DESKTOP TABLE HEADERS */}
        <div className="d-none d-md-flex bg-light p-3 border-bottom text-muted small fw-bold text-uppercase">
            <div className="col-5">{isSq ? "Emri i Dosjes" : "File Name"}</div>
            <div className="col-2">{isSq ? "Kategoria" : "Category"}</div>
            <div className="col-2">{isSq ? "Data e Krijimit" : "Date Created"}</div>
            <div className="col-2">{isSq ? "Madhësia" : "Size"}</div>
            <div className="col-1 text-end">{isSq ? "Veprime" : "Actions"}</div>
        </div>

        <div className="bg-white">
            <AnimatePresence mode="popLayout">
                {filteredDocs.length > 0 ? (
                    filteredDocs.map((doc) => (
                        <motion.div 
                            key={doc.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-3 border-bottom d-flex flex-column flex-md-row align-items-md-center gap-3 gap-md-0 hover-bg-light transition-all"
                        >
                            {/* FILE INFO */}
                            <div className="col-12 col-md-5 d-flex align-items-center gap-3" style={{cursor: 'pointer'}} onClick={() => handlePreview(doc)}>
                                <div className="p-2 rounded-3 bg-light border">
                                    {getFileIcon(doc.format)}
                                </div>
                                <div>
                                    <h6 className="fw-bold text-dark mb-0">{doc.name}</h6>
                                    <span className="text-muted extra-small d-md-none">{doc.date} • {doc.size}</span>
                                </div>
                            </div>

                            {/* BADGE (Desktop & Mobile) */}
                            <div className="col-12 col-md-2">
                                <span className={`badge rounded-pill fw-normal px-2 py-1 ${getTypeBadge(doc.type)}`}>
                                    {doc.type.toUpperCase()}
                                </span>
                            </div>

                            {/* META DATA (Desktop Only) */}
                            <div className="col-md-2 d-none d-md-block text-muted small">{doc.date}</div>
                            <div className="col-md-2 d-none d-md-block text-muted small">{doc.size}</div>

                            {/* ACTIONS */}
                            <div className="col-12 col-md-1 d-flex justify-content-end gap-2">
                                <button className="btn btn-sm btn-white border shadow-sm text-primary" onClick={() => handlePreview(doc)} title={isSq ? "Shiko" : "Preview"}><Eye size={16}/></button>
                                <button className="btn btn-sm btn-white border shadow-sm text-dark" onClick={() => handleDownload(doc)} title={isSq ? "Shkarko" : "Download"}><Download size={16}/></button>
                                <button className="btn btn-sm btn-white border shadow-sm text-danger" onClick={() => handleDelete(doc.id)} title={isSq ? "Fshi" : "Delete"}><Trash2 size={16}/></button>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-5">
                        <FolderOpen size={48} className="text-muted opacity-25 mb-3"/>
                        <h6 className="text-muted">{isSq ? "Nuk u gjet asnjë dokument." : "No documents found."}</h6>
                    </div>
                )}
            </AnimatePresence>
        </div>
      </div>

    </div>
  );
};

export default DocumentManager;