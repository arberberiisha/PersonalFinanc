import React, { useRef, useState, useMemo } from "react";
import { useTranslations } from "./LanguageContext";
import { useProducts } from "./ProductContext"; 
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Download, Image as ImageIcon, Trash2, Hash, CreditCard, Notebook, 
  Sparkles, User, MapPin, Mail, FileText, FileBarChart2, Search // Added Search Icon
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BillGenerator = ({ userRole, userName }) => {
  const { translations: t, language } = useTranslations();
  const { products } = useProducts(); 
  const isSq = language === 'sq';

  const [mode, setMode] = useState("simple"); 
  
  const [invoice, setInvoice] = useState({
    logo: null,
    invoiceNumber: "INV-001",
    date: new Date().toISOString().split("T")[0],
    senderName: "RBTech, KS",
    senderAddress: "Pristina, Kosovo",
    senderEmail: "info@rbtech.com",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    paymentMethod: "",
    notes: "Thank you for your business!", 
    hasVAT: false, 
    items: [{ sku: "", description: "", quantity: 1, unit: "pcs", price: 0, vatRate: 18, productId: null, discount: 0 }],
  });

  const logoInputRef = useRef();

  // --- HANDLERS ---

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setInvoice({ ...invoice, logo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleProductSelect = (index, productId) => {
      const product = products.find(p => p.id === Number(productId));
      if (!product) return;

      const newItems = [...invoice.items];
      newItems[index] = {
          ...newItems[index],
          productId: product.id,
          sku: product.sku,
          description: product.name,
          price: product.price,
          unit: product.unit,
          vatRate: product.vat 
      };
      setInvoice({ ...invoice, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoice.items];
    if (['description', 'unit', 'sku'].includes(field)) {
        newItems[index][field] = value;
    } else {
        newItems[index][field] = value === "" ? "" : Number(value);
    }
    setInvoice({ ...invoice, items: newItems });
  };

  // --- CALCULATIONS ---

  const totals = useMemo(() => {
    let subTotal = 0;
    let totalDiscount = 0;
    let totalVAT = 0;

    invoice.items.forEach(item => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const discountPercent = mode === 'advanced' ? Number(item.discount || 0) : 0;
        
        const lineTotal = qty * price;
        const lineDiscount = lineTotal * (discountPercent / 100);
        const discountedLineTotal = lineTotal - lineDiscount;

        let itemVatRate = 0;
        if (mode === 'advanced') {
            itemVatRate = Number(item.vatRate || 0);
        } else {
            itemVatRate = invoice.hasVAT ? 18 : 0;
        }

        const lineVAT = discountedLineTotal * (itemVatRate / 100);

        subTotal += lineTotal;
        totalDiscount += lineDiscount;
        totalVAT += lineVAT;
    });

    const netAmount = subTotal - totalDiscount;
    const grandTotal = netAmount + totalVAT;

    return { subTotal, totalDiscount, vatAmount: totalVAT, grandTotal };
  }, [invoice.items, invoice.hasVAT, mode]);

  // --- PDF GENERATION ---
  const handleDownloadPDF = () => {
    if (!invoice.clientName.trim()) { 
      Swal.fire({ icon: 'error', title: isSq ? 'Mungon Emri' : 'Missing Name', text: t.clientName }); 
      return; 
    }
    
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20; 
    const primaryPurple = [79, 70, 229];

    // Dates
    const dateObj = new Date(invoice.date);
    const monthTranslated = t.months[dateObj.getMonth()];
    const formattedDate = isSq 
      ? `${dateObj.getDate()} ${monthTranslated}, ${dateObj.getFullYear()}` 
      : `${monthTranslated} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

    // Labels
    const labels = {
      title: isSq ? "FATURË" : "INVOICE",
      inv: isSq ? "Fatura Nr:" : "Invoice No:",
      date: isSq ? "Data:" : "Date:",
      billedTo: isSq ? "FATURUAR PËR:" : "BILLED TO:",
      from: isSq ? "NGA:" : "FROM:",
      payment: isSq ? "Mënyra e pagesës:" : "Payment Method:",
      vat: isSq ? "TVSH:" : "VAT:",
      sub: isSq ? "Nëntotali: " : "Subtotal: ",
      disc: isSq ? "Zbritje:" : "Discount:",
      due: isSq ? "GJITHSEJ PËR PAGESË " : "TOTAL AMOUNT DUE ",
      note: isSq ? "Shënim:" : "Note:"
    };

    // Header Background
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 0, pageWidth, 45, 'F'); 

    // Logo / Brand
    if (invoice.logo) {
      try { doc.addImage(invoice.logo, "PNG", margin, 12, 35, 20); } catch (e) {}
    } else {
      doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryPurple);
      doc.text("RB Tech", margin, 25);
    }

    // Title & Meta
    doc.setFontSize(24); doc.setFont("helvetica", "bold"); doc.setTextColor(31, 41, 55);
    doc.text(labels.title, pageWidth - margin, 22, { align: "right" });

    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
    doc.text(`${labels.inv} ${invoice.invoiceNumber}`, pageWidth - margin, 30, { align: "right" });
    doc.text(`${labels.date} ${formattedDate}`, pageWidth - margin, 35, { align: "right" });

    // Address Block
    const infoY = 65;
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryPurple);
    doc.text(labels.billedTo, margin, infoY);
    doc.text(labels.from, pageWidth / 2 + 10, infoY);
    
    doc.setFont("helvetica", "normal"); doc.setTextColor(75);
    doc.text([invoice.clientName, invoice.clientAddress, invoice.clientEmail].filter(Boolean), margin, infoY + 6);
    doc.text([invoice.senderName, invoice.senderAddress, invoice.senderEmail], pageWidth / 2 + 10, infoY + 6);

    // --- TABLE CONFIGURATION ---
    let tableHead = [];
    let tableBody = [];

    if (mode === 'simple') {
        tableHead = [[isSq ? "Përshkrimi" : "Description", isSq ? "Sasia" : "Qty", isSq ? "Njësia" : "Unit", isSq ? "Çmimi" : "Price", "Total"]];
        tableBody = invoice.items.map(i => [
            i.description || "---", 
            i.quantity, 
            i.unit ? i.unit.replace(/m2/gi, "m²") : "-", 
            `€ ${Number(i.price).toLocaleString(undefined, {minimumFractionDigits: 2})}`, 
            `€ ${(Number(i.quantity) * Number(i.price)).toLocaleString(undefined, {minimumFractionDigits: 2})}`
        ]);
    } else {
        // Advanced Mode
        tableHead = [[ "Ref/SKU", isSq ? "Përshkrimi" : "Description", isSq ? "Sasia" : "Qty", isSq ? "Çmimi" : "Price", "VAT %", "Disc %", "Total"]];
        tableBody = invoice.items.map(i => {
            const rawTotal = i.quantity * i.price;
            const discountedTotal = rawTotal - (rawTotal * (i.discount / 100));
            return [
                i.sku || "-",
                i.description || "---", 
                i.quantity, 
                `€ ${Number(i.price).toFixed(2)}`,
                `${i.vatRate}%`,
                i.discount > 0 ? `${i.discount}%` : "-",
                `€ ${discountedTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`
            ];
        });
    }

    autoTable(doc, {
      startY: 95,
      head: tableHead,
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: primaryPurple, textColor: 255, fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: mode === 'simple' 
        ? { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" } }
        : { 2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "center" }, 5: { halign: "center" }, 6: { halign: "right", fontStyle: "bold" } }
    });

    // --- TOTALS ---
    let finalY = doc.lastAutoTable.finalY + 10;
    const summaryX = pageWidth - margin - 60;
    
    doc.setFontSize(10); doc.setTextColor(100);
    
    // Subtotal
    doc.text(labels.sub, summaryX, finalY);
    doc.text(`€ ${totals.subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`, pageWidth - margin, finalY, { align: "right" });

    // Discount
    if (mode === 'advanced' && totals.totalDiscount > 0) {
        finalY += 6;
        doc.setTextColor(220, 38, 38);
        doc.text(labels.disc, summaryX, finalY);
        doc.text(`- € ${totals.totalDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, pageWidth - margin, finalY, { align: "right" });
        doc.setTextColor(100);
    }

    // VAT
    if(totals.vatAmount > 0 || (mode === 'simple' && invoice.hasVAT)) {
        finalY += 6;
        doc.text(labels.vat, summaryX, finalY);
        doc.text(`€ ${totals.vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, pageWidth - margin, finalY, { align: "right" });
    }

    // Grand Total
    doc.setFillColor(...primaryPurple);
    doc.rect(summaryX - 5, finalY + 5, 65, 12, "F");
    doc.setFont("helvetica", "bold"); doc.setTextColor(255);
    doc.text(labels.due, summaryX, finalY + 13);
    doc.text(`€ ${totals.grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`, pageWidth - margin - 3, finalY + 13, { align: "right" });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 35;
    doc.setDrawColor(230); doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    doc.setFontSize(9); doc.setTextColor(80);

    if (invoice.paymentMethod) {
      doc.setFont("helvetica", "bold"); doc.setTextColor(0);
      doc.text(labels.payment, margin, footerY);
      doc.setFont("helvetica", "normal"); doc.setTextColor(80);
      doc.text(invoice.paymentMethod, margin + 35, footerY);
    }
    
    if (invoice.notes) {
      doc.setFont("helvetica", "bold"); doc.setTextColor(0);
      doc.text(labels.note, margin, footerY + 7);
      doc.setFont("helvetica", "normal"); doc.setTextColor(80);
      doc.text(invoice.notes, margin + (isSq ? 15 : 12), footerY + 7);
    }

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="dashboard-card p-3 p-md-5 bg-white text-dark shadow-sm rounded-4">
      {/* MOBILE OPTIMIZED CSS */}
      <style>{`
        @media (max-width: 768px) {
          .invoice-table thead { display: none; }
          .invoice-table tr { 
            display: block; 
            margin-bottom: 1rem; 
            padding: 1.5rem; 
            background: #ffffff; 
            border-radius: 12px;
            border: 1px solid #f1f5f9;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .invoice-table td { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border: none !important; 
            padding: 0.75rem 0 !important;
            border-bottom: 1px dashed #e2e8f0 !important;
          }
          .invoice-table td:last-child { border-bottom: none !important; }
          
          .invoice-table td::before { 
            content: attr(data-label); 
            font-weight: 700; 
            font-size: 0.7rem; 
            text-transform: uppercase; 
            color: #94a3b8;
            letter-spacing: 0.5px;
          }
          
          .invoice-table input, .invoice-table select { 
            text-align: right !important; 
            width: 60% !important; 
            font-weight: 600;
            color: #1e293b;
          }

          /* DESCRIPTION ROW FIX */
          .invoice-table td:nth-child(2) { 
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
            border-bottom: 2px solid #e2e8f0 !important;
            padding-bottom: 1rem !important;
            margin-bottom: 0.5rem;
          }
          .invoice-table td input[placeholder*="Description"], .invoice-table td select {
            text-align: left !important;
            width: 100% !important;
            font-size: 1rem;
            padding-left: 0;
          }
        }
      `}</style>

      {/* 1. TOP CONTROL BAR (MODE SWITCHER) */}
      <div className="d-flex justify-content-center mb-5">
        <div className="bg-light p-1 rounded-pill d-inline-flex border">
            <button 
                className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${mode === 'simple' ? 'btn-white shadow-sm text-primary' : 'text-muted'}`}
                onClick={() => setMode('simple')}
            >
                <FileText size={16} className="me-2"/> Simple
            </button>
            <button 
                className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${mode === 'advanced' ? 'btn-white shadow-sm text-primary' : 'text-muted'}`}
                onClick={() => setMode('advanced')}
            >
                <FileBarChart2 size={16} className="me-2"/> Advanced
            </button>
        </div>
      </div>

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center border-bottom pb-4 mb-4 mb-md-5 gap-4">
        <div className="d-flex align-items-center gap-3 gap-md-4">
          <div 
            className="position-relative bg-white shadow-sm rounded-4 d-flex align-items-center justify-content-center overflow-hidden border border-dashed border-primary border-opacity-25"
            style={{ width: "80px", height: "80px", minWidth: "80px", cursor: "pointer" }}
            onClick={() => logoInputRef.current.click()}
          >
             {invoice.logo ? (
                 <img src={invoice.logo} className="w-100 h-100 object-fit-contain p-2" alt="Logo" />
             ) : (
                 <div className="text-center text-muted">
                     <ImageIcon size={20} className="mb-1 text-primary opacity-50" />
                     <div style={{fontSize: '8px'}} className="fw-bold">LOGO</div>
                 </div>
             )}
             <input type="file" ref={logoInputRef} className="d-none" onChange={handleLogoUpload} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
                <Sparkles size={16} className="text-warning d-none d-md-block" />
                <h3 className="fw-bold text-primary mb-0">{mode === 'simple' ? t.invoiceTitle : "Advanced Invoice"}</h3>
            </div>
            {mode === 'simple' && (
                <div className="form-check form-switch p-0 m-0 d-flex align-items-center gap-2">
                    <input className="form-check-input ms-0 cursor-pointer" type="checkbox" checked={invoice.hasVAT} 
                        onChange={e => setInvoice({...invoice, hasVAT: e.target.checked})} />
                    <label className="small fw-bold text-muted text-uppercase tracking-wider">VAT (18%)</label>
                </div>
            )}
            {mode === 'advanced' && (
                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">Inventory Linked</span>
            )}
          </div>
        </div>
        <div className="text-md-end w-100 w-md-auto bg-light bg-opacity-50 p-3 rounded-4 border-start border-primary border-4 border-md-0">
          <label className="text-muted small fw-bold tracking-widest text-uppercase d-block">{language === 'sq' ? 'Shuma Totale' : 'Total Amount'}</label>
          <h2 className="fw-bold text-dark mb-0">€ {totals.grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
        </div>
      </div>

      {/* Grid */}
      <div className="row g-3 g-md-4 mb-4 mb-md-5">
        <div className="col-12 col-md-4">
          <div className="p-3 bg-light rounded-4 border border-white h-100">
            <label className="extra-small fw-bold text-muted uppercase mb-2 d-flex align-items-center gap-2"><Hash size={12}/> Metadata</label>
            <input type="text" className="form-control form-control-sm mb-2 border-0 bg-white shadow-sm" placeholder="Invoice #" value={invoice.invoiceNumber} onChange={e => setInvoice({...invoice, invoiceNumber: e.target.value})} />
            <input type="date" className="form-control form-control-sm border-0 bg-white shadow-sm" value={invoice.date} onChange={e => setInvoice({...invoice, date: e.target.value})} />
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="p-3 bg-light rounded-4 border border-white h-100">
            <label className="extra-small fw-bold text-muted uppercase mb-2 d-flex align-items-center gap-2"><User size={12}/> {language === 'sq' ? 'Nga' : 'From'}</label>
            <input type="text" className="form-control form-control-sm mb-1 border-0 bg-white shadow-sm" placeholder={language === 'sq' ? 'Emri juaj' : 'Your Name'} value={invoice.senderName} onChange={e => setInvoice({...invoice, senderName: e.target.value})} />
            <input type="text" className="form-control form-control-sm mb-1 border-0 bg-white shadow-sm" placeholder={language === 'sq' ? 'Adresa' : 'Address'} value={invoice.senderAddress} onChange={e => setInvoice({...invoice, senderAddress: e.target.value})} />
            <div className="input-group">
                <span className="input-group-text border-0 bg-white shadow-sm pe-0"><Mail size={12} className="text-muted"/></span>
                <input type="email" className="form-control form-control-sm border-0 bg-white shadow-sm" placeholder="Email" value={invoice.senderEmail} onChange={e => setInvoice({...invoice, senderEmail: e.target.value})} />
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="p-3 bg-light rounded-4 border border-white h-100">
            <label className="extra-small fw-bold text-muted uppercase mb-2 d-flex align-items-center gap-2"><MapPin size={12}/> {language === 'sq' ? 'Për' : 'To'}</label>
            <input type="text" className="form-control form-control-sm mb-1 border-0 bg-white shadow-sm" placeholder={t.clientName} value={invoice.clientName} onChange={e => setInvoice({...invoice, clientName: e.target.value})} />
            <input type="text" className="form-control form-control-sm mb-1 border-0 bg-white shadow-sm" placeholder={language === 'sq' ? 'Adresa e klientit' : 'Client Address'} value={invoice.clientAddress} onChange={e => setInvoice({...invoice, clientAddress: e.target.value})} />
            <div className="input-group">
                <span className="input-group-text border-0 bg-white shadow-sm pe-0"><Mail size={12} className="text-muted"/></span>
                <input type="email" className="form-control form-control-sm border-0 bg-white shadow-sm" placeholder={t.clientEmail} value={invoice.clientEmail} onChange={e => setInvoice({...invoice, clientEmail: e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-4 overflow-hidden shadow-sm mb-4">
        <table className="invoice-table w-100 mb-0">
          <thead className="bg-light"> 
            <tr>
              {mode === 'advanced' && <th className="ps-4 py-3 text-secondary uppercase small fw-bold" style={{width: '90px'}}>Ref/SKU</th>}
              <th className={`${mode === 'advanced' ? '' : 'ps-4'} py-3 text-secondary uppercase small fw-bold`}>{mode === 'advanced' ? "Select Product (Type to Search)" : t.itemDesc}</th>
              <th className="text-center text-secondary uppercase small fw-bold" style={{ width: '80px' }}>{t.itemQty}</th>
              <th className="text-center text-secondary uppercase small fw-bold" style={{ width: '80px' }}>{language === 'sq' ? 'Njësia' : 'Unit'}</th>
              <th className="text-end text-secondary uppercase small fw-bold" style={{ width: '120px' }}>{t.itemPrice}</th>
              {mode === 'advanced' && <th className="text-end text-secondary uppercase small fw-bold" style={{ width: '80px' }}>VAT %</th>}
              {mode === 'advanced' && <th className="text-end text-secondary uppercase small fw-bold" style={{ width: '80px' }}>Disc %</th>}
              <th className="text-end pe-4 text-secondary uppercase small fw-bold" style={{ width: '130px' }}>{t.total}</th>
              <th className="text-center" style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {invoice.items.map((item, idx) => (
                <motion.tr key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-bottom">
                  {/* SKU Column (Advanced) */}
                  {mode === 'advanced' && (
                      <td data-label="SKU" className="ps-md-4 py-md-3">
                          <input type="text" className="form-control form-control-sm border-0 bg-transparent p-0 text-muted" placeholder="#" value={item.sku} readOnly />
                      </td>
                  )}

                  {/* Description / Product Select */}
                  <td data-label={t.itemDesc} className={`${mode === 'simple' ? 'ps-md-4' : ''} py-md-3`}>
                    {mode === 'advanced' ? (
                        <div className="position-relative">
                            <input 
                                list={`products-list-${idx}`} // Use datalist for searchable dropdown
                                className="form-control form-control-sm border-0 bg-transparent fw-bold p-0 text-primary cursor-pointer"
                                placeholder="Search product..."
                                value={item.description}
                                onChange={(e) => {
                                    // 1. Update text immediately for typing
                                    handleItemChange(idx, 'description', e.target.value);
                                    
                                    // 2. Try to find match
                                    const match = products.find(p => p.name === e.target.value);
                                    if (match) handleProductSelect(idx, match.id);
                                }}
                            />
                            <datalist id={`products-list-${idx}`}>
                                {products.map(p => (
                                    <option key={p.id} value={p.name}>{p.sku} - € {p.price}</option>
                                ))}
                            </datalist>
                        </div>
                    ) : (
                        <input 
                          type="text" 
                          className="form-control form-control-sm border-0 bg-transparent p-0 fw-bold" 
                          placeholder={language === 'sq' ? 'Përshkrimi...' : 'Description...'} 
                          value={item.description} 
                          onChange={e => handleItemChange(idx, "description", e.target.value)} 
                        />
                    )}
                  </td>

                  {/* Quantity */}
                  <td data-label={t.itemQty}>
                    <input type="number" className="form-control form-control-sm border-0 bg-transparent p-0 text-md-center" value={item.quantity} onChange={e => handleItemChange(idx, "quantity", e.target.value)} />
                  </td>

                  {/* Unit */}
                  <td data-label={language === 'sq' ? 'Njësia' : 'Unit'}>
                    <input type="text" className="form-control form-control-sm border-0 bg-transparent p-0 text-md-center" placeholder="m²" value={item.unit} onChange={e => handleItemChange(idx, "unit", e.target.value)} />
                  </td>

                  {/* Price */}
                  <td data-label={t.itemPrice}>
                    <input type="number" className="form-control form-control-sm border-0 bg-transparent p-0 text-md-end fw-bold" value={item.price} onChange={e => handleItemChange(idx, "price", e.target.value)} disabled={mode === 'advanced'} />
                  </td>

                  {/* VAT % (Advanced) */}
                  {mode === 'advanced' && (
                      <td data-label="VAT %" className="text-end">
                          <span className="badge bg-light text-muted border">{item.vatRate}%</span>
                      </td>
                  )}

                  {/* Discount (Advanced) */}
                  {mode === 'advanced' && (
                      <td data-label="Discount %">
                          <input type="number" className="form-control form-control-sm border-0 bg-transparent p-0 text-md-end text-danger" placeholder="0" value={item.discount} onChange={e => handleItemChange(idx, "discount", e.target.value)} />
                      </td>
                  )}

                  {/* Total Line */}
                  <td data-label={t.total} className="text-md-end pe-md-4 fw-bold text-primary">
                      € {((item.quantity * item.price) * (1 - (mode === 'advanced' ? (item.discount / 100) : 0))).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>

                  <td className="text-center">
                    <button className="btn btn-link text-danger p-0" onClick={() => setInvoice({...invoice, items: invoice.items.filter((_, i) => i !== idx)})}><Trash2 size={16}/></button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Totals & Notes Section */}
      <div className="row g-4 justify-content-between align-items-end">
        <div className="col-12 col-md-6 order-2 order-md-1">
           <div className="p-3 bg-light rounded-4">
              <label className="extra-small fw-bold text-muted text-uppercase mb-2 d-block">{language === 'sq' ? 'Pagesa & Termat' : 'Payment & Terms'}</label>
              <div className="input-group mb-2 border-bottom shadow-none bg-transparent">
                 <span className="input-group-text bg-transparent border-0 ps-0"><CreditCard size={14} /></span>
                 <input type="text" className="form-control border-0 bg-transparent" placeholder={language === 'sq' ? 'Mënyra e pagesës / IBAN' : 'Payment Method / IBAN'} value={invoice.paymentMethod} onChange={e => setInvoice({ ...invoice, paymentMethod: e.target.value })} />
              </div>
              <div className="input-group bg-transparent shadow-none">
                 <span className="input-group-text bg-transparent border-0 ps-0 pt-2 align-self-start"><Notebook size={14} /></span>
                 <textarea 
                    className="form-control border-0 bg-transparent" 
                    placeholder={language === 'sq' ? 'Shënim...' : 'Note...'} 
                    rows="2" 
                    value={invoice.notes} 
                    onChange={e => setInvoice({ ...invoice, notes: e.target.value })}
                 />
              </div>
           </div>
        </div>
        <div className="col-12 col-md-4 order-1 order-md-2">
            <div className="card border-0 bg-primary bg-opacity-10 p-3 rounded-4 shadow-none">
                <div className="d-flex justify-content-between small text-muted mb-1 fw-bold"><span>{language === 'sq' ? 'Nëntotali' : 'Subtotal'}</span><span>€ {totals.subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                
                {mode === 'advanced' && totals.totalDiscount > 0 && (
                    <div className="d-flex justify-content-between small text-danger mb-1 fw-bold"><span>{language === 'sq' ? 'Zbritje' : 'Discount'}</span><span>-€ {totals.totalDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                )}

                {/* VAT Line: Shows in Advanced always (if > 0) OR Simple if Checked */}
                {(totals.vatAmount > 0 || (mode === 'simple' && invoice.hasVAT)) && (
                    <div className="d-flex justify-content-between small text-muted mb-1 fw-bold"><span>VAT</span><span>€ {totals.vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                )}
                
                <hr className="my-2 border-primary border-opacity-25" />
                <div className="d-flex justify-content-between fw-bold text-primary h4 mb-0"><span>{language === 'sq' ? 'Totali' : 'Grand Total'}</span><span>€ {totals.grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
            </div>
        </div>
      </div>

      {/* Actions */}
      <div className="d-flex flex-column flex-md-row justify-content-between mt-5 border-top pt-4 gap-3 no-print">
        <button className="btn btn-outline-primary border-2 px-4 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2" 
            onClick={() => setInvoice({...invoice, items: [...invoice.items, {sku: "", description:"", quantity:1, unit:"", price:0, discount: 0, vatRate: 18}]})}><Plus size={18}/> {t.addItem}</button>
        <button className="btn btn-primary btn-lg shadow px-5 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-3" onClick={handleDownloadPDF}>
            <Download size={22}/> {t.downloadInvoice}</button>
      </div>
    </div>
  );
};

export default BillGenerator;