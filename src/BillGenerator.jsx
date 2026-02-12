import React, { useRef, useState } from "react";
import { useTranslations } from "./LanguageContext";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Download,
  Image as ImageIcon,
  Receipt,
  User,
  Mail,
  Calendar,
  Trash2,
  Hash,
  MapPin,
  CreditCard,
  Notebook
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BillGenerator = () => {
  const { translations: t, language } = useTranslations();

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
    notes: "",
    items: [{ description: "", quantity: 1, unit: "", price: 0 }],
  });

  const [logoHover, setLogoHover] = useState(false);
  const logoInputRef = useRef();

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setInvoice({ ...invoice, logo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoice.items];
    newItems[index][field] = (field === "description" || field === "unit") ? value : (value === "" ? "" : Number(value));
    setInvoice({ ...invoice, items: newItems });
  };

  const calculateTotal = () => invoice.items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.price || 0)), 0);

  const handleDownloadPDF = () => {
    if (!invoice.clientName.trim()) { Swal.fire("Error", "Please enter Client Name", "error"); return; }
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const isSq = language === "sq";
    const primaryPurple = [79, 70, 229];

    const dateObj = new Date(invoice.date);
    const day = dateObj.getDate();
    const monthIndex = dateObj.getMonth();
    const year = dateObj.getFullYear();
    const monthTranslated = t.months[monthIndex];

    const formattedDate = isSq 
      ? `${day} ${monthTranslated}, ${year}` 
      : `${monthTranslated} ${day}, ${year}`;

    const labels = {
      inv: isSq ? "NO:" : "NO:",
      date: isSq ? "Data:" : "Date:",
      billedTo: isSq ? "Faturuar për:" : "Billed to:",
      from: isSq ? "Nga:" : "From:",
      colPuna: isSq ? "Përshkrimi i Punës" : "Description of Services",
      colQty: isSq ? "Sasia" : "Qty",
      colRate: isSq ? "Çmimi" : "Rate",
      colTotal: isSq ? "Shuma" : "Total",
      due: isSq ? "Gjithsej për pagesë" : "Total Amount Due",
      payment: isSq ? "Mënyra e pagesës:" : "Payment Method:",
      note: isSq ? "Shënim:" : "Note:"
    };

    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(invoice.senderName.toUpperCase(), margin, 20);
    doc.text(`${labels.inv} ${invoice.invoiceNumber}`, pageWidth - margin, 20, { align: "right" });

    if (invoice.logo) {
      try {
        doc.addImage(invoice.logo, "PNG", margin, 25, 20, 15);
      } catch (e) {}
    }
    
    doc.setDrawColor(230);
    for (let i = 0; i < 6; i++) doc.line(40, 27 + (i * 2.2), 110, 27 + (i * 2.2));

    doc.setFont("helvetica", "bold"); doc.setTextColor(0);
    doc.text(`${labels.date} ${formattedDate}`, margin, 50);

    const infoY = 60;
    doc.setTextColor(...primaryPurple); doc.text(labels.billedTo, margin, infoY);
    doc.text(labels.from, pageWidth / 2 + 10, infoY);
    
    doc.setFont("helvetica", "normal"); doc.setTextColor(80);
    doc.text(invoice.clientName || "---", margin, infoY + 6);
    doc.text(invoice.clientAddress || "---", margin, infoY + 11);
    doc.text(invoice.clientEmail || "---", margin, infoY + 16);
    doc.text(invoice.senderName, pageWidth / 2 + 10, infoY + 6);
    doc.text(invoice.senderAddress, pageWidth / 2 + 10, infoY + 11);
    doc.text(invoice.senderEmail, pageWidth / 2 + 10, infoY + 16);

    autoTable(doc, {
      startY: 88,
      head: [[labels.colPuna, labels.colQty, labels.colRate, labels.colTotal]],
      body: invoice.items.map(i => [
        i.description || "---", 
        `${i.quantity} ${i.unit ? i.unit.replace(/m2/gi, "m²") : ""}`.trim(), 
        `€${Number(i.price).toFixed(2)}`, 
        `€${(Number(i.quantity) * Number(i.price)).toFixed(2)}`
      ]),
      theme: "plain",
      headStyles: { fontStyle: "bold", textColor: primaryPurple, fontSize: 9, cellPadding: { bottom: 4, top: 2 } },
      columnStyles: { 0: { cellWidth: "auto" }, 1: { halign: "center", cellWidth: 25 }, 2: { halign: "right", cellWidth: 35 }, 3: { halign: "right", cellWidth: 35, fontStyle: "bold" } },
      didDrawPage: (data) => {
        doc.setDrawColor(...primaryPurple);
        doc.setLineWidth(0.5);
        const headerBottomY = data.settings.startY + 8; 
        doc.line(margin, headerBottomY, pageWidth - margin, headerBottomY);
      },
      didParseCell: (data) => {
        if (data.section === 'head') {
          if (data.column.index === 1) data.cell.styles.halign = 'center';
          if (data.column.index >= 2) data.cell.styles.halign = 'right';
        }
        data.cell.styles.borderBottom = 0.05;
        data.cell.styles.lineColor = [240, 240, 240];
      }
    });

    let finalY = doc.lastAutoTable.finalY + 10;
    doc.setDrawColor(...primaryPurple); doc.setLineWidth(0.5);
    doc.line(pageWidth - 95, finalY - 2, pageWidth - margin, finalY - 2);

    doc.setFillColor(249, 250, 251); doc.rect(pageWidth - 95, finalY, 80, 12, "F");
    doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryPurple);
    doc.text(labels.due, pageWidth - 90, finalY + 8);
    doc.setTextColor(0); doc.text(`€ ${calculateTotal().toFixed(2)}`, pageWidth - margin - 5, finalY + 8, { align: "right" });

    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="dashboard-card p-4 p-md-5">
      {/* HEADER SECTION WITH LOGO RESTORED */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-5 border-bottom pb-4 gap-4">
        <div className="w-100">
          <div className="mb-3">
            <input type="file" accept="image/*" ref={logoInputRef} style={{ display: "none" }} onChange={handleLogoUpload} />
            {invoice.logo ? (
              <div 
                className="position-relative d-inline-block" 
                onMouseEnter={() => setLogoHover(true)} 
                onMouseLeave={() => setLogoHover(false)}
              >
                <img src={invoice.logo} alt="Logo" style={{ maxHeight: "80px", objectFit: "contain" }} />
                {logoHover && (
                  <button 
                    className="btn btn-sm btn-danger position-absolute top-0 start-100 translate-middle rounded-circle p-0 no-print" 
                    style={{ width: "20px", height: "20px" }} 
                    onClick={() => setInvoice({ ...invoice, logo: null })}
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <div 
                className="no-print d-flex align-items-center gap-2 text-muted border rounded px-3 py-3 bg-light small" 
                onClick={() => logoInputRef.current.click()} 
                style={{ cursor: "pointer", borderStyle: "dashed", width: "fit-content" }}
              >
                <ImageIcon size={20} /> {t.uploadLogo || "Upload Logo"}
              </div>
            )}
          </div>
          <h2 className="fw-bold text-primary mb-0"><Receipt className="me-2" />{t.invoiceTitle}</h2>
        </div>
        <div className="text-md-end w-100">
          <label className="text-muted small fw-bold text-uppercase d-block mb-1">TOTAL DUE</label>
          <h2 className="fw-bold display-5 text-dark mb-0">€{calculateTotal().toFixed(2)}</h2>
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <label className="small fw-bold text-muted uppercase">Metadata</label>
          <div className="input-group mb-2 border rounded-3 overflow-hidden shadow-sm">
            <span className="input-group-text bg-white border-0"><Hash size={14} /></span>
            <input type="text" className="form-control border-0" value={invoice.invoiceNumber} onChange={e => setInvoice({...invoice, invoiceNumber: e.target.value})} />
          </div>
          <div className="input-group border rounded-3 overflow-hidden shadow-sm">
            <span className="input-group-text bg-white border-0"><Calendar size={14} /></span>
            <input type="date" className="form-control border-0" value={invoice.date} onChange={e => setInvoice({...invoice, date: e.target.value})} />
          </div>
        </div>
        
        <div className="col-md-4">
          <label className="small fw-bold text-muted uppercase">From</label>
          <input type="text" className="form-control mb-1 border-0 bg-light shadow-sm" placeholder="Your Name" value={invoice.senderName} onChange={e => setInvoice({...invoice, senderName: e.target.value})} />
          <input type="text" className="form-control mb-1 border-0 bg-light shadow-sm" placeholder="Address" value={invoice.senderAddress} onChange={e => setInvoice({...invoice, senderAddress: e.target.value})} />
          <input type="email" className="form-control border-0 bg-light shadow-sm" placeholder="Your Email" value={invoice.senderEmail} onChange={e => setInvoice({...invoice, senderEmail: e.target.value})} />
        </div>
        
        <div className="col-md-4">
          <label className="small fw-bold text-muted uppercase">To</label>
          <input type="text" className="form-control mb-1 border-0 bg-light shadow-sm" placeholder={t.clientName} value={invoice.clientName} onChange={e => setInvoice({...invoice, clientName: e.target.value})} />
          <input type="text" className="form-control mb-1 border-0 bg-light shadow-sm" placeholder="Address" value={invoice.clientAddress} onChange={e => setInvoice({...invoice, clientAddress: e.target.value})} />
          <input type="email" className="form-control border-0 bg-light shadow-sm" placeholder={t.clientEmail} value={invoice.clientEmail} onChange={e => setInvoice({...invoice, clientEmail: e.target.value})} />
        </div>
      </div>

      <div className="pf-table-wrapper">
        <table className="invoice-table w-100">
          <thead>
            <tr>
              <th className="text-start">{t.itemDesc}</th>
              <th className="text-center" style={{ width: '80px' }}>{t.itemQty}</th>
              <th className="text-center" style={{ width: '100px' }}>Unit</th>
              <th className="text-end" style={{ width: '120px' }}>{t.itemPrice}</th>
              <th className="text-end" style={{ width: '120px' }}>{t.total}</th>
              <th className="no-print text-center" style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {invoice.items.map((item, idx) => (
                <motion.tr key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td data-label={t.itemDesc} className="text-start">
                    <input type="text" className="form-control border-0 bg-transparent p-0" placeholder="Service..." value={item.description} onChange={e => handleItemChange(idx, "description", e.target.value)} />
                  </td>
                  <td data-label={t.itemQty} className="text-center">
                    <input type="number" className="form-control border-0 bg-transparent p-0 text-center" value={item.quantity === 0 ? "" : item.quantity} onChange={e => handleItemChange(idx, "quantity", e.target.value)} />
                  </td>
                  <td data-label="Unit" className="text-center">
                    <input type="text" className="form-control border-0 bg-transparent p-0 text-center" placeholder="e.g. m²" value={item.unit} onChange={e => handleItemChange(idx, "unit", e.target.value)} />
                  </td>
                  <td data-label={t.itemPrice} className="text-end">
                    <div className="d-flex justify-content-end align-items-center">
                      <span className="small text-muted me-1">€</span>
                      <input type="number" className="form-control border-0 bg-transparent p-0 text-end" style={{width:'70px'}} value={item.price === 0 ? "" : item.price} onChange={e => handleItemChange(idx, "price", e.target.value)} />
                    </div>
                  </td>
                  <td data-label={t.total} className="fw-bold text-end pe-2">€{(Number(item.quantity) * Number(item.price)).toFixed(2)}</td>
                  <td className="no-print text-center">
                    <button className="btn btn-link text-danger p-0" onClick={() => setInvoice({...invoice, items: invoice.items.filter((_, i) => i !== idx)})}><Trash2 size={16}/></button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="row g-4 mt-4 border-top pt-4">
        <div className="col-md-6">
          <div className="input-group mb-2 border rounded-3 shadow-sm overflow-hidden">
            <span className="input-group-text bg-white border-0"><CreditCard size={16} className="text-muted" /></span>
            <input type="text" className="form-control border-0" placeholder="Payment Method" value={invoice.paymentMethod} onChange={e => setInvoice({ ...invoice, paymentMethod: e.target.value })} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="input-group border rounded-3 shadow-sm overflow-hidden">
            <span className="input-group-text bg-white border-0"><Notebook size={16} className="text-muted" /></span>
            <input type="text" className="form-control border-0" placeholder="Notes" value={invoice.notes} onChange={e => setInvoice({ ...invoice, notes: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between mt-5 border-top pt-4 no-print">
        <button className="btn btn-white border shadow-sm px-4" onClick={() => setInvoice({...invoice, items: [...invoice.items, {description:"", quantity:1, unit:"", price:0}]})}><Plus size={18}/> {t.addItem}</button>
        <button className="btn btn-primary shadow px-5" onClick={handleDownloadPDF}><Download size={18}/> {t.downloadInvoice}</button>
      </div>
    </div>
  );
};

export default BillGenerator;