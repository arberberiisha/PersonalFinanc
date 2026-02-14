import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportToATK = async ({ entries, month, year }) => {
    const workbook = new ExcelJS.Workbook();
    
    // 1. Purchase Book (Libri i Blerjes)
    const purchaseSheet = workbook.addWorksheet("Libri i Blerjes");
    purchaseSheet.columns = [
        { header: "Data", key: "date", width: 15 },
        { header: "Numri Faturës", key: "invoiceNo", width: 20 },
        { header: "Numri Fiskal", key: "fiscalNo", width: 15 },
        { header: "Emri i Furnitorit", key: "supplier", width: 25 },
        { header: "Vlera pa TVSH", key: "net", width: 15 },
        { header: "Vlera e TVSH", key: "vat", width: 15 },
        { header: "Totali", key: "total", width: 15 },
    ];

    // 2. Sales Book (Libri i Shitjes)
    const salesSheet = workbook.addWorksheet("Libri i Shitjes");
    salesSheet.columns = [
        { header: "Data", key: "date", width: 15 },
        { header: "Numri Faturës", key: "invoiceNo", width: 20 },
        { header: "Numri Fiskal Klientit", key: "fiscalNo", width: 15 },
        { header: "Emri i Klientit", key: "client", width: 25 },
        { header: "Vlera pa TVSH", key: "net", width: 15 },
        { header: "Vlera e TVSH", key: "vat", width: 15 },
        { header: "Totali", key: "total", width: 15 },
    ];

    // Filter current month
    const currentEntries = entries.filter(e => e.month === month && e.year === year);

    currentEntries.forEach(e => {
        const row = {
            date: `${e.month} ${e.year}`,
            invoiceNo: e.description || "N/A",
            fiscalNo: e.fiscalNumber || "",
            supplier: e.category,
            net: (Number(e.actual) / 1.18).toFixed(2), // Estimated net
            vat: (Number(e.actual) - (Number(e.actual) / 1.18)).toFixed(2), // Estimated VAT
            total: Number(e.actual).toFixed(2)
        };

        if (e.type === "Expense") purchaseSheet.addRow(row);
        else salesSheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `ATK_Report_${month}_${year}.xlsx`);
};