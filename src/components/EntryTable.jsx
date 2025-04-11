import React from "react";

export default function EntryTable({ entries, t }) {
  return (
    <table className="table table-bordered table-striped">
      <thead>
        <tr>
          <th>{t.month}</th>
          <th>{t.type}</th>
          <th>{t.category}</th>
          <th>{t.description}</th>
          <th>{t.amount}</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={i}>
            <td>{e.month}</td>
            <td>{e.type}</td>
            <td>{e.category}</td>
            <td>{e.description}</td>
            <td>${e.actual}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
