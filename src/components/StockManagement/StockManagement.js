import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Chart from 'chart.js/auto';
import './StockManagement.css';

const socket = io('https://pos-backend-7gom.onrender.com', {
  transports: ['websocket'],
  withCredentials: true,
});

const StockManagement = ({ allProducts, setAllProducts, categories, setCategories }) => {
  const [products, setProducts] = useState(allProducts || []);
  const [sale, setSale] = useState({ productId: '', quantity: 1 });
  const [bulkUpdate, setBulkUpdate] = useState({ subCategory: '', quantity: '', cost: '' });
  const [lowStockThreshold] = useState(50); // Hardcoded for now
  const [stockHistory, setStockHistory] = useState([]);
  const chartRef = React.useRef(null);
  const chartInstance = React.useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('https://pos-backend-7gom.onrender.com/api/products');
        const fetchedProducts = res.data.map((p) => ({
          ...p,
          stock: p.stock || 0,
          stockHistory: p.stockHistory || [],
        }));
        setProducts(fetchedProducts);
        if (setAllProducts) {
          setAllProducts(fetchedProducts);
        }
        // Aggregate stock history for audit log
        const history = fetchedProducts
          .flatMap((p) =>
            (p.stockHistory || []).map((h) => ({
              productId: p._id,
              productName: p.name,
              date: h.date,
              change: h.change,
              reason: h.reason,
            }))
          )
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setStockHistory(history);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };

    fetchProducts();
    socket.on('stockUpdated', fetchProducts);
    return () => socket.off('stockUpdated', fetchProducts);
  }, []);

  useEffect(() => {
    // Initialize stock trend chart
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      const subCategories = getLevel1SubCategories();
      const stockData = subCategories.map((sub) => sub.stock || 0);
      const labels = subCategories.map((sub) => sub.name);

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Stock Levels',
              data: stockData,
              borderColor: '#FFD700',
              backgroundColor: 'rgba(255, 215, 0, 0.2)',
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Stock (Base Unit)' } },
            x: { title: { display: true, text: 'Subcategory' } },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [products, categories]);

  const getLevel1SubCategories = () => {
    return categories.flatMap((cat) =>
      cat.subcategories.map((sub) => ({
        name: sub.name,
        stock: sub.stock || 0,
        measurement: sub.measurement || 'kg',
        mainCategory: cat.name,
      }))
    );
  };

  const convertToBaseUnit = (quantity, measurement, baseMeasurement) => {
    if (measurement === baseMeasurement) return quantity;
    if (baseMeasurement === 'kg') {
      if (measurement === 'g') return quantity / 1000;
      if (measurement === 'kg') return quantity;
    }
    if (baseMeasurement === 'unit' && measurement === 'unit') return quantity;
    return quantity; // Fallback
  };

  const calculateStockValues = () => {
    const subCategories = getLevel1SubCategories();
    return subCategories.map((sub) => {
      const relatedProducts = products.filter(
        (p) =>
          p.subCategory === sub.name ||
          (p.group === sub.name && p.mainCategory === sub.mainCategory)
      );
      const costValue = relatedProducts.reduce((sum, p) => {
        const quantityInBase = convertToBaseUnit(p.stock || 0, p.measurement, sub.measurement);
        return sum + quantityInBase * (p.cost || 0);
      }, 0);
      const sellValue = relatedProducts.reduce((sum, p) => {
        const quantityInBase = convertToBaseUnit(p.stock || 0, p.measurement, sub.measurement);
        return sum + quantityInBase * (p.price || 0);
      }, 0);
      return ({
        ...sub,
        costValue,
        sellValue,
        lowStock: (sub.stock || 0) <= lowStockThreshold,
      });
    });
  };

  const handleBulkUpdate = async () => {
    try {
      const { subCategory, quantity, cost } = bulkUpdate;
      if (!subCategory || !quantity) {
        alert('Please select a subcategory and enter a quantity.');
        return;
      }

      const parsedQuantity = parseFloat(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        alert('Invalid quantity.');
        return;
      }

      const subCat = getLevel1SubCategories().find((sub) => sub.name === subCategory);
      if (!subCat) {
        alert('Subcategory not found.');
        return;
      }

      // Update subcategory stock
      const updatedCategories = categories.map((cat) => ({
        ...cat,
        subcategories: cat.subcategories.map((sub) =>
          sub.name === subCategory
            ? { ...sub, stock: (sub.stock || 0) + parsedQuantity }
            : sub
        ),
      }));

      // Update a representative product for Socket.IO sync
      const product = products.find(
        (p) => p.subCategory === subCategory || p.group === subCategory
      );
      if (product) {
        const updatedProduct = {
          ...product,
          stock: (product.stock || 0) + parsedQuantity,
          stockHistory: [
            ...(product.stockHistory || []),
            {
              change: parsedQuantity,
              reason: `Bulk Purchase (Invoice) - Cost: $${cost || 'N/A'}`,
              date: new Date().toISOString(),
            },
          ],
        };
        await axios.put(
          `https://pos-backend-7gom.onrender.com/api/products/${product._id}`,
          updatedProduct
        );
        socket.emit('stockUpdated', { id: product._id, stock: updatedProduct.stock });
      }

      setCategories(updatedCategories);
      setBulkUpdate({ subCategory: '', quantity: '', cost: '' });
      alert('Bulk stock updated successfully.');
    } catch (err) {
      console.error('Error updating bulk stock:', err);
      alert('Failed to update stock.');
    }
  };

  const handleSale = async () => {
    try {
      const product = products.find((p) => p._id === sale.productId);
      if (!product) {
        alert('Product not found.');
        return;
      }

      const quantity = parseFloat(sale.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        alert('Invalid quantity.');
        return;
      }

      // Find Level 1 subcategory
      let level1Subcategory = null;
      let mainCategoryName = '';
      for (const cat of categories) {
        const subCat = cat.subcategories.find(
          (sub) => sub.name === product.subCategory || sub.name === product.group
        );
        if (subCat) {
          level1Subcategory = subCat;
          mainCategoryName = cat.name;
          break;
        }
      }

      if (!level1Subcategory) {
        alert('Level 1 subcategory not found.');
        return;
      }

      const quantityInBaseUnit = convertToBaseUnit(
        quantity,
        product.measurement,
        level1Subcategory.measurement
      );

      if ((level1Subcategory.stock || 0) < quantityInBaseUnit) {
        alert('Insufficient stock in the parent subcategory.');
        return;
      }

      // Update subcategory stock
      const updatedCategories = categories.map((cat) => {
        if (cat.name === mainCategoryName) {
          return {
            ...cat,
            subcategories: cat.subcategories.map((sub) =>
              sub.name === level1Subcategory.name
                ? { ...sub, stock: (sub.stock || 0) - quantityInBaseUnit }
                : sub
            ),
          };
        }
        return cat;
      });

      // Update product stock and history
      const updatedProduct = {
        ...product,
        stock: (product.stock || 0) - quantityInBaseUnit,
        stockHistory: [
          ...(product.stockHistory || []),
          {
            change: -quantityInBaseUnit,
            reason: 'Sale',
            date: new Date().toISOString(),
          },
        ],
      };

      await axios.put(
        `https://pos-backend-7gom.onrender.com/api/products/${product._id}`,
        updatedProduct
      );
      socket.emit('stockUpdated', { id: product._id, stock: updatedProduct.stock });

      setProducts(products.map((p) => (p._id === product._id ? updatedProduct : p)));
      if (setAllProducts) {
        setAllProducts(products.map((p) => (p._id === product._id ? updatedProduct : p)));
      }
      setCategories(updatedCategories);
      setSale({ productId: '', quantity: 1 });
      alert('Sale recorded successfully.');
    } catch (err) {
      console.error('Error processing sale:', err);
      alert('Failed to record sale.');
    }
  };

  const generateNoticeBoard = () => {
    const subCategories = calculateStockValues();
    const lowStockItems = subCategories.filter((sub) => sub.lowStock);
    return lowStockItems;
  };

  const saveNoticeBoardAsPDF = () => {
    const doc = new jsPDF();
    doc.setFont('Playfair Display', 'normal');
    doc.setFontSize(16);
    doc.text('Low Stock Notice Board', 10, 10);
    doc.setFontSize(10);

    const headers = ['Subcategory', 'Main Category', 'Stock', 'Measurement', 'Cost Value', 'Sell Value'];
    const data = generateNoticeBoard().map((sub) => [
      sub.name,
      sub.mainCategory,
      sub.stock.toFixed(2),
      sub.measurement,
      `$${sub.costValue.toFixed(2)}`,
      `$${sub.sellValue.toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 20,
      styles: { font: 'Playfair Display', fontSize: 8 },
      headStyles: { fillColor: [255, 215, 0] },
    });

    doc.save('low_stock_notice.pdf');
  };

  const exportNoticeBoardAsExcel = () => {
    const data = generateNoticeBoard().map((sub) => ({
      Subcategory: sub.name,
      'Main Category': sub.mainCategory,
      Stock: sub.stock.toFixed(2),
      Measurement: sub.measurement,
      'Cost Value': sub.costValue.toFixed(2),
      'Sell Value': sub.sellValue.toFixed(2),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Low Stock');
    XLSX.writeFile(workbook, 'low_stock_notice.xlsx');
  };

  const predictRestock = (subCategory) => {
    // Simple prediction: Suggest restocking to 2x lowStockThreshold based on recent sales
    const relatedProducts = products.filter(
      (p) => p.subCategory === subCategory.name || p.group === subCategory.name
    );
    const recentSales = relatedProducts
      .flatMap((p) => (p.stockHistory || []).filter((h) => h.change < 0))
      .filter((h) => new Date(h.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
      .reduce((sum, h) => sum + Math.abs(h.change), 0);

    const suggestedRestock = Math.max(lowStockThreshold * 2, recentSales * 2);
    return suggestedRestock.toFixed(2);
  };

  return (
    <div className="stock-management">
      <h3 className="section-title">Stock Management</h3>
      <div className="stock-container">
        {/* Bulk Stock Update Section */}
        <div className="bulk-stock-section">
          <h4 className="section-subtitle">Bulk Stock Update (Invoice)</h4>
          <div className="form-group">
            <label>Level 1 Subcategory</label>
            <select
              value={bulkUpdate.subCategory}
              onChange={(e) =>
                setBulkUpdate({ ...bulkUpdate, subCategory: e.target.value })
              }
            >
              <option value="">Select Subcategory</option>
              {getLevel1SubCategories().map((sub) => (
                <option key={sub.name} value={sub.name}>
                  {sub.name} ({sub.mainCategory})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Quantity Purchased</label>
            <input
              type="number"
              value={bulkUpdate.quantity}
              onChange={(e) =>
                setBulkUpdate({ ...bulkUpdate, quantity: e.target.value })
              }
              placeholder={`Quantity in base unit (e.g., kg)`}
            />
          </div>
          <div className="form-group">
            <label>Cost (Optional)</label>
            <input
              type="number"
              value={bulkUpdate.cost}
              onChange={(e) => setBulkUpdate({ ...bulkUpdate, cost: e.target.value })}
              placeholder="Total cost of purchase"
            />
          </div>
          <button onClick={handleBulkUpdate}>Add Bulk Stock</button>
        </div>

        {/* Sale Section */}
        <div className="sale-section">
          <h4 className="section-subtitle">Record Sale</h4>
          <div className="form-group">
            <label>Product</label>
            <select
              value={sale.productId}
              onChange={(e) => setSale({ ...sale, productId: e.target.value })}
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.bottomTierCategory || p.subCategory})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Quantity Sold</label>
            <input
              type="number"
              value={sale.quantity}
              onChange={(e) => setSale({ ...sale, quantity: e.target.value })}
              placeholder="Quantity Sold"
              min="1"
            />
          </div>
          <button onClick={handleSale}>Record Sale</button>
        </div>

        {/* Stock Table and Notice Board */}
        <div className="stock-table-section">
          <h4 className="section-subtitle">Stock Overview</h4>
          <div className="stock-table-container">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Subcategory</th>
                  <th>Main Category</th>
                  <th>Stock</th>
                  <th>Measurement</th>
                  <th>Cost Value</th>
                  <th>Sell Value</th>
                  <th>Status</th>
                  <th>Suggested Restock</th>
                </tr>
              </thead>
              <tbody>
                {calculateStockValues().map((sub) => (
                  <tr key={sub.name} className={sub.lowStock ? 'low-stock' : ''}>
                    <td>{sub.name}</td>
                    <td>{sub.mainCategory}</td>
                    <td>{sub.stock.toFixed(2)}</td>
                    <td>{sub.measurement}</td>
                    <td>${sub.costValue.toFixed(2)}</td>
                    <td>${sub.sellValue.toFixed(2)}</td>
                    <td>{sub.lowStock ? '⚠️ Low Stock' : '✅ OK'}</td>
                    <td>{predictRestock(sub)} {sub.measurement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notice Board */}
          <h4 className="section-subtitle">Low Stock Notice Board</h4>
          {generateNoticeBoard().length > 0 ? (
            <div className="notice-board">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Subcategory</th>
                    <th>Main Category</th>
                    <th>Stock</th>
                    <th>Measurement</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {generateNoticeBoard().map((sub) => (
                    <tr key={sub.name}>
                      <td>{sub.name}</td>
                      <td>{sub.mainCategory}</td>
                      <td>{sub.stock.toFixed(2)}</td>
                      <td>{sub.measurement}</td>
                      <td>
                        <button
                          onClick={() =>
                            setBulkUpdate({ ...bulkUpdate, subCategory: sub.name })
                          }
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="notice-board-actions">
                <button onClick={saveNoticeBoardAsPDF}>Save as PDF</button>
                <button onClick={exportNoticeBoardAsExcel}>Export Excel</button>
              </div>
            </div>
          ) : (
            <p>No low stock items.</p>
          )}

          {/* Stock Trend Graph */}
          <h4 className="section-subtitle">Stock Trends</h4>
          <canvas ref={chartRef} className="stock-chart"></canvas>

          {/* Audit Log */}
          <h4 className="section-subtitle">Stock Adjustment Log</h4>
          <div className="stock-table-container">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Date</th>
                  <th>Change</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {stockHistory.slice(0, 10).map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.productName}</td>
                    <td>{new Date(entry.date).toLocaleString()}</td>
                    <td>{entry.change > 0 ? `+${entry.change}` : entry.change}</td>
                    <td>{entry.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockManagement;