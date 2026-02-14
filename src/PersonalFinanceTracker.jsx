import React, { useState } from "react";
import { useTranslations } from "./LanguageContext";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Receipt, Wallet, Globe, Building2, Users,
  Phone, Mail, MapPin, Copyright, LogOut, ShieldAlert,
  User, Folder 
} from "lucide-react"; 

import LoginPage from "./auth/LoginPage"; 
import BillGenerator from "./BillGenerator";
import PersonalFinance from "./PersonalFinance";
import TaxAccountant from "./TaxAccountant"; 
import PayrollManager from "./PayrollManager"; 
import DocumentManager from "./features/DocumentManager";
import AdminPanel from "./features/AdminPanel";
import "./App.css";

export default function PersonalFinanceTracker() {
  const { translations: t, language, setLanguage } = useTranslations();
  
  // AUTH STATE
  const [user, setUser] = useState(null); 
  const [activeTab, setActiveTab] = useState('bill'); 

  // --- LOGIN LOGIC ---
  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === 'admin') {
        setActiveTab('admin');
    } else {
        setActiveTab('bill');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('bill');
  };

  // 1. IF NOT LOGGED IN -> SHOW LOGIN PAGE
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const getHeaderIcon = () => {
    switch(activeTab) {
      case 'bill': return <Receipt className="text-primary" size={28} />;
      case 'payroll': return <Users className="text-primary" size={28} />;
      case 'finance': return <Wallet className="text-primary" size={28} />;
      case 'tax': return <Building2 className="text-primary" size={28} />;
      case 'documents': return <Folder className="text-primary" size={28} />;
      case 'admin': return <ShieldAlert className="text-danger" size={28} />;
      default: return <Receipt className="text-primary" size={28} />;
    }
  };

  return (
    <div className="app-container d-flex flex-column min-vh-100 overflow-x-hidden bg-light">
      
      {/* 2. TOP BAR (Only visible when logged in) */}
      <div className="bg-white border-bottom py-2 px-3 mb-4 shadow-sm">
         <div className="container d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
                <div className={`p-1 rounded-circle ${user.role === 'admin' ? 'bg-danger bg-opacity-10' : 'bg-primary bg-opacity-10'}`}>
                    {user.role === 'admin' ? <ShieldAlert size={16} className="text-danger"/> : <User size={16} className="text-primary"/>}
                </div>
                <span className="small fw-bold text-dark">
                    {user.role === 'admin' ? 'Administrator Access' : `Welcome, ${user.name}`}
                </span>
            </div>
            <div className="d-flex align-items-center gap-3">
                <button className="btn btn-sm btn-light border-0" onClick={() => setLanguage(language === "en" ? "sq" : "en")}>
                    <Globe size={16} className="text-muted"/>
                </button>
                <button className="btn btn-sm btn-light text-danger fw-bold d-flex align-items-center gap-1" onClick={handleLogout}>
                    <LogOut size={14} /> Exit
                </button>
            </div>
         </div>
      </div>

      <div className="container py-2 flex-grow-1">
        
        {/* --- MAIN HEADER --- */}
        <div className="row g-3 align-items-center mb-4">
          <div className="col-auto me-auto">
            <div className="d-flex align-items-center gap-3">
                <div className="bg-white p-2 rounded shadow-sm border">
                   {getHeaderIcon()}
                </div>
                <div>
                  <h2 className="h4 mb-0 fw-bold text-dark">{t.appTitle}</h2>
                  <p className="text-muted small mb-0 d-none d-sm-block">
                      {user.role === 'admin' ? 'System Overview & Global Settings' : t.appSubtitle}
                  </p>
                </div>
            </div>
          </div>

          {/* 3. NAVIGATION (Reordered for Better Flow) */}
          <div className="col-12 col-md-auto">
              <div className="btn-group shadow-sm w-100 w-md-auto bg-white rounded overflow-hidden">
                
                {/* ADMIN TAB */}
                {user.role === 'admin' && (
                    <button 
                        className={`btn ${activeTab === 'admin' ? 'btn-danger text-white' : 'btn-white border-0 text-danger'}`}
                        onClick={() => setActiveTab('admin')}
                    >
                        <ShieldAlert size={16} className="d-none d-md-inline me-md-2"/> Admin
                    </button>
                )}

                {/* 1. REVENUE (Inflow) */}
                <button 
                  className={`btn ${activeTab === 'bill' ? 'btn-primary' : 'btn-white border-0'}`}
                  onClick={() => setActiveTab('bill')}
                >
                  <Receipt size={16} className="d-none d-md-inline me-md-2"/> {t.generateBill}
                </button>

                {/* 2. EXPENSES (Outflow) */}
                <button 
                  className={`btn ${activeTab === 'payroll' ? 'btn-primary' : 'btn-white border-0'}`}
                  onClick={() => setActiveTab('payroll')}
                >
                  <Users size={16} className="d-none d-md-inline me-md-2"/> {t.payroll || "Payroll"}
                </button>

                {/* 3. MANAGEMENT (Overview) */}
                <button 
                  className={`btn ${activeTab === 'finance' ? 'btn-primary' : 'btn-white border-0'}`}
                  onClick={() => setActiveTab('finance')}
                >
                  <Wallet size={16} className="d-none d-md-inline me-md-2"/> {t.personalFinance}
                </button>

                {/* 4. COMPLIANCE (Reporting) */}
                <button 
                  className={`btn ${activeTab === 'tax' ? 'btn-primary' : 'btn-white border-0'}`}
                  onClick={() => setActiveTab('tax')}
                >
                  <Building2 size={16} className="d-none d-md-inline me-md-2"/> {t.taxAccountant}
                </button>
                
                {/* 5. RECORDS (Storage) */}
                <button 
                  className={`btn ${activeTab === 'documents' ? 'btn-primary' : 'btn-white border-0'}`}
                  onClick={() => setActiveTab('documents')}
                >
                  <Folder size={16} className="d-none d-md-inline me-md-2"/> Documents
                </button>
              </div>
          </div>
        </div>

        {/* --- DYNAMIC CONTENT --- */}
        <AnimatePresence mode="wait">
          
          {activeTab === 'admin' && user.role === 'admin' && (
             <motion.div key="admin" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.2}}>
                <AdminPanel />
             </motion.div>
          )}

          {activeTab === 'bill' && (
             <motion.div key="bill" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.2}}>
                <BillGenerator />
             </motion.div>
          )}

          {activeTab === 'payroll' && (
             <motion.div key="payroll" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.2}}>
                <PayrollManager />
             </motion.div>
          )}

          {activeTab === 'finance' && (
             <motion.div key="finance" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.2}}>
                <PersonalFinance />
             </motion.div>
          )}

          {activeTab === 'tax' && (
             <motion.div key="tax" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.2}}>
                <TaxAccountant />
             </motion.div>
          )}
          
          {activeTab === 'documents' && (
             <motion.div key="documents" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.2}}>
                <DocumentManager />
             </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* --- FOOTER --- */}
      <footer className="mt-auto py-4 border-top bg-white no-print">
        <div className="container">
          <div className="row g-4 justify-content-between align-items-center">
            <div className="col-md-4 text-center text-md-start">
              <h5 className="fw-bold text-primary mb-1">RB Tech</h5>
              <p className="text-muted small mb-0">Empowering your business with smart financial tools.</p>
            </div>
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
              </div>
            </div>
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