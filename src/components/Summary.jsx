import React from "react";

export default function Summary({ totalIncome, totalExpense, balance, t }) {
  return (
    <div className="mt-4">
      <p><strong className="text-success">{t.totalIncome}:</strong> ${totalIncome}</p>
      <p><strong className="text-danger">{t.totalExpense}:</strong> ${totalExpense}</p>
      <p><strong className="text-primary">{t.balance}:</strong> ${balance}</p>
    </div>
  );
}
