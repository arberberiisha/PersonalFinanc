import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, AlertTriangle, 
  Plus, Trash2, Target
} from "lucide-react";
import { useTranslations } from "../LanguageContext";

const BudgetManager = () => {
  const { translations: t, language } = useTranslations();
  const isSq = language === 'sq';

  // Mock Data
  const [budgets, setBudgets] = useState([
    { id: 1, category: "Fuel (Nafta)", limit: 500, spent: 450 },
    { id: 2, category: "Office Rent", limit: 1200, spent: 1200 },
    { id: 3, category: "Client Meals", limit: 200, spent: 45 },
    { id: 4, category: "Marketing", limit: 1000, spent: 150 },
  ]);

  const [newBudget, setNewBudget] = useState({ category: "", limit: "" });

  // --- ANALYSIS LOGIC ---
  const currentDay = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const monthProgress = (currentDay / daysInMonth) * 100;

  const getHealthStatus = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    
    if (percentage >= 100) return { status: "critical", color: "bg-danger", text: isSq ? "Tejkalim!" : "Over Budget!" };
    if (percentage > monthProgress + 20) return { status: "warning", color: "bg-warning", text: isSq ? "Rrezik i lartë" : "High Pace" };
    if (percentage > monthProgress) return { status: "caution", color: "bg-info", text: isSq ? "Mesatar" : "Moderate" };
    return { status: "safe", color: "bg-success", text: isSq ? "Në kontroll" : "On Track" };
  };

  const totalBudget = budgets.reduce((acc, b) => acc + Number(b.limit), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spent), 0);
  const totalForecast = budgets.reduce((acc, b) => acc + (b.spent / currentDay) * daysInMonth, 0);

  const addBudget = () => {
    if (newBudget.category && newBudget.limit) {
      setBudgets([...budgets, { id: Date.now(), category: newBudget.category, limit: Number(newBudget.limit), spent: 0 }]);
      setNewBudget({ category: "", limit: "" });
    }
  };

  return (
    <div className="container mt-4 mb-5">
      
      {/* 1. EXECUTIVE SUMMARY CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
           <div className="p-4 bg-white rounded-4 shadow-sm border-start border-primary border-4 h-100">
              <div className="d-flex align-items-center gap-3 mb-2">
                 <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary"><Target size={20}/></div>
                 <span className="text-muted small fw-bold uppercase">{isSq ? "Buxheti Total" : "Total Budget"}</span>
              </div>
              <h2 className="fw-bold text-dark mb-0">€{totalBudget.toLocaleString()}</h2>
              <div className="progress mt-3" style={{height: '6px'}}>
                 <div className="progress-bar bg-primary" style={{width: `${(totalSpent/totalBudget)*100}%`}}></div>
              </div>
              <small className="text-muted mt-2 d-block">{((totalSpent/totalBudget)*100).toFixed(1)}% {isSq ? "e përdorur" : "used"}</small>
           </div>
        </div>
        <div className="col-md-4">
           <div className="p-4 bg-white rounded-4 shadow-sm border-start border-warning border-4 h-100">
              <div className="d-flex align-items-center gap-3 mb-2">
                 <div className="bg-warning bg-opacity-10 p-2 rounded-circle text-warning-emphasis"><TrendingUp size={20}/></div>
                 <span className="text-muted small fw-bold uppercase">{isSq ? "Parashikimi (Fund Muaji)" : "Forecast (End of Month)"}</span>
              </div>
              <h2 className="fw-bold text-dark mb-0">€{totalForecast.toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
              <small className={`mt-2 d-block fw-bold ${totalForecast > totalBudget ? 'text-danger' : 'text-success'}`}>
                 {totalForecast > totalBudget 
                    ? (isSq ? `⚠️ Do tejkaloni buxhetin me €${(totalForecast - totalBudget).toFixed(0)}` : `⚠️ Will exceed budget by €${(totalForecast - totalBudget).toFixed(0)}`)
                    : (isSq ? `✅ Do kurseni €${(totalBudget - totalForecast).toFixed(0)}` : `✅ Will save €${(totalBudget - totalForecast).toFixed(0)}`)
                 }
              </small>
           </div>
        </div>
        <div className="col-md-4">
           {/* FIXED: Removed bg-dark, added professional indigo gradient */}
           <div className="p-4 rounded-4 shadow-sm h-100 position-relative overflow-hidden text-white" 
                style={{background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)'}}>
              <div className="position-relative z-10">
                 <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="bg-white bg-opacity-20 p-2 rounded-circle text-white"><AlertTriangle size={20}/></div>
                    <span className="text-white text-opacity-75 small fw-bold uppercase">{isSq ? "Statusi i Shpenzimeve" : "Spending Status"}</span>
                 </div>
                 <h2 className="fw-bold mb-0">{budgets.filter(b => b.spent > b.limit).length} <span className="fs-6 text-white text-opacity-50">Alerts</span></h2>
                 <p className="small text-white text-opacity-75 mt-2 mb-0">
                    {isSq ? "Kategoritë që kërkojnë vëmendje të menjëhershme." : "Categories requiring immediate attention."}
                 </p>
              </div>
              {/* Decorative Background Icon */}
              <Target className="position-absolute bottom-0 end-0 text-white text-opacity-10" size={120} style={{transform: 'translate(30%, 30%)'}}/>
           </div>
        </div>
      </div>

      {/* 2. BUDGET CONTROL LIST */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-4 p-md-5">
           <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
              <div>
                 <h4 className="fw-bold text-dark mb-1">{isSq ? "Menaxhimi i Buxhetit" : "Budget Control"}</h4>
                 <p className="text-muted small mb-0">{isSq ? "Monitoroni shpenzimet në kohë reale." : "Monitor expenses against limits in real-time."}</p>
              </div>
           </div>

           {/* Add New Budget */}
           <div className="row g-3 mb-5 align-items-end bg-light p-3 rounded-4 border border-dashed">
              <div className="col-md-5">
                 <label className="small fw-bold text-muted mb-1">{isSq ? "Kategoria" : "Category"}</label>
                 <input type="text" className="form-control border-0 shadow-sm" placeholder="e.g. Travel, Marketing..." 
                    value={newBudget.category} onChange={e => setNewBudget({...newBudget, category: e.target.value})}/>
              </div>
              <div className="col-md-4">
                 <label className="small fw-bold text-muted mb-1">{isSq ? "Limiti Mujor (€)" : "Monthly Limit (€)"}</label>
                 <input type="number" className="form-control border-0 shadow-sm" placeholder="0.00" 
                    value={newBudget.limit} onChange={e => setNewBudget({...newBudget, limit: e.target.value})}/>
              </div>
              <div className="col-md-3">
                 <button className="btn btn-primary w-100 fw-bold shadow-sm" onClick={addBudget}>
                    <Plus size={18} className="me-1"/> {isSq ? "Shto Limit" : "Set Limit"}
                 </button>
              </div>
           </div>

           {/* Budget List */}
           <div className="d-flex flex-column gap-4">
              <AnimatePresence>
                 {budgets.map((b) => {
                    const health = getHealthStatus(b.spent, b.limit);
                    const percent = Math.min((b.spent / b.limit) * 100, 100);
                    
                    return (
                       <motion.div key={b.id} layout initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="group">
                          <div className="d-flex justify-content-between align-items-end mb-2">
                             <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold text-dark">{b.category}</span>
                                <span className={`badge ${health.color} bg-opacity-10 text-${health.color.replace('bg-', '')} border border-${health.color.replace('bg-', '')} border-opacity-25 extra-small`}>
                                   {health.text}
                                </span>
                             </div>
                             <div className="text-end">
                                <span className="fw-bold text-dark">€{b.spent}</span>
                                <span className="text-muted small"> / €{b.limit}</span>
                             </div>
                          </div>
                          
                          <div className="progress" style={{height: '10px', borderRadius: '6px', backgroundColor: '#f1f5f9'}}>
                             <div 
                                className={`progress-bar ${health.color} ${health.status === 'critical' ? 'progress-bar-striped progress-bar-animated' : ''}`} 
                                role="progressbar" 
                                style={{width: `${percent}%`, transition: 'width 1s ease'}}
                             ></div>
                             <div 
                                className="position-absolute border-start border-dark border-2 opacity-25" 
                                style={{left: `${monthProgress}%`, height: '10px', marginTop: '-10px'}}
                                title="Today"
                             ></div>
                          </div>
                          
                          <div className="d-flex justify-content-between mt-1">
                             <small className="text-muted extra-small">{percent.toFixed(0)}% Used</small>
                             <small className="text-muted extra-small cursor-pointer text-danger opacity-0 group-hover-opacity-100 transition-all" onClick={() => setBudgets(budgets.filter(i => i.id !== b.id))}>
                                <Trash2 size={12} className="me-1"/> Remove
                             </small>
                          </div>
                       </motion.div>
                    );
                 })}
              </AnimatePresence>
           </div>

        </div>
      </motion.div>
    </div>
  );
};

export default BudgetManager;