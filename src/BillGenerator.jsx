import React, { useRef, useState, useMemo } from "react";
import { useTranslations } from "./LanguageContext";
import { useProducts } from "./ProductContext"; 
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Download, Image as ImageIcon, Trash2, Hash, CreditCard, Notebook, 
  Sparkles, User, MapPin, Mail, FileText, FileBarChart2, Globe, Landmark,
  PlusCircle, MinusCircle
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- HELPER FUNCTION FOR UNIQUE INVOICE NUMBERS ---
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return `INV-${year}${month}-${randomDigits}`;
};

const BillGenerator = ({ userRole, userName }) => {
  const { translations: t, language } = useTranslations();
  const { products } = useProducts(); 
  const isSq = language === 'sq';

  const [mode, setMode] = useState("simple"); 
  
  const [invoice, setInvoice] = useState({
    logo: null,
    invoiceNumber: generateInvoiceNumber(),
    date: new Date().toISOString().split("T")[0],
    senderName: "RBTech, KS",
    senderAddress: "Pristina, Kosovo",
    senderEmail: "info@rbtech.com",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    paymentMethod: "",
    notes: "Thank you for your business!", 
    globalVatRate: 0, 
    isExport: false, 
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

  const handleAddItem = () => {
    setInvoice({
      ...invoice, 
      items: [...invoice.items, {sku: "", description:"", quantity:1, unit:"pcs", price:0, discount: 0, vatRate: 18}]
    });
  };

  const handleRemoveItem = (index) => {
    setInvoice({
      ...invoice, 
      items: invoice.items.filter((_, i) => i !== index)
    });
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
        
        if (invoice.isExport) {
            itemVatRate = 0;
        } else if (mode === 'advanced') {
            itemVatRate = Number(item.vatRate || 0);
        } else {
            itemVatRate = invoice.globalVatRate;
        }

        const lineVAT = discountedLineTotal * (itemVatRate / 100);

        subTotal += lineTotal;
        totalDiscount += lineDiscount;
        totalVAT += lineVAT;
    });

    const netAmount = subTotal - totalDiscount;
    const grandTotal = netAmount + totalVAT;

    return { subTotal, totalDiscount, vatAmount: totalVAT, grandTotal };
  }, [invoice.items, invoice.globalVatRate, invoice.isExport, mode]);

  // --- PDF GENERATION ---
  const handleDownloadPDF = () => {
    if (!invoice.clientName.trim()) { 
      Swal.fire({ icon: 'error', title: isSq ? 'Mungon Emri' : 'Missing Name', text: t.clientName }); 
      return; 
    }
    
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20; 
    const primaryColor = [79, 70, 229];

    const dateObj = new Date(invoice.date);
    const monthTranslated = t.months ? t.months[dateObj.getMonth()] : dateObj.toLocaleString('default', { month: 'long' });
    const formattedDate = isSq 
      ? `${dateObj.getDate()} ${monthTranslated}, ${dateObj.getFullYear()}` 
      : `${monthTranslated} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

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

    doc.setFillColor(249, 250, 251);
    doc.rect(0, 0, pageWidth, 45, 'F'); 

    if (invoice.logo) {
      try { doc.addImage(invoice.logo, "PNG", margin, 12, 35, 20); } catch (e) {}
    } else {
      doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor);
      doc.text("RB Tech", margin, 25);
    }

    doc.setFontSize(24); doc.setFont("helvetica", "bold"); doc.setTextColor(31, 41, 55);
    doc.text(labels.title, pageWidth - margin, 22, { align: "right" });

    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
    doc.text(`${labels.inv} ${invoice.invoiceNumber}`, pageWidth - margin, 30, { align: "right" });
    doc.text(`${labels.date} ${formattedDate}`, pageWidth - margin, 35, { align: "right" });

    const infoY = 65;
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor);
    doc.text(labels.billedTo, margin, infoY);
    doc.text(labels.from, pageWidth / 2 + 10, infoY);
    
    doc.setFont("helvetica", "normal"); doc.setTextColor(75);
    doc.text([invoice.clientName, invoice.clientAddress, invoice.clientEmail].filter(Boolean), margin, infoY + 6);
    doc.text([invoice.senderName, invoice.senderAddress, invoice.senderEmail], pageWidth / 2 + 10, infoY + 6);

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
        tableHead = [[ "Ref/SKU", isSq ? "Përshkrimi" : "Description", isSq ? "Sasia" : "Qty", isSq ? "Çmimi" : "Price", "VAT %", "Disc %", "Total"]];
        tableBody = invoice.items.map(i => {
            const rawTotal = i.quantity * i.price;
            const discountedTotal = rawTotal - (rawTotal * (i.discount / 100));
            const displayVat = invoice.isExport ? "0%" : `${i.vatRate}%`;

            return [
                i.sku || "-",
                i.description || "---", 
                i.quantity, 
                `€ ${Number(i.price).toFixed(2)}`,
                displayVat,
                i.discount > 0 ? `${i.discount}%` : "-",
                `€ ${discountedTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`
            ];
        });
    }

    autoTable(doc, {
      startY: 95,
      margin: { bottom: 50 }, // CRITICAL: This leaves exactly enough space for the footer to NEVER be touched
      head: tableHead,
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: mode === 'simple' 
        ? { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" } }
        : { 2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "center" }, 5: { halign: "center" }, 6: { halign: "right", fontStyle: "bold" } }
    });

    // --- TOTALS BOX ---
    let finalY = doc.lastAutoTable.finalY + 10;
    
    // Check if totals block fits. We need about 40px for totals + 50px reserved for footer = 90px
    if (finalY > pageHeight - 90) {
        doc.addPage();
        finalY = 20; 
    }

    const summaryX = pageWidth - margin - 60;
    doc.setFontSize(10); doc.setTextColor(100);
    
    doc.text(labels.sub, summaryX, finalY);
    doc.text(`€ ${totals.subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`, pageWidth - margin, finalY, { align: "right" });

    if (mode === 'advanced' && totals.totalDiscount > 0) {
        finalY += 6;
        doc.setTextColor(220, 38, 38);
        doc.text(labels.disc, summaryX, finalY);
        doc.text(`- € ${totals.totalDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, pageWidth - margin, finalY, { align: "right" });
        doc.setTextColor(100);
    }

    if(totals.vatAmount > 0 || (mode === 'simple' && invoice.globalVatRate > 0) || invoice.isExport) {
        finalY += 6;
        let vatLabel = labels.vat;
        if (invoice.isExport) {
            vatLabel = isSq ? "TVSH (Eksport 0%):" : "VAT (Export 0%):";
        } else if (mode === 'simple') {
            vatLabel = `${labels.vat} (${invoice.globalVatRate}%)`;
        }
        doc.text(vatLabel, summaryX, finalY);
        doc.text(`€ ${totals.vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, pageWidth - margin, finalY, { align: "right" });
    }

    doc.setFillColor(...primaryColor);
    doc.rect(summaryX - 5, finalY + 5, 65, 12, "F");
    doc.setFont("helvetica", "bold"); doc.setTextColor(255);
    doc.text(labels.due, summaryX, finalY + 13);
    doc.text(`€ ${totals.grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`, pageWidth - margin - 3, finalY + 13, { align: "right" });

    // --- REPEATING FIXED FOOTER ON EVERY PAGE ---
    const pageCount = doc.internal.getNumberOfPages();
    const footerY = pageHeight - 40; 

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i); // Go to each page generated by the table/totals

        // Separator Line
        doc.setDrawColor(230); 
        doc.line(margin, footerY, pageWidth - margin, footerY); 
        
        doc.setFontSize(9); 
        doc.setTextColor(80);
        
        let textY = footerY + 6;

        // Payment Info
        if (invoice.paymentMethod) {
          doc.setFont("helvetica", "bold"); doc.setTextColor(0);
          doc.text(labels.payment, margin, textY);
          doc.setFont("helvetica", "normal"); doc.setTextColor(80);
          doc.text(invoice.paymentMethod, margin + 35, textY);
          textY += 6; 
        }
        
        // Notes & Legal export notice
        let finalNotes = invoice.notes;
        if (invoice.isExport) {
            const legalPhrase = "VAT 0% - Export of services per Law No. 05/L-037.";
            finalNotes = finalNotes ? `${finalNotes}\n\n*** Legal Notice: ${legalPhrase}` : `*** Legal Notice: ${legalPhrase}`;
        }

        if (finalNotes) {
          if(!invoice.paymentMethod) textY += 2; 
          
          doc.setFont("helvetica", "bold"); doc.setTextColor(0);
          doc.text(labels.note, margin, textY);
          doc.setFont("helvetica", "normal"); doc.setTextColor(80);
          
          const splitNotes = doc.splitTextToSize(finalNotes, pageWidth - margin - 35);
          doc.text(splitNotes, margin + (isSq ? 15 : 12), textY);
        }

        // Page N of X
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(isSq ? `Faqe ${i} nga ${pageCount}` : `Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }

    doc.save(`${invoice.invoiceNumber}.pdf`);

    setInvoice(prev => ({
        ...prev,
        invoiceNumber: generateInvoiceNumber()
    }));
  };

  return (
    <div className="dashboard-card p-3 p-md-5 bg-white text-dark shadow-sm rounded-4">
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
            
            <div className="d-flex flex-wrap gap-3 mt-2">
                {mode === 'simple' && (
                    <div className="d-flex align-items-center gap-2">
                        <label className={`small fw-bold text-uppercase tracking-wider ${invoice.isExport ? 'text-muted opacity-50' : 'text-dark'}`}>
                            VAT:
                        </label>
                        <select 
                            className="form-select form-select-sm border-0 bg-light fw-bold text-primary" 
                            style={{width: '80px', cursor: invoice.isExport ? 'not-allowed' : 'pointer'}}
                            value={invoice.globalVatRate} 
                            disabled={invoice.isExport}
                            onChange={e => setInvoice({...invoice, globalVatRate: Number(e.target.value)})}
                        >
                            <option value={0}>0%</option>
                            <option value={9}>9%</option>
                            <option value={18}>18%</option>
                        </select>
                    </div>
                )}
                
                <div className="form-check form-switch p-0 m-0 d-flex align-items-center gap-2">
                    <input 
                        className="form-check-input ms-0 cursor-pointer border-info" 
                        type="checkbox" 
                        checked={invoice.isExport} 
                        onChange={e => setInvoice({
                            ...invoice, 
                            isExport: e.target.checked, 
                            globalVatRate: e.target.checked ? 0 : invoice.globalVatRate 
                        })} 
                    />
                    <label className="small fw-bold text-info text-uppercase tracking-wider d-flex align-items-center gap-1">
                        <Globe size={14}/> {language === 'sq' ? 'Eksport (0% TVSH)' : 'Foreign Export (0%)'}
                    </label>
                </div>
            </div>

          </div>
        </div>
        <div className="text-md-end w-100 w-md-auto bg-light bg-opacity-50 p-3 rounded-4 border-start border-primary border-4 border-md-0">
          <label className="text-muted small fw-bold tracking-widest text-uppercase d-block">{language === 'sq' ? 'Shuma Totale' : 'Total Amount'}</label>
          <h2 className="fw-bold text-dark mb-0">€ {totals.grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
        </div>
      </div>

      {/* Grid for Inputs */}
      <div className="row g-3 g-md-4 mb-4 mb-md-5">
        <div className="col-12 col-md-4">
          <div className="p-3 bg-light rounded-4 border border-white h-100">
            <label className="extra-small fw-bold text-muted text-uppercase mb-2 d-flex align-items-center gap-2"><Hash size={12}/> Metadata</label>
            <input type="text" className="form-control form-control-sm mb-2 border-0 bg-white shadow-sm" placeholder="Invoice #" value={invoice.invoiceNumber} onChange={e => setInvoice({...invoice, invoiceNumber: e.target.value})} />
            <input type="date" className="form-control form-control-sm border-0 bg-white shadow-sm" value={invoice.date} onChange={e => setInvoice({...invoice, date: e.target.value})} />
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="p-3 bg-light rounded-4 border border-white h-100">
            <label className="extra-small fw-bold text-muted text-uppercase mb-2 d-flex align-items-center gap-2"><User size={12}/> {language === 'sq' ? 'Nga' : 'From'}</label>
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
            <label className="extra-small fw-bold text-muted text-uppercase mb-2 d-flex align-items-center gap-2"><MapPin size={12}/> {language === 'sq' ? 'Për' : 'To'}</label>
            <input type="text" className="form-control form-control-sm mb-1 border-0 bg-white shadow-sm" placeholder={t.clientName} value={invoice.clientName} onChange={e => setInvoice({...invoice, clientName: e.target.value})} />
            <input type="text" className="form-control form-control-sm mb-1 border-0 bg-white shadow-sm" placeholder={language === 'sq' ? 'Adresa e klientit' : 'Client Address'} value={invoice.clientAddress} onChange={e => setInvoice({...invoice, clientAddress: e.target.value})} />
            <div className="input-group">
                <span className="input-group-text border-0 bg-white shadow-sm pe-0"><Mail size={12} className="text-muted"/></span>
                <input type="email" className="form-control form-control-sm border-0 bg-white shadow-sm" placeholder={t.clientEmail} value={invoice.clientEmail} onChange={e => setInvoice({...invoice, clientEmail: e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      {/* --- CARD-BASED ITEM INPUT SECTION --- */}
      <div className="mb-4">
        <h6 className="text-muted fw-bold text-uppercase d-flex align-items-center gap-2 border-bottom pb-2 mb-3" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
          <Landmark size={14} /> {language === 'sq' ? 'Shërbimet & Produktet' : 'Services & Items'}
        </h6>

        <AnimatePresence>
          {invoice.items.map((item, index) => {
            const rowTotal = (item.quantity * item.price) * (1 - (mode === 'advanced' ? (item.discount / 100) : 0));
            
            return (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="position-relative bg-light p-3 rounded-4 border mb-3"
              >
                <div className="row g-2">
                  
                  {mode === 'advanced' && (
                    <div className="col-12 mb-1">
                      <input 
                        type="text" 
                        className="form-control form-control-sm border-0 shadow-sm text-muted bg-white" 
                        placeholder="Ref/SKU #" 
                        value={item.sku} 
                        readOnly 
                      />
                    </div>
                  )}

                  <div className="col-12">
                    {mode === 'advanced' ? (
                        <div className="position-relative">
                            <input 
                                list={`products-list-${index}`} 
                                className="form-control border-0 shadow-sm fw-bold text-primary"
                                placeholder={language === 'sq' ? 'Kërko produktin...' : 'Search product...'}
                                value={item.description}
                                onChange={(e) => {
                                    handleItemChange(index, 'description', e.target.value);
                                    const match = products?.find(p => p.name === e.target.value);
                                    if (match) handleProductSelect(index, match.id);
                                }}
                            />
                            <datalist id={`products-list-${index}`}>
                                {products?.map(p => (
                                    <option key={p.id} value={p.name}>{p.sku} - € {p.price}</option>
                                ))}
                            </datalist>
                        </div>
                    ) : (
                        <input 
                          type="text" 
                          className="form-control border-0 shadow-sm fw-bold" 
                          placeholder={language === 'sq' ? 'Përshkrimi i artikullit...' : 'Item description...'} 
                          value={item.description} 
                          onChange={e => handleItemChange(index, "description", e.target.value)} 
                        />
                    )}
                  </div>

                  <div className="col-4 mt-2">
                    <label className="text-muted fw-bold text-uppercase px-1" style={{ fontSize: '0.65rem' }}>{t.itemQty}</label>
                    <input type="number" className="form-control border-0 shadow-sm text-center fw-bold" value={item.quantity} onChange={e => handleItemChange(index, "quantity", e.target.value)} />
                  </div>
                  <div className="col-4 mt-2">
                    <label className="text-muted fw-bold text-uppercase px-1" style={{ fontSize: '0.65rem' }}>{language === 'sq' ? 'Njësia' : 'Unit'}</label>
                    <input type="text" className="form-control border-0 shadow-sm text-center" placeholder="pcs" value={item.unit} onChange={e => handleItemChange(index, "unit", e.target.value)} />
                  </div>
                  <div className="col-4 mt-2">
                    <label className="text-muted fw-bold text-uppercase px-1" style={{ fontSize: '0.65rem' }}>{language === 'sq' ? 'Çmimi €' : 'Price €'}</label>
                    <input type="number" className="form-control border-0 shadow-sm text-end font-monospace fw-bold" value={item.price} onChange={e => handleItemChange(index, "price", e.target.value)} disabled={mode === 'advanced'} />
                  </div>

                  {mode === 'advanced' && (
                    <>
                      <div className="col-6 mt-2">
                        <label className="text-muted fw-bold text-uppercase px-1" style={{ fontSize: '0.65rem' }}>VAT %</label>
                        <div className={`form-control border-0 shadow-sm text-center fw-bold ${invoice.isExport ? 'bg-info bg-opacity-10 text-info' : 'bg-white text-muted'}`}>
                           {invoice.isExport ? "0%" : `${item.vatRate}%`}
                        </div>
                      </div>
                      <div className="col-6 mt-2">
                        <label className="text-muted fw-bold text-uppercase px-1" style={{ fontSize: '0.65rem' }}>Disc %</label>
                        <input type="number" className="form-control border-0 shadow-sm text-end text-danger fw-bold" placeholder="0" value={item.discount} onChange={e => handleItemChange(index, "discount", e.target.value)} />
                      </div>
                    </>
                  )}

                  <div className="col-12 mt-3">
                    <div className="p-2 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-3 d-flex align-items-center justify-content-between shadow-sm">
                      <span className="text-primary text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Row Total:</span>
                      <span className="fw-bold text-primary font-monospace">
                         € {rowTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </span>
                    </div>
                  </div>

                </div>

                {invoice.items.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(index)} 
                    className="btn btn-sm btn-danger p-0 rounded-circle position-absolute shadow-sm d-flex align-items-center justify-content-center" 
                    style={{ top: '-10px', right: '-10px', width: '24px', height: '24px' }}
                    title="Remove Item"
                  >
                    <MinusCircle size={14} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        <button 
            type="button" 
            onClick={handleAddItem} 
            className="btn btn-link text-primary fw-bold text-decoration-none d-flex align-items-center gap-1 p-0 mt-2"
        >
          <PlusCircle size={16} /> {language === 'sq' ? 'Shto Rresht' : 'Add Item Row'}
        </button>
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
              
              {invoice.isExport && (
                  <div className="mt-3 p-2 bg-info bg-opacity-10 border border-info border-opacity-25 rounded small text-info d-flex gap-2">
                      <Globe size={16} className="mt-1 flex-shrink-0" />
                      <span>
                          <strong>Legal Clause Active:</strong> "VAT 0% - Export of services per Law No. 05/L-037." will be printed on the final PDF.
                      </span>
                  </div>
              )}
           </div>
        </div>
        <div className="col-12 col-md-4 order-1 order-md-2">
            <div className="card border-0 bg-primary bg-opacity-10 p-3 rounded-4 shadow-none">
                <div className="d-flex justify-content-between small text-muted mb-1 fw-bold"><span>{language === 'sq' ? 'Nëntotali' : 'Subtotal'}</span><span>€ {totals.subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                
                {mode === 'advanced' && totals.totalDiscount > 0 && (
                    <div className="d-flex justify-content-between small text-danger mb-1 fw-bold"><span>{language === 'sq' ? 'Zbritje' : 'Discount'}</span><span>-€ {totals.totalDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                )}

                {(totals.vatAmount > 0 || (mode === 'simple' && invoice.globalVatRate > 0) || invoice.isExport) && (
                    <div className="d-flex justify-content-between small text-muted mb-1 fw-bold">
                        <span className={invoice.isExport ? "text-info" : ""}>
                            {invoice.isExport ? (language === 'sq' ? 'TVSH (Eksport)' : 'VAT (Export)') : `VAT (${invoice.globalVatRate}%)`}
                        </span>
                        <span className={invoice.isExport ? "text-info" : ""}>
                            € {totals.vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </span>
                    </div>
                )}
                
                <hr className="my-2 border-primary border-opacity-25" />
                <div className="d-flex justify-content-between fw-bold text-primary h4 mb-0"><span>{language === 'sq' ? 'Totali' : 'Grand Total'}</span><span>€ {totals.grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
            </div>
        </div>
      </div>

      {/* Actions */}
      <div className="d-flex flex-column flex-md-row justify-content-end mt-5 border-top pt-4 gap-3 no-print">
        <button className="btn btn-primary btn-lg shadow px-5 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-3" onClick={handleDownloadPDF}>
            <Download size={22}/> {t.downloadInvoice}
        </button>
      </div>
    </div>
  );
};

export default BillGenerator;