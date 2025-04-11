import React from "react";

export default function EntryForm({ form, handleChange, addEntry, t }) {
  return (
    <div className="no-print row g-3 mb-4">
      {["type", "month", "category", "description", "actual"].map((field, index) => (
        <div className="col-md-2" key={field}>
          {field === "type" || field === "month" ? (
            <select className="form-select" value={form[field]} onChange={(e) => handleChange(field, e.target.value)}>
              {(field === "type" ? [t.income, t.expense] : t.months).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              type={field === "actual" ? "number" : "text"}
              className="form-control"
              placeholder={t[field]}
              value={form[field]}
              onChange={(e) => handleChange(field, e.target.value)}
            />
          )}
        </div>
      ))}
      <div className="col-md-2">
        <button className="btn btn-danger w-100" onClick={addEntry}>
          {t.addEntry}
        </button>
      </div>
    </div>
  );
}
