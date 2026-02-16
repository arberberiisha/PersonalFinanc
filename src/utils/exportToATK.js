import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Modified to accept 'periodLabel' instead of just 'month'
export const exportToATK = async ({ entries, periodLabel, year }) => {
  try {
    const responseBlerja = await fetch("/templates/Libri-i-Blerjes-FINAL-MOSTRA-1.xlsx");
    const responseShitja = await fetch("/templates/Libri-i-Shitjes-FINAL-MOSTRA.xlsx");

    if (!responseBlerja.ok || !responseShitja.ok) {
      throw new Error("Templates not found in /public/templates/");
    }

    const wbBlerja = new ExcelJS.Workbook();
    const wbShitja = new ExcelJS.Workbook();

    await wbBlerja.xlsx.load(await responseBlerja.arrayBuffer());
    await wbShitja.xlsx.load(await responseShitja.arrayBuffer());

    const purchaseSheet = wbBlerja.getWorksheet(1);
    const salesSheet = wbShitja.getWorksheet(1);

    // NOTE: We no longer filter here. We assume 'entries' passed 
    // to this function are ALREADY filtered by the main component.

    let pRow = 4; 
    let sRow = 4;

    entries.forEach((e) => {
      const amount = Number(e.actual);
      const net = e.hasVAT ? (amount / 1.18) : amount;
      const vat = e.hasVAT ? (amount - net) : 0;

      // Common Date Format logic
      const entryDate = `${e.month} ${e.year}`;

      if (e.type === "Expense") {
        purchaseSheet.getCell(`A${pRow}`).value = pRow - 3; 
        purchaseSheet.getCell(`B${pRow}`).value = entryDate;
        purchaseSheet.getCell(`C${pRow}`).value = e.description || "N/A"; // Invoice No
        purchaseSheet.getCell(`D${pRow}`).value = e.category; 
        purchaseSheet.getCell(`E${pRow}`).value = e.fiscalNumber || "";
        purchaseSheet.getCell(`F${pRow}`).value = e.hasVAT ? Number(net.toFixed(2)) : 0;
        purchaseSheet.getCell(`G${pRow}`).value = !e.hasVAT ? Number(amount.toFixed(2)) : 0;
        purchaseSheet.getCell(`I${pRow}`).value = Number(vat.toFixed(2));
        
        if (e.taxDetails) {
            purchaseSheet.getCell(`I${pRow}`).value = Number(e.taxDetails.taxAmount.toFixed(2));
        }

        purchaseSheet.getCell(`L${pRow}`).value = Number(amount.toFixed(2));
        pRow++;
      } else {
        salesSheet.getCell(`A${sRow}`).value = sRow - 3;
        salesSheet.getCell(`B${sRow}`).value = entryDate;
        salesSheet.getCell(`C${sRow}`).value = e.description || "N/A";
        salesSheet.getCell(`D${sRow}`).value = e.category;
        salesSheet.getCell(`E${sRow}`).value = e.fiscalNumber || "";
        salesSheet.getCell(`F${sRow}`).value = e.hasVAT ? Number(net.toFixed(2)) : 0;
        salesSheet.getCell(`G${sRow}`).value = !e.hasVAT ? Number(amount.toFixed(2)) : 0;
        salesSheet.getCell(`I${sRow}`).value = Number(vat.toFixed(2));
        salesSheet.getCell(`L${sRow}`).value = Number(amount.toFixed(2));
        sRow++;
      }
    });

    const bufferB = await wbBlerja.xlsx.writeBuffer();
    saveAs(new Blob([bufferB]), `Libri_Blerjes_${periodLabel}_${year}.xlsx`);

    setTimeout(async () => {
      const bufferS = await wbShitja.xlsx.writeBuffer();
      saveAs(new Blob([bufferS]), `Libri_Shitjes_${periodLabel}_${year}.xlsx`);
    }, 600);

  } catch (error) {
    console.error("ATK Export Error:", error);
    alert(error.message);
  }
};