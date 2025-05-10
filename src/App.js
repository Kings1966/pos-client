import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './redux/store';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProductSearchProvider } from './context/ProductSearchContext';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';

import Sidebar from './components/Sidebar/Sidebar';
import Topbar from './components/Topbar/Topbar';
import LoginPage from './components/Auth/LoginPage';

// Lazy-load components
const PosInterface = lazy(() => import('./components/PosInterface/PosInterface'));
const SalesManager = lazy(() => import('./components/SalesManager/SalesManager'));
const UserProfile = lazy(() => import('./components/User/UserProfile'));
const SavedSales = lazy(() => import('./components/SalesManager/SavedSales'));
const QuoteInvoiceManager = lazy(() => import('./components/Documents/QuoteInvoiceManager'));
const RefundHistory = lazy(() => import('./components/Refunds/RefundHistory'));
const RefundProcess = lazy(() => import('./components/Refunds/RefundProcess'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const ProductManager = lazy(() => import('./components/ProductManager/ProductManager'));
const StockManagement = lazy(() => import('./components/StockManagement/StockManagement'));
const Customers = lazy(() => import('./components/Customers/Customers'));
const Suppliers = lazy(() => import('./components/SupplierManagement/Suppliers'));
const Accounting = lazy(() => import('./components/Accounting/Accounting'));
const Reports = lazy(() => import('./components/Reports/Reports'));
const Settings = lazy(() => import('./components/Settings/Settings'));
const ReceiptFormat = lazy(() => import('./components/Settings/ReceiptFormat'));
const DocumentFormat = lazy(() => import('./components/Settings/DocumentFormat'));
const TaxRates = lazy(() => import('./components/Settings/TaxRates'));
const Backup = lazy(() => import('./components/Settings/Backup'));
const Users = lazy(() => import('./components/Settings/Users'));

const socket = io(process.env.REACT_APP_BACKEND_URL, {
  transports: ['websocket'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const AppLayout = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [categories, setCategories] = useState([
    { name: 'All', subcategories: [], isMain: false },
    {
      name: 'Baking Ingredients',
      subcategories: [
        { name: 'Flour', subcategories: ['200g', '500g', '1kg'], stock: 25, measurement: 'kg' },
        { name: 'Coffee', subcategories: ['250g', '500g'], stock: 10, measurement: 'kg' },
      ],
      isMain: true,
    },
    {
      name: 'Apparel',
      subcategories: [
        { name: 'T-Shirt', subcategories: ['M', 'L', 'XL'], stock: 100, measurement: 'unit' },
      ],
      isMain: true,
    },
  ]);

  const defaultLabelDesign = {
    size: 'medium',
    width: 40,
    height: 60,
    elements: [],
    positions: {},
    sizes: {},
    rotations: {},
    fontSizes: {},
    fontStyles: {},
    logo: null,
    logoSize: { width: 30, height: 30 },
    logoPosition: { x: 0, y: 0 },
    logoRotation: 0,
    includeLogo: false,
  };

  const fetchProducts = async (retries = 3, delay = 1000) => {
    console.log('Starting fetchProducts...', { backendUrl: process.env.REACT_APP_BACKEND_URL });
    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`fetchProducts - Attempt ${attempt}`);
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products`, {
          withCredentials: true,
        });
        console.log('fetchProducts - Success:', {
          status: res.status,
          data: res.data,
          headers: res.headers,
          cookies: res.config.headers.Cookie || 'No cookies sent',
        });
        if (res.data && Array.isArray(res.data)) {
          const productsWithLabelDesign = res.data.map((product) => ({
            ...product,
            labelDesign: product.labelDesign || defaultLabelDesign,
            code: product.code || product._id,
          }));
          setProducts(productsWithLabelDesign);
          setAllProducts(productsWithLabelDesign);
          if (res.data.length === 0) {
            console.warn('No products returned from API');
            alert('No products found. Please add products in Product Manager.');
          }
        } else {
          console.warn('Invalid products response:', res.data);
          setProducts([]);
          setAllProducts([]);
          alert('Invalid products data. Please check the backend.');
        }
        setLoading(false);
        break;
      } catch (err) {
        console.error(`fetchProducts - Attempt ${attempt} failed:`, {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          headers: err.response?.headers,
          cookies: err.config?.headers?.Cookie || 'No cookies sent',
          code: err.code,
        });
        let errorMessage = err.message;
        if (err.response) {
          if (err.response.status === 401 || err.response.status === 403) {
            console.log('Authentication failed, will retry...');
            if (attempt === retries) {
              console.log('Max retries reached, redirecting to login...');
              navigate('/login');
              setLoading(false);
            }
          } else if (err.response.status === 404) {
            errorMessage = 'Products endpoint not found. Please check the backend server.';
          } else if (err.response.status === 500) {
            errorMessage = `Server error: ${err.response.data?.details || 'Unknown error'}`;
          } else if (err.response.status === 0) {
            errorMessage = 'CORS error or backend unreachable. Check server status and CORS settings.';
          }
        } else if (err.code === 'ERR_NETWORK') {
          errorMessage = 'Network error. Please check your internet connection or backend server status.';
        }
        if (attempt === retries) {
          setProducts([]);
          setAllProducts([]);
          alert(`Failed to load products after ${retries} attempts. ${errorMessage}`);
          setLoading(false);
        } else {
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  };

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        fetchProducts();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }

    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket.id);
    });
    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', {
        message: err.message,
        cause: err.cause,
      });
    });
    socket.on('stockUpdated', (updatedProduct) => {
      setProducts((prev) =>
        prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
      );
      setAllProducts((prev) =>
        prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
      );
    });
    socket.on('productUpdated', (updatedProduct) => {
      setProducts((prev) =>
        prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
      );
      setAllProducts((prev) =>
        prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
      );
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('stockUpdated');
      socket.off('productUpdated');
    };
  }, [user]);

  const addToCart = (product) => {
    dispatch({ type: 'cart/addToCart', payload: product });
  };

  const showProductSearch = location.pathname === '/';

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <ProductSearchProvider allProducts={products} categories={categories}>
      <div className="app-container">
        <Topbar showProductSearch={showProductSearch} />
        <div className="app-main">
          <Sidebar expandedGroup={expandedGroup} setExpandedGroup={setExpandedGroup} />
          <div
            className="app-content"
            style={{
              marginLeft: expandedGroup ? '274px' : '74px',
              width: expandedGroup ? 'calc(100% - 274px)' : 'calc(100% - 74px)',
              minWidth: '400px',
            }}
          >
            <Suspense fallback={<div>Loading component...</div>}>
              {React.cloneElement(children, {
                allProducts,
                setAllProducts,
                categories,
                setCategories,
              })}
            </Suspense>
          </div>
        </div>
      </div>
    </ProductSearchProvider>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (user === undefined) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <AppLayout>
            <PosInterface />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/product-manager"
      element={
        <ProtectedRoute>
          <AppLayout>
            <ProductManager />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/stock-management"
      element={
        <ProtectedRoute>
          <AppLayout>
            <StockManagement />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/customers"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Customers />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/suppliers"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Suppliers />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/accounting"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Accounting />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Reports />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/sales"
      element={
        <ProtectedRoute>
          <AppLayout>
            <SalesManager />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <AppLayout>
            <UserProfile />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/sales-manager/saved-sales"
      element={
        <ProtectedRoute>
          <AppLayout>
            <SavedSales />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/Documents/QuoteInvoiceManager"
      element={
        <ProtectedRoute>
          <AppLayout>
            <QuoteInvoiceManager />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/refunds/process"
      element={
        <ProtectedRoute>
          <AppLayout>
            <RefundProcess />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/refunds/history"
      element={
        <ProtectedRoute>
          <AppLayout>
            <RefundHistory />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Settings />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings/receipt-format"
      element={
        <ProtectedRoute>
          <AppLayout>
            <ReceiptFormat />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings/document-format"
      element={
        <ProtectedRoute>
          <AppLayout>
            <DocumentFormat />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings/tax-rates"
      element={
        <ProtectedRoute>
          <AppLayout>
            <TaxRates />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings/backup"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Backup />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings/users"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Users />
          </AppLayout>
        </ProtectedRoute>
      }
    />
  </Routes>
);

const App = () => (
  <Provider store={store}>
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  </Provider>
);

export default App;