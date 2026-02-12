import React, { useRef, useState } from "react";
import { useTranslations } from "./LanguageContext";
import Swal from "sweetalert2";
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
    // "From" Section (Sender)
    senderName: "RBTech, KS",
    senderAddress: "Pristina, Kosovo",
    senderEmail: "info@rbtech.com",
    // "Billed To" Section (Client)
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    // Footer Details
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

    const labels = {
      title: isSq ? "FATURË" : "INVOICE",
      billedTo: isSq ? "Faturuar për:" : "Billed to:",
      from: isSq ? "Nga:" : "From:",
      date: isSq ? "Data" : "Date",
      inv: isSq ? "Fatura #" : "Invoice #",
      colPuna: isSq ? "Përshkrimi" : "Description",
      colQty: isSq ? "Sasia" : "Qty",
      colRate: isSq ? "Çmimi" : "Rate",
      colTotal: isSq ? "Shuma" : "Total",
      due: isSq ? "Gjithsej" : "Total Due"
    };

    // 1. Header Meta
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(invoice.senderName.toUpperCase(), margin, 20);
    doc.text(`${labels.inv} ${invoice.invoiceNumber}`, pageWidth - margin, 20, { align: "right" });

    // 2. Logo & Decorative Lines
    if (invoice.logo) try { doc.addImage(invoice.logo, "PNG", margin, 25, 25, 15); } catch (e) {}
    doc.setDrawColor(230);
    for (let i = 0; i < 6; i++) doc.line(45, 27 + (i * 2), 110, 27 + (i * 2));

    // 3. Date Info
    doc.setFont("helvetica", "bold"); doc.setTextColor(0);
    doc.text(`${labels.date}: ${invoice.date}`, margin, 50);

    // 4. Two-Column Contact Section
    const infoY = 60;
    const primaryPurple = [79, 70, 229];
    doc.setTextColor(...primaryPurple); 
    doc.text(labels.billedTo, margin, infoY);
    doc.text(labels.from, pageWidth / 2 + 10, infoY);
    
    doc.setFont("helvetica", "normal"); doc.setTextColor(100);
    doc.text(invoice.clientName || "---", margin, infoY + 6);
    doc.text(invoice.clientAddress || "---", margin, infoY + 11);
    doc.text(invoice.clientEmail || "---", margin, infoY + 16);

    doc.text(invoice.senderName, pageWidth / 2 + 10, infoY + 6);
    doc.text(invoice.senderAddress, pageWidth / 2 + 10, infoY + 11);
    doc.text(invoice.senderEmail, pageWidth / 2 + 10, infoY + 16);

    // 5. Table with Alignment Fixes
    autoTable(doc, {
      startY: 88,
      head: [[labels.colPuna, labels.colQty, labels.colRate, labels.colTotal]],
      body: invoice.items.map(i => [
        i.description, 
        `${i.quantity} ${i.unit.replace(/m2/gi, "m²")}`, 
        `€${i.price.toFixed(2)}`, 
        `€${(i.quantity * i.price).toFixed(2)}`
      ]),
      theme: "plain",
      headStyles: { 
        fontStyle: "bold", 
        textColor: [100, 100, 100], 
        fontSize: 9,
        halign: 'left' // Default
      },
      bodyStyles: { textColor: [0, 0, 0], fontSize: 10, cellPadding: 3 },
      columnStyles: { 
        0: { cellWidth: "auto", halign: "left" }, 
        1: { cellWidth: 25, halign: "center" }, 
        2: { cellWidth: 35, halign: "right" }, 
        3: { cellWidth: 35, halign: "right", fontStyle: "bold" } 
      },
      didParseCell: (data) => {
        // Sync Header alignment with Body alignment
        if (data.section === 'head') {
          if (data.column.index === 1) data.cell.styles.halign = 'center';
          if (data.column.index >= 2) data.cell.styles.halign = 'right';
        }
        data.cell.styles.borderBottom = 0.1;
        data.cell.styles.lineColor = [230, 230, 230];
      }
    });

    // 6. Final Total Section
    const finalY = doc.lastAutoTable.finalY + 10;
    
    // --- THE LINE BEFORE TOTAL ---
    doc.setDrawColor(...primaryPurple);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 95, finalY - 2, pageWidth - margin, finalY - 2);

    // Total Background Box
    doc.setFillColor(249, 250, 251); 
    doc.rect(pageWidth - 95, finalY, 80, 12, "F");
    
    doc.setFont("helvetica", "bold"); 
    doc.setTextColor(...primaryPurple);
    doc.text(labels.due, pageWidth - 90, finalY + 8);
    
    doc.setTextColor(0); 
    doc.text(`€ ${calculateTotal().toFixed(2)}`, pageWidth - margin - 5, finalY + 8, { align: "right" });

    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="dashboard-card p-4 p-md-5">
      <div className="d-flex justify-content-between border-bottom pb-4 mb-5">
        <div>
          <h2 className="fw-bold text-primary mb-0">{t.invoiceTitle}</h2>
        </div>
        <div className="text-end">
          <label className="text-muted small fw-bold">TOTAL AMOUNT</label>
          <h2 className="fw-bold display-6">€{calculateTotal().toFixed(2)}</h2>
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <label className="small fw-bold text-muted">INVOICE META</label>
          <div className="input-group mb-2 border rounded-3"><span className="input-group-text bg-white border-0"><Hash size={14}/></span><input type="text" className="form-control border-0" value={invoice.invoiceNumber} onChange={e => setInvoice({...invoice, invoiceNumber: e.target.value})} /></div>
          <div className="input-group border rounded-3"><span className="input-group-text bg-white border-0"><Calendar size={14}/></span><input type="date" className="form-control border-0" value={invoice.date} onChange={e => setInvoice({...invoice, date: e.target.value})} /></div>
        </div>
        <div className="col-md-4">
          <label className="small fw-bold text-muted">FROM (SENDER)</label>
          <input type="text" className="form-control mb-1 bg-light border-0" placeholder="Your Name" value={invoice.senderName} onChange={e => setInvoice({...invoice, senderName: e.target.value})} />
          <input type="text" className="form-control mb-1 bg-light border-0" placeholder="Address" value={invoice.senderAddress} onChange={e => setInvoice({...invoice, senderAddress: e.target.value})} />
          <input type="email" className="form-control bg-light border-0" placeholder="Email" value={invoice.senderEmail} onChange={e => setInvoice({...invoice, senderEmail: e.target.value})} />
        </div>
        <div className="col-md-4">
          <label className="small fw-bold text-muted">TO (CLIENT)</label>
          <input type="text" className="form-control mb-1 bg-light border-0" placeholder="Client Name" value={invoice.clientName} onChange={e => setInvoice({...invoice, clientName: e.target.value})} />
          <input type="text" className="form-control mb-1 bg-light border-0" placeholder="Address" value={invoice.clientAddress} onChange={e => setInvoice({...invoice, clientAddress: e.target.value})} />
          <input type="email" className="form-control bg-light border-0" placeholder="Client Email" value={invoice.clientEmail} onChange={e => setInvoice({...invoice, clientEmail: e.target.value})} />
        </div>
      </div>

      <div className="table-responsive">
        <table className="invoice-table">
          <thead>
            <tr>
              <th className="text-start">{t.itemDesc}</th>
              <th className="text-center">{t.itemQty}</th>
              <th className="text-center">Unit (m²)</th>
              <th className="text-end">{t.itemPrice}</th>
              <th className="text-end">{t.total}</th>
              <th className="no-print"></th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td data-label={t.itemDesc}><input type="text" className="form-control border-0" value={item.description} onChange={e => handleItemChange(idx, "description", e.target.value)} /></td>
                <td data-label={t.itemQty}><input type="number" className="form-control border-0 text-center" value={item.quantity === 0 ? "" : item.quantity} onFocus={() => item.quantity === 0 && handleItemChange(idx, "quantity", "")} onChange={e => handleItemChange(idx, "quantity", e.target.value)} /></td>
                <td data-label="Unit"><input type="text" className="form-control border-0 text-center" placeholder="m²" value={item.unit} onChange={e => handleItemChange(idx, "unit", e.target.value)} /></td>
                <td data-label={t.itemPrice} className="text-end">€<input type="number" className="form-control border-0 d-inline-block text-end" style={{width:'80px'}} value={item.price === 0 ? "" : item.price} onFocus={() => item.price === 0 && handleItemChange(idx, "price", "")} onChange={e => handleItemChange(idx, "price", e.target.value)} /></td>
                <td data-label={t.total} className="fw-bold text-end pe-3">€{(item.quantity * item.price).toFixed(2)}</td>
                <td className="no-print"><button className="btn btn-link text-danger p-0" onClick={() => setInvoice({...invoice, items: invoice.items.filter((_, i) => i !== idx)})}><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between mt-5 border-top pt-4 no-print">
        <button className="btn btn-white border shadow-sm" onClick={() => setInvoice({...invoice, items: [...invoice.items, {description:"", quantity:1, unit:"", price:0}]})}><Plus size={18}/> Add Item</button>
        <button className="btn btn-primary shadow px-5" onClick={handleDownloadPDF}><Download size={18}/> Download PDF</button>
      </div>
    </div>
  );
};

export default BillGenerator;