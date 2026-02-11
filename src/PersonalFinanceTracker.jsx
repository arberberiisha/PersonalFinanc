import React, { useState, useEffect } from "react";
import { useTranslations } from "./LanguageContext";
import { AnimatePresence, motion } from "framer-motion";
import { Receipt, Wallet, Moon, Sun, Globe } from "lucide-react";

import BillGenerator from "./BillGenerator";
import PersonalFinance from "./PersonalFinance";
import "./App.css";

export default function PersonalFinanceTracker() {
  const { translations: t, language, setLanguage } = useTranslations();
  
  // Default to Bill Generator
  const [activeTab, setActiveTab] = useState('bill'); 
  const [darkMode, setDarkMode] = useState(false);

  // Force English on load (per your previous request)
  useEffect(() => {
    setLanguage('en');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle Body Class for Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  return (
    <div className="app-container">
      <div className="container py-4">
        
        {/* --- GLOBAL HEADER (Navigation) --- */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
             <div className="bg-card-theme p-2 rounded shadow-sm border">
                {activeTab === 'bill' ? <Receipt className="text-primary" size={28} /> : <Wallet className="text-primary" size={28} />}
             </div>
             <div>
               <h2 className="h4 mb-0 fw-bold">{t.title}</h2>
               <p className="text-muted small mb-0">Financial Management Suite</p>
             </div>
          </div>

          <div className="d-flex gap-3 align-items-center mt-3 mt-md-0">
             {/* MODE SWITCHER */}
             <div className="btn-group shadow-sm no-print">
                <button 
                  className={`btn ${activeTab === 'bill' ? 'btn-primary' : 'btn-white border'}`}
                  onClick={() => setActiveTab('bill')}
                >
                  <Receipt size={16}/> {t.generateBill}
                </button>
                <button 
                  className={`btn ${activeTab === 'finance' ? 'btn-primary' : 'btn-white border'}`}
                  onClick={() => setActiveTab('finance')}
                >
                  <Wallet size={16}/> {t.personalFinance}
                </button>
             </div>

             <div className="d-flex gap-2 no-print border-start ps-3">
                <button className="btn btn-white border rounded-circle p-2" onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button className="btn btn-white border rounded-circle p-2" onClick={() => setLanguage(language === "en" ? "sq" : "en")}>
                  <Globe size={18} />
                </button>
             </div>
          </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <AnimatePresence mode="wait">
          
          {/* VIEW 1: BILL GENERATOR (DEFAULT) */}
          {activeTab === 'bill' && (
             <motion.div 
               key="bill" 
               initial={{opacity: 0, x: -20}} 
               animate={{opacity: 1, x: 0}} 
               exit={{opacity: 0, x: 20}} 
               transition={{duration: 0.2}}
             >
                <BillGenerator t={t} darkMode={darkMode} />
             </motion.div>
          )}

          {/* VIEW 2: PERSONAL FINANCE TRACKER */}
          {activeTab === 'finance' && (
             <PersonalFinance darkMode={darkMode} />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}