import React, { useRef, useState } from "react";
import { useTranslations } from "./LanguageContext";
import Swal from "sweetalert2";
import { Plus, Download, Image as ImageIcon, Receipt, User, Mail, Calendar, Trash2, Hash, MapPin } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BillGenerator = () => {
  const { translations: t } = useTranslations();

  const [invoice, setInvoice] = useState({
    logo: null,
    invoiceNumber: "INV-001",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    date: new Date().toISOString().split("T")[0],
    items: [{ description: "", quantity: 1, price: 0 }],
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
    if (field === "description") {
      newItems[index][field] = value;
    } else {
      newItems[index][field] = value === "" ? "" : Number(value);
    }
    setInvoice({ ...invoice, items: newItems });
  };

  const calculateTotal = () => {
    return invoice.items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
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

    // 1. HEADER & LOGO
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.setTextColor(...darkColor);
    doc.text("INVOICE", margin, 25);

    if (invoice.logo) {
      try { doc.addImage(invoice.logo, "PNG", pageWidth - 45, 12, 30, 15); } catch (e) {}
    }

    // 2. SENDER INFO (Top Right)
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("RBTech, KS", pageWidth - margin, 32, { align: "right" });
    
    // 3. BILL TO SECTION
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text(t.billTo || "Billed to", margin, 45);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    doc.text(invoice.clientName || "Company Name", margin, 52);
    doc.text(invoice.clientEmail || "Contact Email", margin, 57);
    
    // DATE UNDER EMAIL
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkColor);
    doc.text(`${t.date || "Date"}: `, margin, 62);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    doc.text(invoice.date, margin + 12, 62); 

    doc.text(invoice.clientAddress || "Client Address", margin, 67);

    doc.setDrawColor(243, 244, 246);
    doc.line(margin, 75, pageWidth - margin, 75);

    // 4. METADATA (Left)
    const metaY = 85;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkColor);
    doc.text("Invoice #", margin, metaY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    doc.text(invoice.invoiceNumber, margin, metaY + 5);

    // 5. TABLE
    const tableColumn = ["Services", "Qty", "Rate", "Total"];
    const tableRows = invoice.items.map((item) => [
      item.description || "Item Name",
      item.quantity || 0,
      `€${(item.price || 0).toFixed(2)}`,
      `€${(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 80,
      margin: { left: 75, right: margin },
      head: [tableColumn],
      body: tableRows,
      theme: "plain",
      headStyles: { textColor: secondaryColor, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { textColor: darkColor, fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "center", cellWidth: 15 },
        2: { halign: "right", cellWidth: 25 },
        3: { halign: "right", fontStyle: "bold", cellWidth: 25 },
      },
      didParseCell: (data) => {
        data.cell.styles.borderBottom = 0.1;
        data.cell.styles.lineColor = [243, 244, 246];
      },
    });

    // 6. FINAL TOTAL
    const finalY = doc.lastAutoTable.finalY + 10;
    
    // LINE BEFORE TOTAL DUE
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(75, finalY - 2, pageWidth - margin, finalY - 2);

    doc.setFillColor(249, 250, 251); 
    doc.rect(75, finalY, pageWidth - margin - 75, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("Total Amount", 80, finalY + 8);
    doc.text(`€ ${calculateTotal().toFixed(2)}`, pageWidth - margin - 5, finalY + 8, { align: "right" });

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="dashboard-card p-4 p-md-5">
      {/* HEADER & TOTAL */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-5 border-bottom pb-4 gap-4">
        <div className="w-100">
          <div className="mb-3">
             <input type="file" accept="image/*" ref={logoInputRef} style={{ display: "none" }} onChange={handleLogoUpload} />
             {invoice.logo ? (
                <div className="position-relative d-inline-block">
                  <img src={invoice.logo} alt="Logo" style={{ maxHeight: "80px", objectFit: "contain" }} />
                  <button className="btn btn-sm btn-danger position-absolute top-0 start-100 translate-middle rounded-circle p-0 no-print" style={{width: '20px', height: '20px'}} onClick={() => setInvoice({...invoice, logo: null})}>×</button>
                </div>
             ) : (
                <div className="no-print d-flex align-items-center gap-2 text-muted border rounded px-3 py-3 bg-light small" onClick={() => logoInputRef.current.click()} style={{ cursor: "pointer", borderStyle: "dashed", width: "fit-content" }}>
                  <ImageIcon size={20} /> Upload Brand Logo
                </div>
             )}
          </div>
          <h2 className="fw-bold text-primary mb-0"><Receipt className="me-2" />{t.invoiceTitle}</h2>
        </div>
        
        <div className="text-md-end w-100">
          <label className="text-muted small fw-bold text-uppercase d-block mb-1">Total Amount</label>
          <h2 className="fw-bold display-5 text-dark mb-0">€{calculateTotal().toFixed(2)}</h2>
        </div>
      </div>

      {/* INFO FIELDS */}
      <div className="row g-4 mb-5">
        <div className="col-md-6">
          <label className="text-muted small fw-bold text-uppercase mb-2 d-block">Invoice Details</label>
          <div className="input-group mb-2 border rounded-3 overflow-hidden shadow-sm">
            <span className="input-group-text bg-white border-0"><Hash size={14}/></span>
            <input type="text" className="form-control border-0" placeholder="Invoice #" value={invoice.invoiceNumber} onChange={e => setInvoice({...invoice, invoiceNumber: e.target.value})} />
          </div>
          <div className="input-group mb-2 border rounded-3 overflow-hidden shadow-sm">
            <span className="input-group-text bg-white border-0"><Calendar size={14}/></span>
            <input type="date" className="form-control border-0" value={invoice.date} onChange={e => setInvoice({...invoice, date: e.target.value})} />
          </div>
        </div>

        <div className="col-md-6">
          <label className="text-muted small fw-bold text-uppercase mb-2 d-block">{t.billTo}</label>
          <div className="input-group mb-2 border rounded-3 overflow-hidden shadow-sm">
            <span className="input-group-text bg-white border-0"><User size={14}/></span>
            <input type="text" className="form-control border-0" placeholder={t.clientName} value={invoice.clientName} onChange={e => setInvoice({...invoice, clientName: e.target.value})} />
          </div>
          {/* EMAIL INPUT FIELD ADDED HERE */}
          <div className="input-group mb-2 border rounded-3 overflow-hidden shadow-sm">
            <span className="input-group-text bg-white border-0"><Mail size={14}/></span>
            <input type="email" className="form-control border-0" placeholder="Client Email" value={invoice.clientEmail} onChange={e => setInvoice({...invoice, clientEmail: e.target.value})} />
          </div>
          <div className="input-group border rounded-3 overflow-hidden shadow-sm">
            <span className="input-group-text bg-white border-0"><MapPin size={14}/></span>
            <input type="text" className="form-control border-0" placeholder="Address" value={invoice.clientAddress} onChange={e => setInvoice({...invoice, clientAddress: e.target.value})} />
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="table-responsive mb-4">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>{t.itemDesc}</th>
              <th width="100" className="text-center">Qty</th>
              <th width="140" className="text-end">Price</th>
              <th width="120" className="text-end">Total</th>
              <th width="40" className="no-print"></th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td data-label={t.itemDesc}>
                  <input type="text" className="form-control border-0 p-0 bg-transparent" placeholder="Description" value={item.description} onChange={e => handleItemChange(index, "description", e.target.value)} />
                </td>
                <td data-label="Qty">
                  <input type="number" className="form-control border-0 p-0 bg-transparent text-center" 
                    value={item.quantity === 0 ? "" : item.quantity} 
                    onFocus={() => item.quantity === 0 && handleItemChange(index, "quantity", "")}
                    onChange={e => handleItemChange(index, "quantity", e.target.value)} />
                </td>
                <td data-label="Price">
                  <div className="d-flex align-items-center justify-content-end">
                    <span className="small text-muted me-1">€</span>
                    <input type="number" className="form-control border-0 p-0 bg-transparent text-end" 
                      style={{width: '90px'}}
                      value={item.price === 0 ? "" : item.price} 
                      onFocus={() => item.price === 0 && handleItemChange(index, "price", "")}
                      onChange={e => handleItemChange(index, "price", e.target.value)} />
                  </div>
                </td>
                <td className="fw-bold text-end">€{(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</td>
                <td className="no-print text-end">
                  <button className="btn btn-link text-danger p-0" onClick={() => setInvoice({...invoice, items: invoice.items.filter((_, i) => i !== index)})}><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between no-print mt-5 pt-4 border-top">
        <button className="btn btn-white shadow-sm border" onClick={() => setInvoice({...invoice, items: [...invoice.items, {description:"", quantity:1, price:0}]})}><Plus size={18} /> Add Item</button>
        <button className="btn btn-primary px-5 shadow" onClick={handleDownloadPDF}><Download size={18} /> Download PDF</button>
      </div>
    </div>
  );
};

export default BillGenerator;