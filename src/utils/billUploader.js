export const uploadBillImage = async ({ file, setEntries }) => {
    if (!file) return;
  
    const formData = new FormData();
    formData.append("bill", file);
  
    try {
      const res = await fetch("http://localhost:8080/api/analyze-bill", {
        method: "POST",
        body: formData,
      });
  
      const data = await res.json();
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
  
      setEntries((prev) => [
        ...prev,
        {
          type: "Expense",
          month: "January",
          category: parsed.category || "Bill",
          description: "",
          actual: parsed.actual || "0.00",
        },
      ]);
    } catch (err) {
      console.error("Failed to analyze bill", err);
      throw new Error("Failed to analyze bill.");
    }
  };
  