import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "./LanguageContext";
import { ProductProvider } from "./ProductContext";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Receipt, Wallet, Globe, Building2, Users,
  Phone, Mail, Copyright, LogOut, ShieldAlert,
  User, Folder, PieChart, Briefcase, LayoutDashboard, Package,
  Menu, X 
} from "lucide-react"; 

import LoginPage from "./auth/LoginPage"; 
import BillGenerator from "./BillGenerator";
import PersonalFinance from "./PersonalFinance";
import TaxAccountant from "./TaxAccountant"; 
import PayrollManager from "./PayrollManager"; 
import BudgetManager from "./features/BudgetManager"; 
import DocumentManager from "./features/DocumentManager";
import AdminPanel from "./features/AdminPanel";
import ManagerDashboard from "./features/ManagerDashboard";
import WorkerManagement from "./features/WorkerManagement";
import ProductManager from "./features/ProductManager"; 

import "./App.css";

export default function PersonalFinanceTracker() {
  const { translations: t, language, setLanguage } = useTranslations();
  
  // AUTH STATE
  const [user, setUser] = useState(null); 
  const [activeTab, setActiveTab] = useState('bill'); 
  
  // MOBILE MENU STATE (Fixed: Controlled by React now)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Ref for main content scrolling
  const contentRef = useRef(null);

  // Scroll to top when tab changes
  useEffect(() => {
    if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // --- LOGIN LOGIC ---
  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === 'admin') setActiveTab('admin');
    else if (userData.role === 'worker') setActiveTab('bill');
    else setActiveTab('dashboard'); 
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('bill');
    setIsMobileMenuOpen(false);
  };

  if (!user) {
    return (
        <ProductProvider>
            <LoginPage onLogin={handleLogin} />
        </ProductProvider>
    );
  }

  // --- RBAC ---
  const canAccess = (tabName) => {
    const role = user.role;
    if (role === 'admin') return true; 

    const permissions = {
        'dashboard': ['manager', 'personal'],
        'workers':   ['manager'], 
        'products':  ['manager', 'personal'], 
        'bill':      ['manager', 'personal', 'worker'],
        'payroll':   ['manager', 'personal'],
        'finance':   ['manager', 'personal'],
        'budget':    ['manager', 'personal'],
        'tax':       ['manager', 'personal'],
        'documents': ['manager', 'personal', 'worker'], // Worker is included here
        'admin':     [] 
    };

    return permissions[tabName]?.includes(role);
  };

  const getTabTitle = () => {
      switch(activeTab) {
          case 'dashboard': return "Overview";
          case 'workers': return "Team Management";
          case 'products': return "Inventory";
          case 'bill': return t.generateBill;
          case 'budget': return "Budgeting";
          case 'documents': return "Documents";
          case 'finance': return "Cash Flow";
          case 'payroll': return "Payroll";
          case 'tax': return "Taxes";
          case 'admin': return "Admin Panel";
          default: return t.appTitle;
      }
  };

  // --- NAVIGATION BUTTON COMPONENT ---
  const NavButton = ({ id, icon: Icon, label, danger = false }) => {
      if (!canAccess(id)) return null;
      const isActive = activeTab === id;
      
      return (
          <button 
              key={id}
              onClick={() => {
                  setActiveTab(id);
                  setIsMobileMenuOpen(false); // Close menu on click
              }}
              className={`btn w-100 text-start d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded-3 transition-all ${
                  isActive 
                    ? (danger ? 'btn-danger text-white shadow-sm' : 'btn-primary text-white shadow-sm') 
                    : (danger ? 'btn-light text-danger bg-transparent hover-bg-light' : 'btn-light text-muted bg-transparent hover-bg-light text-dark-hover')
              }`}
          >
              <Icon size={20} className={isActive ? 'text-white' : (danger ? 'text-danger' : 'text-primary opacity-75')}/>
              <span className={`fw-medium ${isActive ? '' : 'text-dark'}`}>{label}</span>
          </button>
      );
  };

  const menuItems = [
      { header: "Main Menu" },
      { id: "admin", icon: ShieldAlert, label: "Admin Panel", danger: true },
      { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { id: "bill", icon: Receipt, label: t.generateBill },
      { id: "products", icon: Package, label: "Inventory" },
      { id: "finance", icon: Wallet, label: t.personalFinance },
      { header: "Management" },
      { id: "workers", icon: Briefcase, label: "Staff / HR" },
      { id: "payroll", icon: Users, label: t.payroll || "Payroll" },
      { id: "budget", icon: PieChart, label: "Budgeting" },
      { id: "tax", icon: Building2, label: t.taxAccountant },
      { id: "documents", icon: Folder, label: "Documents" },
  ];

  return (
    <ProductProvider>
        <div className="d-flex min-vh-100 bg-light overflow-hidden">
            
            {/* --- 1. LEFT SIDEBAR (Desktop) --- */}
            <aside className="d-none d-lg-flex flex-column bg-white border-end shadow-sm p-3" 
                   style={{width: '280px', minWidth: '280px', height: '100vh', position: 'sticky', top: 0}}>
                
                <div className="d-flex align-items-center gap-3 px-2 mb-5 mt-2">
                    <div className="bg-primary p-2 rounded-3 text-white shadow-sm"><Wallet size={24}/></div>
                    <div>
                        <h5 className="fw-bold text-dark mb-0 tracking-tight" style={{lineHeight: '1'}}>RB Tech</h5>
                        <small className="text-muted extra-small text-uppercase tracking-wider">Finance Suite</small>
                    </div>
                </div>

                <div className="bg-light p-3 rounded-4 mb-4 border border-light-subtle">
                    <div className="d-flex align-items-center gap-3 mb-2">
                        <div className={`p-2 rounded-circle ${user.role === 'admin' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-primary bg-opacity-10 text-primary'}`}>
                            {user.role === 'admin' ? <ShieldAlert size={18}/> : <User size={18}/>}
                        </div>
                        <div className="overflow-hidden">
                            <h6 className="fw-bold text-dark mb-0 text-truncate">{user.name}</h6>
                            <small className="text-muted text-capitalize" style={{fontSize: '11px'}}>{user.role}</small>
                        </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                        <button className="btn btn-xs btn-white border shadow-sm flex-grow-1" onClick={() => setLanguage(language === "en" ? "sq" : "en")}>
                            <Globe size={12} className="me-1"/> {language.toUpperCase()}
                        </button>
                        <button className="btn btn-xs btn-white border shadow-sm text-danger flex-grow-1" onClick={handleLogout}>
                            <LogOut size={12} className="me-1"/> Exit
                        </button>
                    </div>
                </div>

                <div className="flex-grow-1 d-flex flex-column gap-1 overflow-y-auto no-scrollbar">
                    {menuItems.map((item, idx) => 
                        item.header ? (
                            <small key={idx} className="text-muted fw-bold text-uppercase extra-small px-3 mb-2 mt-2">{item.header}</small>
                        ) : (
                            <NavButton key={item.id} {...item} />
                        )
                    )}
                </div>

                <div className="mt-auto pt-3 border-top text-center">
                    <small className="text-muted extra-small">© {new Date().getFullYear()} RB Tech v2.2</small>
                </div>
            </aside>

            {/* --- 2. MAIN CONTENT AREA --- */}
            <main className="flex-grow-1 d-flex flex-column h-100 overflow-hidden position-relative">
                
                {/* Mobile Header */}
                <div className="d-lg-none bg-white border-bottom p-3 d-flex justify-content-between align-items-center shadow-sm sticky-top z-3">
                    <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary p-1 rounded text-white"><Wallet size={18}/></div>
                        <span className="fw-bold text-dark">RB Tech</span>
                    </div>
                    <div className="d-flex gap-3 align-items-center">
                        <button className="btn btn-light btn-sm" onClick={() => setLanguage(language === "en" ? "sq" : "en")}><Globe size={16}/></button>
                        <button className="btn btn-primary btn-sm" onClick={() => setIsMobileMenuOpen(true)}><Menu size={18}/></button>
                    </div>
                </div>

                {/* --- MOBILE OFFCANVAS (React Controlled) --- */}
                {/* Backdrop */}
                {isMobileMenuOpen && (
                    <div 
                        className="modal-backdrop fade show" 
                        style={{zIndex: 1040}} 
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>
                )}

                {/* Menu Panel */}
                <div 
                    className={`offcanvas offcanvas-start d-lg-none ${isMobileMenuOpen ? 'show' : ''}`} 
                    tabIndex="-1" 
                    style={{visibility: isMobileMenuOpen ? 'visible' : 'hidden', zIndex: 1045}}
                >
                    <div className="offcanvas-header border-bottom">
                        <div className="d-flex align-items-center gap-2">
                            <div className="bg-primary p-1 rounded text-white"><Wallet size={18}/></div>
                            <h5 className="offcanvas-title fw-bold text-dark">Menu</h5>
                        </div>
                        <button type="button" className="btn-close text-reset" onClick={() => setIsMobileMenuOpen(false)}></button>
                    </div>
                    <div className="offcanvas-body d-flex flex-column gap-2">
                        {menuItems.map((item, idx) => 
                            item.header ? (
                                <small key={idx} className="text-muted fw-bold text-uppercase extra-small px-3 mb-2 mt-2">{item.header}</small>
                            ) : (
                                <NavButton key={item.id} {...item} />
                            )
                        )}
                        <hr className="my-3"/>
                        <button className="btn btn-light text-danger w-100 d-flex align-items-center gap-2 justify-content-center" onClick={handleLogout}>
                            <LogOut size={18}/> Sign Out
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div ref={contentRef} className="p-3 p-lg-5 flex-grow-1 overflow-y-auto" style={{height: '100vh'}}>
                    <div className="container-fluid px-0" style={{maxWidth: '1400px', margin: '0 auto'}}>
                        
                        {/* Page Header */}
                        <header className="mb-4 d-flex align-items-center justify-content-between">
                            <div>
                                <h2 className="fw-bold text-dark mb-1">{getTabTitle()}</h2>
                                <p className="text-muted small mb-0">
                                    {activeTab === 'dashboard' ? `Welcome back, ${user.name}!` : 'Manage your business efficiently.'}
                                </p>
                            </div>
                            <div className="d-none d-md-block text-end">
                                <span className="badge bg-white text-muted border shadow-sm py-2 px-3 fw-normal">
                                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                        </header>

                        {/* Modules */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'dashboard' && canAccess('dashboard') && <motion.div key="dashboard" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}><ManagerDashboard /></motion.div>}
                            {activeTab === 'products' && canAccess('products') && <motion.div key="products" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}><ProductManager /></motion.div>}
                            {activeTab === 'workers' && canAccess('workers') && <motion.div key="workers" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}><WorkerManagement /></motion.div>}
                            {activeTab === 'admin' && user.role === 'admin' && <motion.div key="admin" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}><AdminPanel /></motion.div>}
                            {activeTab === 'bill' && <motion.div key="bill" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}><BillGenerator userRole={user.role} userName={user.name} /></motion.div>}
                            {activeTab === 'payroll' && <motion.div key="payroll" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}><PayrollManager /></motion.div>}
                            {activeTab === 'finance' && <motion.div key="finance" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}><PersonalFinance /></motion.div>}
                            {activeTab === 'budget' && <motion.div key="budget" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}><BudgetManager /></motion.div>}
                            {activeTab === 'tax' && <motion.div key="tax" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}><TaxAccountant /></motion.div>}
                            {activeTab === 'documents' && <motion.div key="documents" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}><DocumentManager userRole={user.role} userName={user.name} /></motion.div>}
                        </AnimatePresence>

                    </div>
                </div>
            </main>
        </div>
    </ProductProvider>
  );
}