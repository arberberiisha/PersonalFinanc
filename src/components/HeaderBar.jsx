import React from "react";

export default function HeaderBar({ t, darkMode, setDarkMode, language, setLanguage }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-2">
      <h1 className="flex-grow-1 text-center m-0">{t.title}</h1>
      <div className="d-flex gap-2 no-print">
        <button
          className={`btn ${darkMode ? "btn-light" : "btn-dark"}`}
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? t.lightMode : t.darkMode}
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => setLanguage(language === "en" ? "sq" : "en")}
        >
          🌐 {language === "en" ? "Shqip" : "English"}
        </button>
      </div>
    </div>
  );
}
