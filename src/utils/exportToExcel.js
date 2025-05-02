import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportToExcel = async ({
  entries,
  totals,
  title,
  fileName = "finance-report",
}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Finance Report");

  sheet.mergeCells("A1", "F1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = title;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: "center" };

  const headerRow = sheet.addRow([
    "Month",
    "Year",
    "Type",
    "Category",
    "Description",
    "Amount",
  ]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCCCCCC" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  entries.forEach((e) => {
    sheet.addRow([
      e.month,
      e.year ?? "",
      e.type,
      e.category,
      e.description || "",
      Number(e.actual),
    ]);
  });

  sheet.addRow([]);
  sheet.addRow(["Total Income", "", "", "", "", totals.income]);
  sheet.addRow(["Total Expense", "", "", "", "", totals.expense]);
  sheet.addRow(["Balance", "", "", "", "", totals.balance]);

  sheet.columns.forEach((col) => (col.width = 20));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${fileName}.xlsx`);
};