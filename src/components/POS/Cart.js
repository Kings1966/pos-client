// client/src/components/POS/Cart.js
import React from 'react';

const Cart = ({ cartItems = [], onRemoveItem, onUpdateQuantity }) => {
  return (
    <div className="flex-1 overflow-y-auto mb-4">
      <h2 className="section-title">Cart</h2>
      {cartItems.length === 0 ? (
        <p className="text-gray-500">Cart is empty.</p>
      ) : (
        cartItems.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between p-2 border-b"
          >
            <div className="flex-1">
              <h3>{item.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
                  className="px-2"
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    onUpdateQuantity(item._id, Number(e.target.value))
                  }
                  className="px-2"
                  min="1"
                />
                <button
                  onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                  className="px-2"
                >
                  +
                </button>
              </div>
            </div>
            <div className="text-right">
              <p>${((item.price || 0) * item.quantity).toFixed(2)}</p>
              <button
                onClick={() => onRemoveItem(item._id)}
                className="text-red-500 text-xs"
              >
                Remove
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Cart;