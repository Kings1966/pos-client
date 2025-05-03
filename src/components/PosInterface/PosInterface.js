// client/src/components/PosInterface/PosInterface.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cart from '../POS/Cart';
import CustomerSelector from '../POS/CustomerSelector';
import ProductList from '../POS/Productlist';
import DiscountField from '../POS/DiscountField';
import PaymentSection from '../POS/PaymentSection';
import './PosInterface.css';

const POSInterface = ({ allProducts }) => {
  const [products, setProducts] = useState(allProducts || []);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    setProducts(allProducts || []);
  }, [allProducts]);

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item._id === product._id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    setCart(
      cart.map((item) =>
        item._id === productId ? { ...item, quantity: Number(quantity) } : item
      )
    );
  };

  const completePayment = async () => {
    try {
      const subtotal = cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
      const total = subtotal - (subtotal * discount) / 100;
      const payload = {
        customer: selectedCustomer,
        items: cart.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),
        discount,
        paymentMethod,
        totalAmount: total.toFixed(2),
      };
      await axios.post('/api/payments', payload);
      alert('Payment completed successfully!');
      setCart([]);
      setSelectedCustomer('');
      setDiscount(0);
      setPaymentMethod('Cash');
    } catch (error) {
      console.error('Error completing payment:', error);
      alert('Error completing payment.');
    }
  };

  return (
    <div className="pos-container">
      <div className="pos-grid">
        <div className="product-section">
          <h2 className="section-title">Products</h2>
          <ProductList products={products} addToCart={addToCart} />
        </div>
        <div className="cart-section">
          <Cart
            cartItems={cart}
            onRemoveItem={removeFromCart}
            onUpdateQuantity={updateQuantity}
          />
          <CustomerSelector
            selectedCustomer={selectedCustomer}
            onCustomerSelect={setSelectedCustomer}
          />
          <DiscountField discount={discount} setDiscount={setDiscount} />
          <PaymentSection
            cartItems={cart}
            selectedCustomer={selectedCustomer}
            discount={discount}
            setDiscount={setDiscount}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            onCompletePayment={completePayment}
          />
        </div>
      </div>
    </div>
  );
};

export default POSInterface;