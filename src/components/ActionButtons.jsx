import React from "react";

export default function ActionButtons({ exportToPDF, exportToExcel, clearAllEntries, t }) {
  return (
    <div className="container d-flex gap-3 mt-3">
      <button className="btn btn-primary" onClick={exportToPDF}>{t.exportPDF}</button>
      <button className="btn btn-success" onClick={exportToExcel}>{t.exportExcel}</button>
      <button className="btn btn-outline-danger" onClick={clearAllEntries}>{t.clearAll}</button>
    </div>
  );
}
