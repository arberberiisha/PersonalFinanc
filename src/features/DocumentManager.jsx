import React, { useState, useMemo } from "react";
import { useTranslations } from "../LanguageContext"; 
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2"; 
import { 
  FileText, FileSpreadsheet, Image as ImageIcon, 
  Download, Trash2, Search, Filter, FolderOpen,
  Eye, UploadCloud, LayoutGrid, List, ArrowUpDown,
  HardDrive, RefreshCw, CheckCircle, ArrowRightCircle
} from "lucide-react";

const DocumentManager = () => {
  const { language } = useTranslations(); 
  const isSq = language === 'sq';

  // STATE
  const [viewMode, setViewMode] = useState("list"); 
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [sortBy, setSortBy] = useState("date"); 

  // Added 'status' to track if it has been sent to Finance/Tax
  const [documents, setDocuments] = useState([
    { id: 1, name: "Invoice #INV-001 - RBTech", type: "invoice", format: "pdf", date: "2024-02-14", size: 1200, status: "synced" }, 
    { id: 2, name: "Tax Declaration Q1 2024", type: "tax", format: "excel", date: "2024-03-30", size: 450, status: "pending" },
    { id: 3, name: "Expense Receipt - Petrol", type: "receipt", format: "image", date: "2024-02-10", size: 2400, status: "pending" },
    { id: 4, name: "Payroll Summary - Jan", type: "payroll", format: "pdf", date: "2024-01-31", size: 800, status: "synced" },
    { id: 5, name: "Client Contract - Gjirafa", type: "other", format: "pdf", date: "2023-12-15", size: 3500, status: "ignored" },
  ]);

  // --- LOGIC ---

  const formatSize = (kb) => {
    return kb >= 1000 ? `${(kb / 1000).toFixed(2)} MB` : `${kb} KB`;
  };

  const storageStats = useMemo(() => {
    const totalSize = documents.reduce((acc, doc) => acc + doc.size, 0);
    const maxStorage = 10000; 
    const usagePercent = Math.min((totalSize / maxStorage) * 100, 100);
    const distribution = documents.reduce((acc, doc) => {
        acc[doc.type] = (acc[doc.type] || 0) + doc.size;
        return acc;
    }, {});
    return { totalSize, maxStorage, usagePercent, distribution };
  }, [documents]);

  const getSegmentColor = (type) => {
      switch(type) {
          case 'invoice': return 'bg-primary';
          case 'tax': return 'bg-warning';
          case 'receipt': return 'bg-info';
          case 'payroll': return 'bg-success';
          default: return 'bg-secondary';
      }
  };

  // --- DRAG & DROP ---
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const newDoc = {
        id: Date.now(),
        name: file.name,
        type: "other",
        format: file.name.split('.').pop().toLowerCase() === 'xlsx' ? 'excel' : 'pdf',
        date: new Date().toISOString().split('T')[0],
        size: Math.round(file.size / 1024),
        status: "pending" // New files are pending by default
      };
      setDocuments([newDoc, ...documents]);
      Swal.fire({ icon: 'success', title: isSq ? 'Ngarkimi u krye' : 'Upload Complete', timer: 1500, showConfirmButton: false });
    }
  };

  // --- SMART PROCESSING LOGIC (THE BRIDGE) ---
  const handleProcess = (doc) => {
    if (doc.status === 'synced') return;

    let destination = "";
    let actionText = "";

    if (doc.type === 'invoice') {
        destination = isSq ? "Financa (Të Hyra)" : "Finance (Revenue)";
        actionText = isSq ? "Duke regjistruar faturën..." : "Registering Invoice...";
    } else if (doc.type === 'receipt') {
        destination = isSq ? "Financa (Shpenzime)" : "Finance (Expense)";
        actionText = isSq ? "Duke regjistruar shpenzimin..." : "Logging Expense...";
    } else if (doc.type === 'tax') {
        destination = isSq ? "Kontabiliteti (ATK)" : "Accountant (Tax Module)";
        actionText = isSq ? "Duke dërguar tek kontabilisti..." : "Sending to Accountant...";
    } else {
        Swal.fire(isSq ? "S'ka veprim" : "No Action", isSq ? "Ky lloj dokumenti vetëm ruhet." : "This document type is storage only.", "info");
        return;
    }

    // Simulate Processing Delay
    let timerInterval;
    Swal.fire({
      title: actionText,
      html: isSq ? `Duke dërguar të dhënat tek <b>${destination}</b>.` : `Parsing data and pushing to <b>${destination}</b>.`,
      timer: 1500,
      timerProgressBar: true,
      didOpen: () => { Swal.showLoading(); },
      willClose: () => { clearInterval(timerInterval); }
    }).then((result) => {
      // Update Status to Synced
      setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'synced' } : d));
      
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
      Toast.fire({ icon: 'success', title: isSq ? 'U Sinkronizua!' : 'Synced Successfully!' });
    });
  };

  // --- FILTER & SORT ---
  const processedDocs = useMemo(() => {
    let docs = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
        const matchesType = filter === "all" ? true : doc.type === filter;
        return matchesSearch && matchesType;
    });

    return docs.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'size') return b.size - a.size;
        return new Date(b.date) - new Date(a.date);
    });
  }, [documents, search, filter, sortBy]);

  // --- HELPERS ---
  const getFileIcon = (format, size = 24) => {
    switch(format) {
      case 'pdf': return <FileText className="text-danger" size={size} />;
      case 'excel': return <FileSpreadsheet className="text-success" size={size} />;
      case 'image': return <ImageIcon className="text-primary" size={size} />;
      default: return <FolderOpen className="text-muted" size={size} />;
    }
  };

  const getStatusBadge = (status) => {
      switch(status) {
          case 'synced': 
            return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 d-flex align-items-center gap-1 w-auto" style={{width: 'fit-content'}}>
                <CheckCircle size={10}/> {isSq ? "Sinkronizuar" : "Synced"}
            </span>;
          case 'pending': 
            return <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25 d-flex align-items-center gap-1 w-auto" style={{width: 'fit-content'}}>
                <RefreshCw size={10}/> {isSq ? "Pritje" : "Pending"}
            </span>;
          default: return null;
      }
  };

  const getFilterLabel = (f) => {
    const labels = {
        all: isSq ? "Të gjitha" : "All",
        invoice: isSq ? "Fatura" : "Invoices",
        tax: isSq ? "Tatim" : "Tax",
        payroll: isSq ? "Paga" : "Payroll",
        receipt: isSq ? "Dëshmi" : "Receipts",
        other: isSq ? "Tjetër" : "Other"
    };
    return labels[f] || f;
  };

  // --- ACTIONS ---
  
  // RESTORED: This function was missing
  const handleDownload = (doc) => {
    const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
    Toast.fire({ 
        icon: 'success', 
        title: isSq ? 'Shkarkimi Filloi' : 'Download Started', 
        text: isSq ? `${doc.name} po shkarkohet...` : `${doc.name} is downloading...` 
    });
  };

  const handlePreview = (doc) => {
    Swal.fire({
        title: `<span class="fs-5">${doc.name}</span>`,
        html: `<div class="text-start bg-light p-3 rounded small">...Preview Content...</div>`,
        icon: 'info',
        confirmButtonText: isSq ? 'Mbyll' : 'Close',
        confirmButtonColor: '#4f46e5' 
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
        title: isSq ? 'A jeni i sigurt?' : 'Are you sure?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: isSq ? 'Fshije' : 'Delete'
    }).then((result) => {
        if (result.isConfirmed) {
            setDocuments(documents.filter(d => d.id !== id));
            Swal.fire('Deleted!', '', 'success');
        }
    });
  };

  return (
    <div className="dashboard-card p-4 p-md-5 bg-white rounded-4 shadow-sm">
      
      {/* 1. HEADER & STORAGE ANALYTICS */}
      <div className="row g-4 mb-5">
        <div className="col-lg-6">
            <div className="d-flex align-items-center gap-3 mb-3">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                    <FolderOpen size={28} />
                </div>
                <div>
                    <h3 className="fw-bold text-dark mb-0">{isSq ? "Arkiva Inteligjente" : "Smart Vault"}</h3>
                    <p className="text-muted small mb-0">
                        {isSq ? "Sinkronizo dokumentet me Financën dhe Kontabilitetin." : "Sync documents directly to Finance & Accounting modules."}
                    </p>
                </div>
            </div>

            {/* Storage Bar */}
            <div className="bg-light p-3 rounded-4 border">
                <div className="d-flex justify-content-between align-items-end mb-2">
                    <span className="extra-small fw-bold text-uppercase text-muted d-flex align-items-center gap-2">
                        <HardDrive size={14}/> {isSq ? "Hapësira" : "Storage"}
                    </span>
                    <span className="small fw-bold text-dark">{formatSize(storageStats.totalSize)} <span className="text-muted fw-normal">/ 10 MB</span></span>
                </div>
                <div className="progress" style={{height: '8px', borderRadius: '10px', overflow: 'hidden'}}>
                    {Object.entries(storageStats.distribution).map(([type, size]) => (
                        <motion.div 
                            key={type} initial={{ width: 0 }} animate={{ width: `${(size / storageStats.maxStorage) * 100}%` }}
                            className={`progress-bar ${getSegmentColor(type)}`}
                        />
                    ))}
                </div>
            </div>
        </div>

        <div className="col-lg-6">
            <div 
                className={`h-100 rounded-4 border-2 border-dashed p-4 d-flex flex-column align-items-center justify-content-center text-center transition-all cursor-pointer ${dragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-light-subtle bg-white hover-bg-light'}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => Swal.fire({icon: 'info', title: 'Upload', text: 'Opens system dialog'})}
            >
                <div className={`p-3 rounded-circle mb-3 ${dragActive ? 'bg-primary text-white' : 'bg-light text-primary shadow-sm'}`}>
                    <UploadCloud size={32}/>
                </div>
                <h6 className="fw-bold text-dark mb-1">
                    {dragActive ? (isSq ? "Lësho tani!" : "Drop files!") : (isSq ? "Kliko ose tërhiq skedarë" : "Click or Drag & Drop to Upload")}
                </h6>
                <p className="small text-muted mb-0">PDF, Excel, JPG • Max 5MB</p>
            </div>
        </div>
      </div>

      {/* 2. CONTROLS */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-4 sticky-top bg-white py-2" style={{zIndex: 10}}>
        <div className="d-flex flex-wrap gap-2 w-100 w-md-auto">
            {['all', 'invoice', 'tax', 'payroll', 'receipt', 'other'].map((f) => (
                <button key={f} className={`btn btn-sm rounded-pill px-3 fw-bold text-capitalize border ${filter === f ? 'btn-dark border-dark' : 'btn-white text-muted hover-bg-light'}`} onClick={() => setFilter(f)}>
                    {getFilterLabel(f)}
                </button>
            ))}
        </div>

        <div className="d-flex gap-2 w-100 w-md-auto">
            <div className="input-group shadow-sm flex-grow-1" style={{maxWidth: '250px'}}>
                <span className="input-group-text bg-white border-end-0"><Search size={16} className="text-muted"/></span>
                <input type="text" className="form-control border-start-0 ps-0" placeholder={isSq ? "Kërko..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="btn-group shadow-sm">
                <button className={`btn btn-sm px-3 ${viewMode === 'list' ? 'btn-dark' : 'btn-white border'}`} onClick={() => setViewMode('list')}><List size={18}/></button>
                <button className={`btn btn-sm px-3 ${viewMode === 'grid' ? 'btn-dark' : 'btn-white border'}`} onClick={() => setViewMode('grid')}><LayoutGrid size={18}/></button>
            </div>
        </div>
      </div>

      {/* 3. CONTENT AREA */}
      <div className={`transition-all ${viewMode === 'list' ? 'border rounded-4 overflow-hidden' : ''}`}>
        
        {viewMode === 'list' && (
            <div className="d-none d-md-flex bg-light p-3 border-bottom text-muted small fw-bold text-uppercase tracking-wider">
                <div className="col-4">{isSq ? "Emri i Dosjes" : "File Name"}</div>
                <div className="col-2 text-center">{isSq ? "Statusi" : "Status"}</div> 
                <div className="col-2">{isSq ? "Data" : "Date"}</div>
                <div className="col-2">{isSq ? "Madhësia" : "Size"}</div>
                <div className="col-2 text-end">{isSq ? "Veprime" : "Actions"}</div>
            </div>
        )}

        <div className={viewMode === 'grid' ? 'row g-3' : 'bg-white'}>
            <AnimatePresence mode="popLayout">
                {processedDocs.length > 0 ? (
                    processedDocs.map((doc) => (
                        viewMode === 'list' ? (
                            // --- LIST VIEW ---
                            <motion.div 
                                key={doc.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="p-3 border-bottom d-flex flex-column flex-md-row align-items-md-center gap-3 gap-md-0 hover-bg-light transition-all"
                            >
                                <div className="col-12 col-md-4 d-flex align-items-center gap-3 cursor-pointer" onClick={() => handlePreview(doc)}>
                                    <div className="p-2 rounded-3 bg-light border">{getFileIcon(doc.format)}</div>
                                    <div>
                                        <h6 className="fw-bold text-dark mb-0 text-truncate" style={{maxWidth: '200px'}}>{doc.name}</h6>
                                        <span className="text-muted extra-small d-md-none">{doc.date}</span>
                                    </div>
                                </div>
                                <div className="col-12 col-md-2 d-flex justify-content-md-center">
                                    {getStatusBadge(doc.status)}
                                </div>
                                <div className="col-md-2 d-none d-md-block text-muted small fw-medium">{doc.date}</div>
                                <div className="col-md-2 d-none d-md-block text-muted small fw-medium">{formatSize(doc.size)}</div>
                                <div className="col-12 col-md-2 d-flex justify-content-end gap-2">
                                    {/* SMART SYNC BUTTON */}
                                    {doc.status !== 'synced' && doc.type !== 'other' && (
                                        <button className="btn btn-sm btn-primary shadow-sm d-flex align-items-center gap-1" onClick={() => handleProcess(doc)} title={isSq ? "Sinkronizo" : "Sync"}>
                                            <ArrowRightCircle size={14}/> <span className="d-none d-lg-inline">{isSq ? "Proceso" : "Process"}</span>
                                        </button>
                                    )}
                                    <button className="btn btn-sm btn-light border text-dark" onClick={() => handleDownload(doc)}><Download size={16}/></button>
                                    <button className="btn btn-sm btn-light border text-danger" onClick={() => handleDelete(doc.id)}><Trash2 size={16}/></button>
                                </div>
                            </motion.div>
                        ) : (
                            // --- GRID VIEW ---
                            <motion.div 
                                key={doc.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="col-12 col-md-4 col-xl-3"
                            >
                                <div className="card h-100 border shadow-sm hover-shadow-lg transition-all" style={{borderRadius: '16px'}}>
                                    <div className="card-body text-center p-4 cursor-pointer" onClick={() => handlePreview(doc)}>
                                        <div className="mb-3 d-inline-flex p-3 rounded-circle bg-light border position-relative">
                                            {getFileIcon(doc.format, 36)}
                                            {doc.status === 'synced' && <span className="position-absolute top-0 start-100 translate-middle p-1 bg-success border border-light rounded-circle" style={{width: '14px', height: '14px'}}></span>}
                                        </div>
                                        <h6 className="fw-bold text-dark mb-1 text-truncate px-2">{doc.name}</h6>
                                        <div className="d-flex justify-content-center mt-2">{getStatusBadge(doc.status)}</div>
                                    </div>
                                    <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center py-3">
                                        <small className="text-muted fw-bold">{formatSize(doc.size)}</small>
                                        <div className="d-flex gap-1">
                                            {doc.status !== 'synced' && doc.type !== 'other' && (
                                                <button className="btn btn-xs btn-primary text-white" onClick={() => handleProcess(doc)} title="Sync"><ArrowRightCircle size={14}/></button>
                                            )}
                                            <button className="btn btn-xs btn-light text-danger" onClick={() => handleDelete(doc.id)}><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    ))
                ) : (
                    <div className="text-center py-5 w-100">
                        <FolderOpen size={48} className="text-muted opacity-25 mb-3"/>
                        <h6 className="text-muted">{isSq ? "Nuk u gjet asnjë dokument." : "No documents found matching criteria."}</h6>
                    </div>
                )}
            </AnimatePresence>
        </div>
      </div>

    </div>
  );
};

export default DocumentManager;