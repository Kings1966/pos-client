// client/src/components/POS/ProductList.js
import React, { useState } from 'react';
import { useProductSearch } from '../../context/ProductSearchContext';

const ProductList = ({ addToCart }) => {
  const { filteredProducts } = useProductSearch();
  const [expandedProductId, setExpandedProductId] = useState(null);

  const toggleExpand = (productId) => {
    setExpandedProductId((prev) => (prev === productId ? null : productId));
  };

  return (
    <div className="grid">
      {filteredProducts.length > 0 ? (
        filteredProducts.map((product) => {
          const productId = product._id || product.id;
          const isExpanded = expandedProductId === productId;

          return (
            <div
              key={productId}
              className={`product-tile ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleExpand(productId)}
            >
              <div className="product-info">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-price">
                  ${(product.price || 0).toFixed(2)}
                </p>
              </div>
              {isExpanded && (
                <div className="expanded-content">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name || 'Product Image'}
                      className="product-image"
                      onError={(e) => (e.target.src = '/placeholder-image.png')}
                    />
                  ) : (
                    <p>No image available</p>
                  )}
                  <button
                    className="add-to-cart-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                      setExpandedProductId(null);
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <p className="text-gray-500">No products available.</p>
      )}
    </div>
  );
};

export default ProductList;