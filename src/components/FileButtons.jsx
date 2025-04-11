import React from "react";

export default function FileButtons({ t, excelInputRef, imageInputRef, handleFileUpload, handleBillImageUpload }) {
  return (
    <div className="d-flex flex-wrap gap-3 justify-content-center mb-1 mt-5 no-print">
      <input type="file" accept=".xlsx" ref={excelInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
      <input type="file" accept="image/*" ref={imageInputRef} style={{ display: "none" }} onChange={handleBillImageUpload} />
      <button className="btn btn-outline-primary px-4 py-2 shadow-sm fw-semibold rounded-pill" onClick={() => excelInputRef.current.click()}>
        {t.importExcel}
      </button>
      <button className="btn btn-outline-warning px-4 py-2 shadow-sm fw-semibold rounded-pill" onClick={() => imageInputRef.current.click()}>
        {t.scanBill}
      </button>
    </div>
  );
}
