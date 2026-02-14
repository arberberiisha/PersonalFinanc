import React, { useState } from "react";
import { User, Lock, Mail, ArrowRight, ShieldCheck, Briefcase } from "lucide-react";

export default function LoginPage({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate Logic: Check if email contains "admin"
    const role = email.toLowerCase().includes("admin") ? "admin" : "customer";
    const name = email.split("@")[0];
    
    // Pass user data back to App.jsx
    onLogin({ name, email, role });
  };

  const demoLogin = (type) => {
      if(type === 'admin') {
          onLogin({ name: "System Admin", email: "admin@rbtech.com", role: "admin" });
      } else {
          onLogin({ name: "Hekuran Bajrami", email: "Hekuran@business.com", role: "customer" });
      }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card border-0 shadow-lg p-4 rounded-4" style={{ maxWidth: "420px", width: "100%" }}>
        
        {/* Logo / Header */}
        <div className="text-center mb-4">
          <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
            <Briefcase size={32} className="text-primary" />
          </div>
          <h3 className="fw-bold text-dark mb-1">{isRegistering ? "Create Account" : "FinTrack 24"}</h3>
          <p className="text-muted small">
            {isRegistering ? "Join the financial ecosystem." : "Sign in to manage your business."}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="mb-3">
              <div className="input-group border rounded-3 overflow-hidden shadow-sm">
                <span className="input-group-text bg-white border-0"><User size={18} className="text-muted"/></span>
                <input type="text" className="form-control border-0" placeholder="Full Name" required />
              </div>
            </div>
          )}

          <div className="mb-3">
            <div className="input-group border rounded-3 overflow-hidden shadow-sm">
              <span className="input-group-text bg-white border-0"><Mail size={18} className="text-muted"/></span>
              <input 
                type="email" 
                className="form-control border-0" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="input-group border rounded-3 overflow-hidden shadow-sm">
              <span className="input-group-text bg-white border-0"><Lock size={18} className="text-muted"/></span>
              <input 
                type="password" 
                className="form-control border-0" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 fw-bold py-2 rounded-3 shadow-sm mb-3">
            {isRegistering ? "Sign Up" : "Secure Login"} <ArrowRight size={18} className="ms-2"/>
          </button>
        </form>

        <div className="text-center border-bottom pb-4 mb-4">
          <p className="small text-muted mb-0">
            {isRegistering ? "Already have an account?" : "New to FinTrack?"}
            <button 
              className="btn btn-link text-primary fw-bold p-0 ms-1 text-decoration-none"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Login" : "Register"}
            </button>
          </p>
        </div>

        {/* --- DEMO SECTION (FOR YOUR PRESENTATION) --- */}
        <div className="bg-light p-3 rounded-3 border border-dashed text-center">
            <p className="extra-small fw-bold text-uppercase text-muted mb-2 tracking-widest">⚡ Quick Demo Access</p>
            <div className="d-flex gap-2">
                <button className="btn btn-sm btn-white border shadow-sm w-50 d-flex align-items-center justify-content-center gap-2" onClick={() => demoLogin('customer')}>
                    <User size={14} className="text-success"/> Customer
                </button>
                <button className="btn btn-sm btn-white border shadow-sm w-50 d-flex align-items-center justify-content-center gap-2" onClick={() => demoLogin('admin')}>
                    <ShieldCheck size={14} className="text-danger"/> Admin
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}