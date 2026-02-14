import React, { useState, useEffect } from "react";
import { useTranslations } from "./LanguageContext";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Receipt, Wallet, Moon, Sun, Globe, Building2, Users,
  Phone, Mail, MapPin, Copyright 
} from "lucide-react"; 

import BillGenerator from "./BillGenerator";
import PersonalFinance from "./PersonalFinance";
import TaxAccountant from "./TaxAccountant"; 
import PayrollManager from "./PayrollManager"; // <--- ADDED THIS IMPORT
import "./App.css";

export default function PersonalFinanceTracker() {
  const { translations: t, language, setLanguage } = useTranslations();
  
  // Default to Bill Generator
  const [activeTab, setActiveTab] = useState('bill'); 
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  const getHeaderIcon = () => {
    switch(activeTab) {
      case 'bill': return <Receipt className="text-primary" size={28} />;
      case 'finance': return <Wallet className="text-primary" size={28} />;
      case 'tax': return <Building2 className="text-primary" size={28} />;
      case 'payroll': return <Users className="text-primary" size={28} />; // <--- ADDED ICON
      default: return <Receipt className="text-primary" size={28} />;
    }
  };

  return (
    <div className="app-container d-flex flex-column min-vh-100">
      <div className="container py-4 flex-grow-1">
        
        {/* --- GLOBAL HEADER (Navigation) --- */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
             <div className="bg-card-theme p-2 rounded shadow-sm border">
                {getHeaderIcon()}
             </div>
             <div>
               <h2 className="h4 mb-0 fw-bold">{t.appTitle}</h2>
               <p className="text-muted small mb-0">{t.appSubtitle}</p>
             </div>
          </div>

          <div className="d-flex gap-3 align-items-center mt-3 mt-md-0">
             {/* MODE SWITCHER */}
             <div className="btn-group shadow-sm no-print">
                <button 
                  className={`btn ${activeTab === 'bill' ? 'btn-primary' : 'btn-white border'}`}
                  onClick={() => setActiveTab('bill')}
                >
                  <Receipt size={16} className="d-none d-md-inline me-md-2"/> {t.generateBill}
                </button>
                <button 
                  className={`btn ${activeTab === 'finance' ? 'btn-primary' : 'btn-white border'}`}
                  onClick={() => setActiveTab('finance')}
                >
                  <Wallet size={16} className="d-none d-md-inline me-md-2"/> {t.personalFinance}
                </button>
                <button 
                  className={`btn ${activeTab === 'tax' ? 'btn-primary' : 'btn-white border'}`}
                  onClick={() => setActiveTab('tax')}
                >
                  <Building2 size={16} className="d-none d-md-inline me-md-2"/> {t.taxAccountant}
                </button>
                {/* --- ADDED PAYROLL BUTTON --- */}
                <button 
                  className={`btn ${activeTab === 'payroll' ? 'btn-primary' : 'btn-white border'}`}
                  onClick={() => setActiveTab('payroll')}
                >
                  <Users size={16} className="d-none d-md-inline me-md-2"/> {t.payroll || "Payroll"}
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
          
          {/* VIEW 1: BILL GENERATOR */}
          {activeTab === 'bill' && (
             <motion.div key="bill" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} transition={{duration: 0.2}}>
                <BillGenerator t={t} darkMode={darkMode} />
             </motion.div>
          )}

          {/* VIEW 2: PERSONAL FINANCE */}
          {activeTab === 'finance' && (
             <motion.div key="finance" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} transition={{duration: 0.2}}>
                <PersonalFinance darkMode={darkMode} />
             </motion.div>
          )}

          {/* VIEW 3: TAX ACCOUNTANT */}
          {activeTab === 'tax' && (
             <motion.div key="tax" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} transition={{duration: 0.2}}>
                <TaxAccountant darkMode={darkMode} />
             </motion.div>
          )}

          {/* VIEW 4: PAYROLL MANAGER (ADDED) */}
          {activeTab === 'payroll' && (
             <motion.div key="payroll" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} transition={{duration: 0.2}}>
                <PayrollManager />
             </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* --- FOOTER --- */}
      <footer className="mt-auto py-4 border-top bg-card-theme no-print">
        <div className="container">
          <div className="row g-4 justify-content-between align-items-center">
            
            {/* Column 1: Brand */}
            <div className="col-md-4 text-center text-md-start">
              <h5 className="fw-bold text-primary mb-1">RB Tech</h5>
              <p className="text-muted small mb-0">Empowering your business with smart financial tools.</p>
            </div>

            {/* Column 2: Contact Info */}
            <div className="col-md-5">
              <div className="d-flex flex-wrap justify-content-center justify-content-md-end gap-4">
                <div className="d-flex align-items-center gap-2 text-muted small">
                  <Phone size={16} className="text-primary"/>
                  <span>+383 44 722 066</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-muted small">
                  <Mail size={16} className="text-primary"/>
                  <span>rbsoftware.tech@gmail.com</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-muted small">
                  <MapPin size={16} className="text-primary"/>
                  <span>Pristina, Kosovo</span>
                </div>
              </div>
            </div>

            {/* Column 3: Copyright */}
            <div className="col-12 text-center border-top pt-3 mt-3 d-flex justify-content-center align-items-center text-muted small">
              <Copyright size={14} className="me-1"/> 
              <span>{new Date().getFullYear()} RB Tech. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}