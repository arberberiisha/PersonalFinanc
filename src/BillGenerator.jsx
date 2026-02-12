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
    if (field === "description" || field === "unit") {
      newItems[index][field] = value;
    } else {
      newItems[index][field] = value === "" ? "" : Number(value);
    }
    setInvoice({ ...invoice, items: newItems });
  };

  const calculateTotal = () => {
    return invoice.items.reduce(
      (acc, item) => acc + Number(item.quantity || 0) * Number(item.price || 0),
      0
    );
  };

  const handleDownloadPDF = () => {
    if (!invoice.clientName.trim()) {
      Swal.fire("Error", "Please enter a Client Name", "error");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const primaryColor = [79, 70, 229];
    const secondaryColor = [107, 114, 128];
    const darkColor = [31, 41, 55];

    // --- STRICT LANGUAGE LOGIC ---
    const isSq = language === "sq";
    const labels = {
      title: isSq ? "FATURË" : "INVOICE",
      billedTo: isSq ? "Faturuar për:" : "Billed to:",
      from: isSq ? "Nga:" : "From:",
      dateLabel: isSq ? "Data" : "Date",
      invNum: isSq ? "Fatura #" : "Invoice #",
      colService: isSq ? "Përshkrimi i Punës" : "Description of Services",
      colQty: isSq ? "Sasia" : "Qty",
      colRate: isSq ? "Çmimi" : "Rate",
      colTotal: isSq ? "Shuma" : "Total",
      totalDue: isSq ? "Gjithsej për pagesë" : "Total Amount Due",
      payment: isSq ? "Mënyra e pagesës:" : "Payment Method:",
      note: isSq ? "Shënim:" : "Note:",
    };

    // 1. TOP HEADER (Name & Invoice #)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(invoice.senderName.toUpperCase(), margin, 20);
    doc.text(`${labels.invNum} ${invoice.invoiceNumber}`, pageWidth - margin, 20, { align: "right" });

    // 2. LOGO & DECORATIVE LINES
    if (invoice.logo) {
      try {
        doc.addImage(invoice.logo, "PNG", margin, 25, 25, 15);
      } catch (e) {}
    }
    // Decorative lines next to logo
    doc.setDrawColor(230);
    for (let i = 0; i < 6; i++) {
      doc.line(45, 27 + (i * 2), 110, 27 + (i * 2));
    }

    // 3. DATE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...darkColor);
    doc.text(`${labels.dateLabel}: ${invoice.date}`, margin, 50);

    // 4. TWO-COLUMN ADDRESS SECTION
    const infoY = 60;
    // Left side: Billed To
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text(labels.billedTo, margin, infoY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    doc.text(invoice.clientName || "---", margin, infoY + 6);
    doc.text(invoice.clientAddress || "---", margin, infoY + 11);
    doc.text(invoice.clientEmail || "---", margin, infoY + 16);

    // Right side: From
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text(labels.from, pageWidth / 2 + 10, infoY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    doc.text(invoice.senderName, pageWidth / 2 + 10, infoY + 6);
    doc.text(invoice.senderAddress, pageWidth / 2 + 10, infoY + 11);
    doc.text(invoice.senderEmail, pageWidth / 2 + 10, infoY + 16);

    // 5. TABLE (Corrected StartY to avoid overlap)
    const tableColumn = [labels.colService, labels.colQty, labels.colRate, labels.colTotal];
    const tableRows = invoice.items.map((item) => {
      let unitDisplay = item.unit || "";
      if (unitDisplay.toLowerCase().includes("m2")) unitDisplay = unitDisplay.replace(/m2/gi, "m²");

      return [
        item.description || "---",
        `${item.quantity || 0} ${unitDisplay}`.trim(),
        `€${(item.price || 0).toFixed(2)}`,
        `€${(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: 85,
      margin: { left: margin, right: margin },
      head: [tableColumn],
      body: tableRows,
      theme: "plain",
      headStyles: { textColor: secondaryColor, fontStyle: "bold", fontSize: 9, halign: 'left' },
      bodyStyles: { textColor: darkColor, fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 30, halign: "right", fontStyle: "bold" },
      },
      didParseCell: (data) => {
        data.cell.styles.borderBottom = 0.1;
        data.cell.styles.lineColor = [243, 244, 246];
        if (data.section === 'head') {
            if (data.column.index === 1) data.cell.styles.halign = 'center';
            if (data.column.index >= 2) data.cell.styles.halign = 'right';
        }
      },
    });

    // 6. TOTAL & FOOTER
    const finalY = doc.lastAutoTable.finalY + 10;
    
    // Line before total
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 85, finalY - 2, pageWidth - margin, finalY - 2);

    // Total Box
    doc.setFillColor(249, 250, 251);
    doc.rect(pageWidth - 85, finalY, 70, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text(labels.totalDue, pageWidth - 80, finalY + 8);
    doc.setTextColor(...darkColor);
    doc.text(`€ ${calculateTotal().toFixed(2)}`, pageWidth - margin - 5, finalY + 8, { align: "right" });

    // Payment method and Notes
    doc.setFontSize(10);
    if (invoice.paymentMethod) {
      doc.setFont("helvetica", "bold");
      doc.text(labels.payment, margin, finalY + 20);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.paymentMethod, margin + 35, finalY + 20);
    }
    if (invoice.notes) {
      doc.setFont("helvetica", "bold");
      doc.text(labels.note, margin, finalY + 27);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.notes, margin + 15, finalY + 27);
    }

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="dashboard-card p-4 p-md-5">
      {/* HEADER SECTION */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-5 border-bottom pb-4 gap-4">
        <div className="w-100">
          <div className="mb-3">
            <input type="file" accept="image/*" ref={logoInputRef} style={{ display: "none" }} onChange={handleLogoUpload} />
            {invoice.logo ? (
              <div className="position-relative d-inline-block" onMouseEnter={() => setLogoHover(true)} onMouseLeave={() => setLogoHover(false)}>
                <img src={invoice.logo} alt="Logo" style={{ maxHeight: "80px", objectFit: "contain" }} />
                {logoHover && (
                  <button className="btn btn-sm btn-danger position-absolute top-0 start-100 translate-middle rounded-circle p-0 no-print" style={{ width: "20px", height: "20px" }} onClick={() => setInvoice({ ...invoice, logo: null })}>×</button>
                )}
              </div>
            ) : (
              <div className="no-print d-flex align-items-center gap-2 text-muted border rounded px-3 py-3 bg-light small" onClick={() => logoInputRef.current.click()} style={{ cursor: "pointer", borderStyle: "dashed", width: "fit-content" }}>
                <ImageIcon size={20} /> {t.uploadLogo || "Upload Logo"}
              </div>
            )}
          </div>
          <h2 className="fw-bold text-primary mb-0"><Receipt className="me-2" />{t.invoiceTitle}</h2>
        </div>
        <div className="text-md-end w-100">
          <label className="text-muted small fw-bold text-uppercase d-block mb-1">{t.totalDue || "Total Due"}</label>
          <h2 className="fw-bold display-5 text-dark mb-0">€{calculateTotal().toFixed(2)}</h2>
        </div>
      </div>

      {/* THREE-COLUMN INPUT GRID */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <label className="text-muted small fw-bold text-uppercase mb-2 d-block">Invoice Meta</label>
          <div className="input-group mb-2 border rounded-3 overflow-hidden shadow-sm">
            <span className="input-group-text bg-white border-0"><Hash size={14} /></span>
            <input type="text" className="form-control border-0" value={invoice.invoiceNumber} onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })} />
          </div>
          <div className="input-group border rounded-3 overflow-hidden shadow-sm">
            <span className="input-group-text bg-white border-0"><Calendar size={14} /></span>
            <input type="date" className="form-control border-0" value={invoice.date} onChange={(e) => setInvoice({ ...invoice, date: e.target.value })} />
          </div>
        </div>

        <div className="col-md-4">
          <label className="text-muted small fw-bold text-uppercase mb-2 d-block">From (Your Details)</label>
          <input type="text" className="form-control mb-1 border rounded-3 shadow-sm py-2 px-3" placeholder="Sender Name" value={invoice.senderName} onChange={(e) => setInvoice({ ...invoice, senderName: e.target.value })} />
          <input type="text" className="form-control mb-1 border rounded-3 shadow-sm py-2 px-3" placeholder="Sender Address" value={invoice.senderAddress} onChange={(e) => setInvoice({ ...invoice, senderAddress: e.target.value })} />
          <input type="email" className="form-control border rounded-3 shadow-sm py-2 px-3" placeholder="Sender Email" value={invoice.senderEmail} onChange={(e) => setInvoice({ ...invoice, senderEmail: e.target.value })} />
        </div>

        <div className="col-md-4">
          <label className="text-muted small fw-bold text-uppercase mb-2 d-block">{t.billTo}</label>
          <input type="text" className="form-control mb-1 border rounded-3 shadow-sm py-2 px-3" placeholder={t.clientName} value={invoice.clientName} onChange={(e) => setInvoice({ ...invoice, clientName: e.target.value })} />
          <input type="email" className="form-control mb-1 border rounded-3 shadow-sm py-2 px-3" placeholder="Client Email" value={invoice.clientEmail} onChange={(e) => setInvoice({ ...invoice, clientEmail: e.target.value })} />
          <input type="text" className="form-control border rounded-3 shadow-sm py-2 px-3" placeholder="Client Address" value={invoice.clientAddress} onChange={(e) => setInvoice({ ...invoice, clientAddress: e.target.value })} />
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="table-responsive mb-4">
        <table className="invoice-table w-100">
          <thead>
            <tr>
              <th className="text-start">{t.itemDesc}</th>
              <th width="80" className="text-center">{t.itemQty}</th>
              <th width="100" className="text-center">{t.unit || "Unit"} (m²)</th>
              <th width="140" className="text-end">{t.itemPrice}</th>
              <th width="140" className="text-end">{t.total}</th>
              <th width="40" className="no-print"></th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td className="text-start">
                  <input type="text" className="form-control border-0 p-0 bg-transparent" placeholder="..." value={item.description} onChange={(e) => handleItemChange(index, "description", e.target.value)} />
                </td>
                <td className="text-center">
                  <input type="number" className="form-control border-0 p-0 bg-transparent text-center" value={item.quantity === 0 ? "" : item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} />
                </td>
                <td className="text-center">
                  <input type="text" className="form-control border-0 p-0 bg-transparent text-center" placeholder="m²" value={item.unit} onChange={(e) => handleItemChange(index, "unit", e.target.value)} />
                </td>
                <td className="text-end">
                  <div className="d-flex align-items-center justify-content-end">
                    <span className="small text-muted me-1">€</span>
                    <input type="number" className="form-control border-0 p-0 bg-transparent text-end" style={{ width: "90px" }} value={item.price === 0 ? "" : item.price} onChange={(e) => handleItemChange(index, "price", e.target.value)} />
                  </div>
                </td>
                <td className="fw-bold text-end pe-3">€{(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</td>
                <td className="no-print text-center">
                  <button className="btn btn-link text-danger p-0" onClick={() => setInvoice({ ...invoice, items: invoice.items.filter((_, i) => i !== index) })}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER SECTION: PAYMENT & NOTES */}
      <div className="row g-4 mt-4 border-top pt-4">
        <div className="col-md-6">
          <div className="input-group mb-2 border rounded-3 shadow-sm overflow-hidden">
            <span className="input-group-text bg-white border-0"><CreditCard size={16} className="text-muted" /></span>
            <input type="text" className="form-control border-0" placeholder="Payment Method (e.g. Bank Transfer)" value={invoice.paymentMethod} onChange={(e) => setInvoice({ ...invoice, paymentMethod: e.target.value })} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="input-group border rounded-3 shadow-sm overflow-hidden">
            <span className="input-group-text bg-white border-0"><Notebook size={16} className="text-muted" /></span>
            <input type="text" className="form-control border-0" placeholder="Notes (e.g. Thank you)" value={invoice.notes} onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between no-print mt-5 pt-4 border-top">
        <button className="btn btn-white shadow-sm border px-4" onClick={() => setInvoice({ ...invoice, items: [...invoice.items, { description: "", quantity: 1, unit: "", price: 0 }] })}>
          <Plus size={18} /> {t.addItem}
        </button>
        <button className="btn btn-primary px-5 shadow fw-bold" onClick={handleDownloadPDF}>
          <Download size={18} /> Download Professional PDF
        </button>
      </div>
    </div>
  );
};

export default BillGenerator;