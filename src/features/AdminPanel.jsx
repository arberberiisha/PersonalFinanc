import React from "react";
import { Users, TrendingUp, AlertTriangle, Activity } from "lucide-react";

const AdminPanel = () => {
  return (
    <div className="dashboard-card p-4 p-md-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
            <h2 className="fw-bold text-dark mb-1">Admin Control Center</h2>
            <p className="text-muted">Global system monitoring and compliance management.</p>
        </div>
        <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill">SUPER ADMIN ACCESS</span>
      </div>

      {/* Stats Row */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
            <div className="p-4 bg-light rounded-4 border-start border-primary border-4 h-100">
                <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small fw-bold uppercase">Total Users</span>
                    <Users size={20} className="text-primary"/>
                </div>
                <h2 className="fw-bold mb-0">1,240</h2>
                <small className="text-success fw-bold">+12 this week</small>
            </div>
        </div>
        <div className="col-md-3">
            <div className="p-4 bg-light rounded-4 border-start border-success border-4 h-100">
                <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small fw-bold uppercase">Total Revenue Processed</span>
                    <TrendingUp size={20} className="text-success"/>
                </div>
                <h2 className="fw-bold mb-0">€4.2M</h2>
                <small className="text-muted">Year to date</small>
            </div>
        </div>
        <div className="col-md-3">
            <div className="p-4 bg-light rounded-4 border-start border-warning border-4 h-100">
                <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small fw-bold uppercase">Compliance Alerts</span>
                    <AlertTriangle size={20} className="text-warning"/>
                </div>
                <h2 className="fw-bold mb-0">3</h2>
                <small className="text-danger fw-bold">Requires Action</small>
            </div>
        </div>
        <div className="col-md-3">
            <div className="p-4 bg-light rounded-4 border-start border-info border-4 h-100">
                <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small fw-bold uppercase">System Health</span>
                    <Activity size={20} className="text-info"/>
                </div>
                <h2 className="fw-bold mb-0">99.9%</h2>
                <small className="text-success">Operational</small>
            </div>
        </div>
      </div>

      {/* Global Config */}
      <h5 className="fw-bold text-dark mb-3">Global Configuration</h5>
      <div className="p-4 bg-white border rounded-4 shadow-sm">
         <div className="row align-items-center">
            <div className="col-md-8">
                <h6 className="fw-bold mb-1">Global VAT Rate (ATK)</h6>
                <p className="text-muted small mb-0">Updating this will instantly change the calculation for all 1,240 users.</p>
            </div>
            <div className="col-md-4 text-end">
                <div className="input-group w-50 ms-auto">
                    <input type="number" className="form-control" value="18" readOnly />
                    <span className="input-group-text">%</span>
                    <button className="btn btn-primary">Update</button>
                </div>
            </div>
         </div>
      </div>

    </div>
  );
};

export default AdminPanel;