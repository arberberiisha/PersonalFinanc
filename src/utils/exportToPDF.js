import html2pdf from "html2pdf.js";

export const exportToPDF = ({ element, darkMode }) => {
  const originalDark = darkMode;
  document.body.classList.remove("dark-mode");
  const toHide = element.querySelectorAll(".no-print");
  toHide.forEach((el) => (el.style.display = "none"));

  const options = {
    margin: 0.5,
    filename: "finance-report.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };

  html2pdf()
    .set(options)
    .from(element)
    .save()
    .then(() => {
      toHide.forEach((el) => (el.style.display = ""));
      if (originalDark) {
        document.body.classList.add("dark-mode");
      }
    });
};