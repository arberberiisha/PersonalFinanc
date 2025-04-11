import React, { createContext, useState, useContext } from "react";
import en from "./locales/en.json";
import sq from "./locales/sq.json";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");
  const translations = language === "en" ? en : sq;

  return (
    <LanguageContext.Provider value={{ translations, language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslations = () => useContext(LanguageContext);
