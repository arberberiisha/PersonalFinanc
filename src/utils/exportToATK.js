import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportToATK = async ({ entries, month, year }) => {
  try {
    // 1. Load templates using the EXACT names from your public/templates folder
    const responseBlerja = await fetch("/templates/Libri-i-Blerjes-FINAL-MOSTRA-1.xlsx");
    const responseShitja = await fetch("/templates/Libri-i-Shitjes-FINAL-MOSTRA.xlsx");

    if (!responseBlerja.ok || !responseShitja.ok) {
      throw new Error("Templates not found in /public/templates/");
    }

    const arrayBufferBlerja = await responseBlerja.arrayBuffer();
    const arrayBufferShitja = await responseShitja.arrayBuffer();

    const wbBlerja = new ExcelJS.Workbook();
    const wbShitja = new ExcelJS.Workbook();

    await wbBlerja.xlsx.load(arrayBufferBlerja);
    await wbShitja.xlsx.load(arrayBufferShitja);

    const purchaseSheet = wbBlerja.getWorksheet(1);
    const salesSheet = wbShitja.getWorksheet(1);

    // Filter entries for the specific month/year
    const currentEntries = entries.filter(e => e.month === month && e.year === year);

    // STARTING FROM ROW 4 (Rows 1-3 are headers/details)
    let pRow = 4; 
    let sRow = 4;

    currentEntries.forEach((e) => {
      const amount = Number(e.actual);
      const net = e.hasVAT ? (amount / 1.18) : amount;
      const vat = e.hasVAT ? (amount - net) : 0;

      if (e.type === "Expense") {
        purchaseSheet.getCell(`A${pRow}`).value = pRow - 3; // Nr. (Row 4 becomes #1)
        purchaseSheet.getCell(`B${pRow}`).value = `${e.month} ${e.year}`;
        purchaseSheet.getCell(`C${pRow}`).value = e.fiscalNumber || "N/A";
        purchaseSheet.getCell(`D${pRow}`).value = e.category; 
        purchaseSheet.getCell(`E${pRow}`).value = e.fiscalNumber || "";
        purchaseSheet.getCell(`F${pRow}`).value = e.hasVAT ? Number(net.toFixed(2)) : 0;
        purchaseSheet.getCell(`G${pRow}`).value = !e.hasVAT ? Number(amount.toFixed(2)) : 0;
        purchaseSheet.getCell(`I${pRow}`).value = Number(vat.toFixed(2));
        
        // Handling Withholding Tax if it exists
        if (e.taxDetails) {
            purchaseSheet.getCell(`I${pRow}`).value = Number(e.taxDetails.taxAmount.toFixed(2));
        }

        purchaseSheet.getCell(`L${pRow}`).value = Number(amount.toFixed(2));
        pRow++;
      } else {
        salesSheet.getCell(`A${sRow}`).value = sRow - 3; // Nr.
        salesSheet.getCell(`B${sRow}`).value = `${e.month} ${e.year}`;
        salesSheet.getCell(`C${sRow}`).value = e.fiscalNumber || "N/A";
        salesSheet.getCell(`D${sRow}`).value = e.category;
        salesSheet.getCell(`E${sRow}`).value = e.fiscalNumber || "";
        salesSheet.getCell(`F${sRow}`).value = e.hasVAT ? Number(net.toFixed(2)) : 0;
        salesSheet.getCell(`G${sRow}`).value = !e.hasVAT ? Number(amount.toFixed(2)) : 0;
        salesSheet.getCell(`I${sRow}`).value = Number(vat.toFixed(2));
        salesSheet.getCell(`L${sRow}`).value = Number(amount.toFixed(2));
        sRow++;
      }
    });

    // 2. Export modified files
    const bufferB = await wbBlerja.xlsx.writeBuffer();
    saveAs(new Blob([bufferB]), `Libri_Blerjes_${month}_${year}.xlsx`);

    setTimeout(async () => {
      const bufferS = await wbShitja.xlsx.writeBuffer();
      saveAs(new Blob([bufferS]), `Libri_Shitjes_${month}_${year}.xlsx`);
    }, 600);

  } catch (error) {
    console.error("ATK Export Error:", error);
    alert("Make sure the files are in public/templates/ and named correctly.");
  }
};