import React, { createContext, useContext, useState } from 'react';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  // 10 DUMMY PRODUCTS (Real Inventory Simulation)
  const [products, setProducts] = useState([
    { id: 1, sku: "DEV-001", name: "Web Development Service", price: 50.00, unit: "hr", vat: 18 }, // Standard Service
    { id: 2, sku: "CONS-002", name: "Business Consulting", price: 100.00, unit: "hr", vat: 18 },
    { id: 3, sku: "LAP-Dell", name: "Dell XPS 15 Laptop", price: 1850.00, unit: "pcs", vat: 18 }, // High Value
    { id: 4, sku: "LIC-001", name: "Software License (Yearly)", price: 240.00, unit: "lic", vat: 18 },
    { id: 5, sku: "DOM-001", name: "Domain Registration", price: 15.00, unit: "yr", vat: 18 },
    { id: 6, sku: "SRV-MNT", name: "Server Maintenance", price: 120.00, unit: "mo", vat: 18 },
    { id: 7, sku: "BOOK-01", name: "Educational Books (Tax Exempt)", price: 25.00, unit: "pcs", vat: 0 }, // 0% VAT Example
    { id: 8, sku: "FOOD-01", name: "Catering Service (Reduced VAT)", price: 150.00, unit: "event", vat: 8 }, // 8% VAT Example
    { id: 9, sku: "NET-CBL", name: "Network Cable Cat6", price: 0.50, unit: "m", vat: 18 },
    { id: 10, sku: "INST-01", name: "Installation Fee", price: 75.00, unit: "flat", vat: 18 },
  ]);

  const addProduct = (product) => {
    setProducts([...products, { ...product, id: Date.now() }]);
  };

  const updateProduct = (id, updatedProduct) => {
    setProducts(products.map(p => p.id === id ? { ...updatedProduct, id } : p));
  };

  const deleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};