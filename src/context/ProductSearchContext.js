// client/src/context/ProductSearchContext.js
import React, { createContext, useContext, useState } from 'react';

const ProductSearchContext = createContext();

export const ProductSearchProvider = ({ children, allProducts = [], categories = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getBottomTierCategory = (product) => {
    for (const cat of categories) {
      if (cat.name === 'All') continue;
      const subCat = cat.subcategories.find((sub) => sub.name === product.group);
      if (subCat && subCat.subcategories.length > 0) {
        return subCat.subcategories[0];
      }
      for (const sub of cat.subcategories) {
        if (sub.subcategories.includes(product.group)) {
          return product.group;
        }
      }
    }
    return product.group || 'Unknown';
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleScan = (e) => {
    if (e.key === 'Enter') {
      console.log('Search or scan triggered:', searchTerm);
    }
  };

  const filteredProducts = allProducts.map((p) => ({
    ...p,
    bottomTierCategory: getBottomTierCategory(p),
  })).filter((p) => {
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      // Use bottom-tier category instead of measurement
      const nameWithBottomTier = `${p.name || ''} - ${p.bottomTierCategory || ''}`.toLowerCase();
      return (
        nameWithBottomTier.includes(query) ||
        (p.id ? String(p.id).toLowerCase() : '').includes(query) ||
        (p.barcode ? String(p.barcode).toLowerCase() : '').includes(query)
      );
    }
    return true;
  });

  return (
    <ProductSearchContext.Provider
      value={{
        searchTerm,
        handleSearch,
        handleScan,
        filteredProducts,
      }}
    >
      {children}
    </ProductSearchContext.Provider>
  );
};

export const useProductSearch = () => useContext(ProductSearchContext);