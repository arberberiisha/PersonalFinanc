import React, { useState } from "react";
import { useProducts } from "../ProductContext";
import { Package, Plus, Search, Edit2, Trash2, Tag, Save, X } from "lucide-react";
import Swal from "sweetalert2";

const ProductManager = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(null); // ID of product being edited
  const [editForm, setEditForm] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ sku: "", name: "", price: "", unit: "pcs", vat: 18 });

  // Filter Logic
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveEdit = (id) => {
    updateProduct(id, editForm);
    setIsEditing(null);
    Swal.fire("Updated", "Product details saved.", "success");
  };

  const handleCreate = (e) => {
    e.preventDefault();
    addProduct({ ...newProduct, price: Number(newProduct.price), vat: Number(newProduct.vat) });
    setIsAdding(false);
    setNewProduct({ sku: "", name: "", price: "", unit: "pcs", vat: 18 });
    Swal.fire("Created", "New product added to inventory.", "success");
  };

  return (
    <div className="container mt-2">
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h3 className="fw-bold text-dark mb-1">Product Inventory</h3>
            <p className="text-muted small mb-0">Manage stock, prices, and specific VAT rates.</p>
        </div>
        <button className="btn btn-primary shadow-sm d-flex align-items-center gap-2" onClick={() => setIsAdding(!isAdding)}>
            <Plus size={18}/> {isAdding ? "Cancel" : "Add Product"}
        </button>
      </div>

      {/* ADD FORM */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-4 shadow-sm mb-4 border border-primary border-opacity-25">
            <h6 className="fw-bold text-primary mb-3">Add New Item</h6>
            <div className="row g-3">
                <div className="col-md-2">
                    <input type="text" className="form-control" placeholder="SKU / Code" required 
                        value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                </div>
                <div className="col-md-4">
                    <input type="text" className="form-control" placeholder="Product Name" required 
                        value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                </div>
                <div className="col-md-2">
                    <input type="number" className="form-control" placeholder="Price (€)" required step="0.01"
                        value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                </div>
                <div className="col-md-2">
                    <select className="form-select" value={newProduct.vat} onChange={e => setNewProduct({...newProduct, vat: e.target.value})}>
                        <option value="18">18% (Std)</option>
                        <option value="8">8% (Red)</option>
                        <option value="0">0% (Exempt)</option>
                    </select>
                </div>
                <div className="col-md-2">
                    <button type="submit" className="btn btn-success w-100 fw-bold">Save</button>
                </div>
            </div>
        </form>
      )}

      {/* SEARCH */}
      <div className="input-group shadow-sm mb-4">
         <span className="input-group-text bg-white border-end-0"><Search size={18} className="text-muted"/></span>
         <input type="text" className="form-control border-start-0" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* PRODUCT LIST */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
                <tr>
                    <th className="ps-4 py-3 text-muted small uppercase">SKU</th>
                    <th className="text-muted small uppercase">Product Name</th>
                    <th className="text-muted small uppercase">Price</th>
                    <th className="text-muted small uppercase">Unit</th>
                    <th className="text-muted small uppercase">VAT %</th>
                    <th className="text-end pe-4 text-muted small uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                {filteredProducts.map(p => (
                    <tr key={p.id}>
                        {isEditing === p.id ? (
                            // EDIT MODE
                            <>
                                <td className="ps-4"><input className="form-control form-control-sm" value={editForm.sku} onChange={e => setEditForm({...editForm, sku: e.target.value})}/></td>
                                <td><input className="form-control form-control-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}/></td>
                                <td><input className="form-control form-control-sm" type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})}/></td>
                                <td><input className="form-control form-control-sm" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})}/></td>
                                <td>
                                    <select className="form-select form-select-sm" value={editForm.vat} onChange={e => setEditForm({...editForm, vat: Number(e.target.value)})}>
                                        <option value="18">18%</option>
                                        <option value="8">8%</option>
                                        <option value="0">0%</option>
                                    </select>
                                </td>
                                <td className="text-end pe-4">
                                    <button className="btn btn-sm btn-success me-2" onClick={() => handleSaveEdit(p.id)}><Save size={16}/></button>
                                    <button className="btn btn-sm btn-light" onClick={() => setIsEditing(null)}><X size={16}/></button>
                                </td>
                            </>
                        ) : (
                            // VIEW MODE
                            <>
                                <td className="ps-4 fw-bold text-muted small">{p.sku}</td>
                                <td className="fw-bold text-dark">{p.name}</td>
                                <td>€{p.price.toFixed(2)}</td>
                                <td><span className="badge bg-light text-muted border">{p.unit}</span></td>
                                <td>
                                    <span className={`badge ${p.vat === 18 ? 'bg-primary' : p.vat === 0 ? 'bg-success' : 'bg-warning'} bg-opacity-10 text-${p.vat === 18 ? 'primary' : p.vat === 0 ? 'success' : 'warning-emphasis'}`}>
                                        {p.vat}%
                                    </span>
                                </td>
                                <td className="text-end pe-4">
                                    <button className="btn btn-sm btn-light text-primary me-2" onClick={() => { setIsEditing(p.id); setEditForm(p); }}>
                                        <Edit2 size={16}/>
                                    </button>
                                    <button className="btn btn-sm btn-light text-danger" onClick={() => deleteProduct(p.id)}>
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductManager;