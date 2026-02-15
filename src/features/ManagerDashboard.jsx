import React from "react";
import { 
  Users, TrendingUp, CreditCard, 
  ArrowUpRight, Activity, Calendar 
} from "lucide-react";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

const ManagerDashboard = () => {
  
  // DUMMY DATA: Aggregated from all workers
  const stats = {
    revenue: 24500,
    growth: 12.5,
    workers: 4,
    pendingInvoices: 8
  };

  const revenueData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5500 },
    { name: 'Apr', value: 4800 },
    { name: 'May', value: 7200 },
  ];

  const recentActivity = [
    { id: 1, user: "Hekuran Worker", action: "Created Invoice #INV-204", amount: "€450.00", time: "2 hours ago" },
    { id: 2, user: "Arber Worker", action: "Created Invoice #INV-205", amount: "€1,200.00", time: "4 hours ago" },
    { id: 3, user: "Hekuran Worker", action: "Marked #INV-199 as Paid", amount: "€320.00", time: "1 day ago" },
    { id: 4, user: "System", action: "Monthly Tax Report Generated", amount: "-", time: "2 days ago" },
  ];

  return (
    <div className="container mt-2">
      
      {/* 1. WELCOME SECTION */}
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
            <h6 className="text-muted text-uppercase small fw-bold mb-1">Overview</h6>
            <h3 className="fw-bold text-dark mb-0">Company Performance</h3>
        </div>
        <div className="d-flex gap-2">
            <button className="btn btn-white border shadow-sm text-muted d-flex align-items-center gap-2">
                <Calendar size={16}/> This Month
            </button>
            <button className="btn btn-primary shadow-sm d-flex align-items-center gap-2">
                <Activity size={16}/> Generate Report
            </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
            <div className="p-4 bg-white rounded-4 shadow-sm border-start border-primary border-4 h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span className="text-muted small fw-bold text-uppercase">Total Revenue</span>
                        <h2 className="fw-bold text-dark mb-0 mt-1">€{stats.revenue.toLocaleString()}</h2>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary">
                        <TrendingUp size={20}/>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-2 mt-2">
                    <span className="badge bg-success bg-opacity-10 text-success d-flex align-items-center gap-1">
                        <ArrowUpRight size={12}/> {stats.growth}%
                    </span>
                    <span className="text-muted extra-small">vs last month</span>
                </div>
            </div>
        </div>

        <div className="col-md-4">
            <div className="p-4 bg-white rounded-4 shadow-sm border-start border-info border-4 h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span className="text-muted small fw-bold text-uppercase">Active Workers</span>
                        <h2 className="fw-bold text-dark mb-0 mt-1">{stats.workers}</h2>
                    </div>
                    <div className="bg-info bg-opacity-10 p-2 rounded-circle text-info">
                        <Users size={20}/>
                    </div>
                </div>
                <small className="text-muted">3 Active now • 1 Offline</small>
            </div>
        </div>

        <div className="col-md-4">
            <div className="p-4 bg-white rounded-4 shadow-sm border-start border-warning border-4 h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span className="text-muted small fw-bold text-uppercase">Pending Invoices</span>
                        <h2 className="fw-bold text-dark mb-0 mt-1">{stats.pendingInvoices}</h2>
                    </div>
                    <div className="bg-warning bg-opacity-10 p-2 rounded-circle text-warning-emphasis">
                        <CreditCard size={20}/>
                    </div>
                </div>
                <small className="text-muted">~€3,400.00 uncollected</small>
            </div>
        </div>
      </div>

      {/* 3. CHART & ACTIVITY FEED */}
      <div className="row g-4">
          
          {/* Revenue Chart */}
          <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
                      <h5 className="fw-bold mb-0">Revenue Analytics</h5>
                  </div>
                  <div className="card-body px-2">
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                                <Area type="monotone" dataKey="value" stroke="#4f46e5" fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>

          {/* Recent Worker Activity */}
          <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold mb-0">Live Activity</h5>
                      <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1 extra-small">Live</span>
                  </div>
                  <div className="card-body p-0">
                      <ul className="list-group list-group-flush">
                          {recentActivity.map((item) => (
                              <li key={item.id} className="list-group-item border-0 px-4 py-3 d-flex gap-3 align-items-start">
                                  <div className="mt-1">
                                      <div className={`rounded-circle p-1 border border-2 ${item.amount === '-' ? 'border-secondary' : 'border-success'}`} style={{width: '10px', height: '10px'}}></div>
                                  </div>
                                  <div>
                                      <p className="mb-0 text-dark fw-bold small">{item.action}</p>
                                      <div className="d-flex justify-content-between align-items-center w-100 gap-3">
                                          <span className="extra-small text-muted text-uppercase">{item.user}</span>
                                          <span className="extra-small text-muted">{item.time}</span>
                                      </div>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  </div>
                  <div className="card-footer bg-white border-0 pb-4 px-4 pt-0">
                      <button className="btn btn-light w-100 text-primary fw-bold small">View All History</button>
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
};

export default ManagerDashboard;