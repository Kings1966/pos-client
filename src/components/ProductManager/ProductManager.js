// client/src/components/ProductManager.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { setProducts } from '../../redux/stockSlice';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import './ProductManager.css';
import LabelDesigner from './LabelDesigner';

// Determine API URL based on environment
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://pos-backend-7gom.onrender.com'
  : 'http://localhost:5000';

const socket = io(API_URL, {
  transports: ['websocket'],
  withCredentials: true,
});

const ProductManager = ({ allProducts, setAllProducts, categories, setCategories }) => {
  const dispatch = useDispatch();
  const [products, setLocalProducts] = useState(allProducts || []);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', parent: '', subParent: '', isMain: false, originalName: '' });
  const [barcodeSvg, setBarcodeSvg] = useState(null);
  const [barcodePng, setBarcodePng] = useState(null);
  const [barcodeError, setBarcodeError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState({});
  const [customMeasurement, setCustomMeasurement] = useState('');
  const [measurements, setMeasurements] = useState(['kg', 'g', 'pack', 'unit']);
  const [newMainCategory, setNewMainCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newBottomTierCategory, setNewBottomTierCategory] = useState('');
  const [columnWidths, setColumnWidths] = useState({
    id: 100,
    bottomTierCategory: 100,
    name: 200,
    group: 150,
    barcode: 150,
    cost: 100,
    priceBeforeTax: 150,
    tax: 100,
    price: 100,
    markup: 100,
    active: 100,
    updatedAt: 150,
  });
  const [expandedMainCategories, setExpandedMainCategories] = useState({});
  const [expandedSubCategories, setExpandedSubCategories] = useState({});

  const fileInputRef = useRef(null);
  const resizeRef = useRef(null);
  const barcodeRef = useRef(null);

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

  const initialFormState = {
    code: '',
    name: '',
    group: '',
    subCategory: '',
    bottomTierCategory: '',
    barcode: '',
    barcodeType: 'CODE128',
    barcodeOption: 'manual',
    cost: '',
    priceBeforeTax: '',
    tax: '',
    salesPrice: '',
    markup: '',
    active: true,
    includesTax: false,
    image: '',
    label: '',
    online: false,
    measurement: 'kg',
    createdAt: '',
    updatedAt: '',
    parentProductId: null,
    stock: 0,
    labelDesign: { ...defaultLabelDesign },
    batchNumber: '',
    expiryDate: '',
  };

  const [form, setForm] = useState(initialFormState);

  // Debounce utility
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Barcode validation
  const validateBarcode = (barcode, type) => {
    if (!barcode) {
      setBarcodeError('Barcode cannot be empty.');
      return false;
    }
    if (type === 'EAN13' && !/^\d{13}$/.test(barcode)) {
      setBarcodeError('EAN13 requires exactly 13 digits.');
      return false;
    }
    if (type === 'UPC' && !/^\d{12}$/.test(barcode)) {
      setBarcodeError('UPC requires exactly 12 digits.');
      return false;
    }
    if (type === 'CODE128' && barcode.length < 3) {
      setBarcodeError('CODE128 requires at least 3 characters.');
      return false;
    }
    setBarcodeError('');
    return true;
  };

  // Barcode generation
  const generateBarcode = useCallback((barcode, type) => {
    if (!validateBarcode(barcode, type)) {
      setBarcodeSvg(null);
      setBarcodePng(null);
      return;
    }
    try {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svgElement, barcode, {
        format: type,
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      });
      const svgString = new XMLSerializer().serializeToString(svgElement);
      setBarcodeSvg(svgString);
      setBarcodeError('');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        setBarcodePng(canvas.toDataURL('image/png'));
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
    } catch (err) {
      console.error('Failed to generate barcode:', err.message);
      setBarcodeError(`Invalid barcode: ${err.message}`);
      setBarcodeSvg(null);
      setBarcodePng(null);
    }
  }, []);

  const debouncedGenerateBarcode = debounce(generateBarcode, 300);

  const generateNextBarcode = () => {
    const baseBarcode = 6777000000000;
    const existingBarcodes = products
      .map((p) => parseInt(p.barcode, 10))
      .filter((b) => !isNaN(b) && b >= baseBarcode && b < baseBarcode + 1000000)
      .sort((a, b) => b - a);
    return (existingBarcodes.length > 0 ? existingBarcodes[0] + 1 : baseBarcode).toString();
  };

  const handleBarcodeOptionChange = (e) => {
    const option = e.target.value;
    let newBarcode = '';
    if (option === 'generate') {
      newBarcode = generateNextBarcode();
      debouncedGenerateBarcode(newBarcode, form.barcodeType);
    } else {
      setBarcodeSvg(null);
      setBarcodePng(null);
      setBarcodeError('');
    }
    setForm((prev) => ({ ...prev, barcodeOption: option, barcode: newBarcode }));
  };

  const handleBarcodeChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'barcode') {
      if (value) {
        debouncedGenerateBarcode(value, form.barcodeType);
      } else {
        setBarcodeSvg(null);
        setBarcodePng(null);
        setBarcodeError('');
      }
    } else if (name === 'barcodeType') {
      if (form.barcode) {
        debouncedGenerateBarcode(form.barcode, value);
      }
    }
  };

  const fetchProducts = async (retries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Fetching products (attempt ${attempt}) from https://pos-backend-7gom.onrender.com/api/products`);
        const res = await axios.get(`https://pos-backend-7gom.onrender.com/api/products`, {
          withCredentials: true,
        });
        console.log('Fetched products:', {
          status: res.status,
          data: res.data,
          headers: res.headers,
        });
        const fetchedProducts = res.data.map((product) => ({
          ...product,
          createdAt: product.createdAt || new Date().toISOString(),
          updatedAt: product.updatedAt || new Date().toISOString(),
          parentProductId: product.parentProductId || null,
          stock: product.stock || 0,
          labelDesign: product.labelDesign || defaultLabelDesign,
          group: product.group || '',
          subCategory: product.subCategory || '',
          bottomTierCategory: product.bottomTierCategory || '',
        }));
        setLocalProducts(fetchedProducts);
        setAllProducts?.(fetchedProducts);
        dispatch(setProducts(fetchedProducts));
        break;
      } catch (err) {
        console.error(`Attempt ${attempt} failed to fetch products:`, {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          headers: err.response?.headers,
          code: err.code,
        });
        if (attempt === retries) {
          alert('Failed to load products. Please check your network or try again later.');
        } else {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  };

  useEffect(() => {
    fetchProducts();
    socket.on('stockUpdated', fetchProducts);
    return () => socket.off('stockUpdated', fetchProducts);
  }, []);

  useEffect(() => {
    setLocalProducts(allProducts || []);
  }, [allProducts]);

  useEffect(() => {
    if (categories) {
      const filteredCategories = categories.filter(
        (cat) => cat.name.toLowerCase() !== 'all categories' && cat.name.toLowerCase() !== 'all'
      );
      if (JSON.stringify(filteredCategories) !== JSON.stringify(categories)) {
        setCategories(filteredCategories);
      }
    }
  }, [categories, setCategories]);

  const getBottomTierCategory = (product) => product.bottomTierCategory || 'Unknown';

  const calculatePriceBeforeTax = (salesPrice, tax, includesTax) => {
    if (!includesTax || !tax || !salesPrice) return salesPrice || 0;
    const taxRate = parseFloat(tax) / 100;
    return (parseFloat(salesPrice) / (1 + taxRate)).toFixed(2);
  };

  const calculateMarkup = (cost, priceBeforeTax) => {
    const costNum = parseFloat(cost) || 0;
    const priceNum = parseFloat(priceBeforeTax) || 0;
    return costNum ? (((priceNum - costNum) / costNum) * 100).toFixed(2) : '0';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm((prev) => {
      const updated = { ...prev, [name]: val };
      const cost = parseFloat(updated.cost || 0);
      const tax = parseFloat(updated.tax || 0);
      if (name === 'markup') {
        const markup = parseFloat(val);
        const basePrice = cost * (1 + markup / 100);
        updated.priceBeforeTax = basePrice.toFixed(2);
        updated.salesPrice = updated.includesTax ? (basePrice * (1 + tax / 100)).toFixed(2) : basePrice.toFixed(2);
      } else if (name === 'priceBeforeTax' || name === 'includesTax' || name === 'tax') {
        const base = parseFloat(updated.priceBeforeTax || 0);
        updated.salesPrice = updated.includesTax ? (base * (1 + tax / 100)).toFixed(2) : base.toFixed(2);
        updated.markup = calculateMarkup(cost, base);
      } else if (name === 'salesPrice') {
        const price = parseFloat(val);
        const beforeTax = calculatePriceBeforeTax(price, tax, updated.includesTax);
        updated.priceBeforeTax = beforeTax;
        updated.markup = calculateMarkup(cost, beforeTax);
      }
      return updated;
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleAddMeasurement = () => {
    if (customMeasurement && !measurements.includes(customMeasurement)) {
      setMeasurements((prev) => [...prev, customMeasurement]);
      setForm((prev) => ({ ...prev, measurement: customMeasurement }));
      setCustomMeasurement('');
    }
  };

  const handleAddCategory = (level) => {
    if (level === 'main' && newMainCategory) {
      const newCategory = { name: newMainCategory, subcategories: [], isMain: true };
      setCategories((prev) => [...prev, newCategory]);
      setForm((prev) => ({ ...prev, group: newMainCategory }));
      setNewMainCategory('');
    } else if (level === 'sub' && newSubCategory && form.group) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.name === form.group
            ? {
                ...cat,
                subcategories: [
                  ...cat.subcategories,
                  { name: newSubCategory, subcategories: [], stock: 0, measurement: 'kg' },
                ],
              }
            : cat
        )
      );
      setForm((prev) => ({ ...prev, subCategory: newSubCategory }));
      setNewSubCategory('');
    } else if (level === 'bottom' && newBottomTierCategory && form.subCategory) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.name === form.group
            ? {
                ...cat,
                subcategories: cat.subcategories.map((sub) =>
                  sub.name === form.subCategory
                    ? { ...sub, subcategories: [...sub.subcategories, newBottomTierCategory] }
                    : sub
                ),
              }
            : cat
        )
      );
      setForm((prev) => ({ ...prev, bottomTierCategory: newBottomTierCategory }));
      setNewBottomTierCategory('');
    }
  };

  const setLabelDesign = (newLabelDesign) => {
    setForm((prev) => ({
      ...prev,
      labelDesign: typeof newLabelDesign === 'function' ? newLabelDesign(prev.labelDesign) : newLabelDesign,
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.group || !form.subCategory) {
      alert('Please fill in all required fields: Name, Main Category, and Subcategory.');
      return;
    }

    const productData = {
      ...form,
      _id: form.id || uuidv4(),
      code: form.id || uuidv4(),
      measurement: form.measurement || 'kg',
      total: 0,
      price: parseFloat(form.salesPrice) || 0,
      cost: parseFloat(form.cost) || 0,
      tax: parseFloat(form.tax) || 0,
      priceBeforeTax: parseFloat(form.priceBeforeTax) || 0,
      markup: parseFloat(form.markup) || 0,
      deductions: [],
      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentProductId: form.parentProductId || null,
      stock: parseFloat(form.stock) || 0,
      labelDesign: form.labelDesign || defaultLabelDesign,
      group: form.group,
      subCategory: form.subCategory,
      bottomTierCategory: form.bottomTierCategory || '',
      batchNumber: form.batchNumber || '',
      expiryDate: form.expiryDate || '',
    };

    try {
      let updatedProducts;
      let newProduct;
      if (form.id) {
        const res = await axios.put(
          `https://pos-backend-7gom.onrender.com/api/products/${form.id}`,
          productData,
          { withCredentials: true }
        );
        newProduct = res.data;
        updatedProducts = products.map((p) => (p.id === form.id ? newProduct : p));
      } else {
        const res = await axios.post(
          `https://pos-backend-7gom.onrender.com/api/products`,
          productData,
          { withCredentials: true }
        );
        newProduct = res.data;
        updatedProducts = [...products, newProduct];
      }

      setLocalProducts(updatedProducts);
      setAllProducts?.(updatedProducts);
      dispatch(setProducts(updatedProducts));

      socket.emit('stockUpdated', { id: newProduct._id, stock: newProduct.stock });

      setShowFormModal(false);
      setForm(initialFormState);
      setBarcodeSvg(null);
      setBarcodePng(null);
      alert('Product saved successfully.');
    } catch (err) {
      console.error('Failed to save product:', err);
      alert(`Failed to save product: ${err.response?.data?.details || err.message}`);
    }
  };

  const resetForm = () => {
    setForm(initialFormState);
    setBarcodeSvg(null);
    setBarcodePng(null);
    setBarcodeError('');
    setShowFormModal(false);
  };

  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedProducts.map(async (id) => {
          const product = products.find((p) => p.id === id);
          if (product) {
            await axios.delete(`https://pos-backend-7gom.onrender.com/api/products/${product._id}`, {
              withCredentials: true,
            });
            socket.emit('stockUpdated', { id: product._id });
          }
        })
      );
      fetchProducts();
      setSelectedProducts([]);
    } catch (err) {
      console.error('Failed to delete products:', err);
      alert(`Failed to delete products: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleEdit = () => {
    if (selectedProducts.length !== 1) {
      alert('Please select exactly one product to edit.');
      return;
    }
    const product = products.find((p) => p.id === selectedProducts[0]);
    setForm({
      ...product,
      id: product.id || product._id,
      cost: product.cost?.toString() || '',
      priceBeforeTax: product.priceBeforeTax?.toString() || '',
      tax: product.tax?.toString() || '',
      salesPrice: product.salesPrice?.toString() || '',
      markup: product.markup?.toString() || '',
      stock: product.stock?.toString() || '0',
      labelDesign: product.labelDesign || defaultLabelDesign,
      batchNumber: product.batchNumber || '',
      expiryDate: product.expiryDate || '',
    });
    if (product.barcode) {
      debouncedGenerateBarcode(product.barcode, product.barcodeType || 'CODE128');
    }
    setShowFormModal(true);
  };

  const handleCopyProduct = () => {
    if (selectedProducts.length !== 1) {
      alert('Please select exactly one product to copy.');
      return;
    }
    const product = products.find((p) => p.id === selectedProducts[0]);
    if (product) {
      setForm({
        ...product,
        id: '',
        _id: '',
        barcode: '',
        createdAt: '',
        updatedAt: '',
        labelDesign: product.labelDesign || defaultLabelDesign,
      });
      setBarcodeSvg(null);
      setBarcodePng(null);
      setBarcodeError('');
      setShowFormModal(true);
    }
  };

  const handleCategorySubmit = () => {
    if (!categoryForm.name) {
      alert('Category name is required.');
      return;
    }
    if (
      categoryForm.name.toLowerCase() === 'all categories' ||
      categoryForm.name.toLowerCase() === 'all'
    ) {
      alert('Cannot add a category named "All" or "All Categories".');
      return;
    }

    setCategories((prev) => {
      let updatedCategories = [...prev];
      if (categoryForm.isMain) {
        updatedCategories.push({ name: categoryForm.name, subcategories: [], isMain: true });
      } else if (categoryForm.parent && categoryForm.subParent) {
        updatedCategories = prev.map((cat) =>
          cat.name === categoryForm.parent
            ? {
                ...cat,
                subcategories: cat.subcategories.map((sub) =>
                  sub.name === categoryForm.subParent
                    ? {
                        ...sub,
                        subcategories:
                          categoryForm.originalName &&
                          sub.subcategories.includes(categoryForm.originalName)
                            ? sub.subcategories.map((subSub) =>
                                subSub === categoryForm.originalName ? categoryForm.name : subSub
                              )
                            : [...sub.subcategories, categoryForm.name],
                      }
                    : sub
                ),
              }
            : cat
        );
      } else if (categoryForm.parent) {
        updatedCategories = prev.map((cat) =>
          cat.name === categoryForm.parent
            ? {
                ...cat,
                subcategories:
                  categoryForm.originalName &&
                  cat.subcategories.some((sub) => sub.name === categoryForm.originalName)
                    ? cat.subcategories.map((sub) =>
                        sub.name === categoryForm.originalName
                          ? { ...sub, name: categoryForm.name }
                          : sub
                      )
                    : [
                        ...cat.subcategories,
                        { name: categoryForm.name, subcategories: [], stock: 0, measurement: 'kg' },
                      ],
              }
            : cat
        );
      } else {
        updatedCategories.push({ name: categoryForm.name, subcategories: [], isMain: false });
      }
      return updatedCategories;
    });

    setCategoryForm({ name: '', parent: '', subParent: '', isMain: false, originalName: '' });
    setShowCategoryModal(false);
    alert('Category added successfully.');
  };

  const handleDeleteCategory = () => {
    if (selectedCategory === 'All') {
      alert('Cannot delete the "All" category.');
      return;
    }
    setCategories((prev) =>
      prev
        .map((cat) => {
          if (cat.name === selectedCategory) return null;
          return {
            ...cat,
            subcategories: cat.subcategories
              .map((sub) => {
                if (sub.name === selectedCategory) return null;
                return {
                  ...sub,
                  subcategories: sub.subcategories.filter((subSub) => subSub !== selectedCategory),
                };
              })
              .filter(Boolean),
          };
        })
        .filter(Boolean)
    );
    setSelectedCategory('All');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const productSheetName = workbook.SheetNames.includes('Products')
        ? 'Products'
        : workbook.SheetNames[0];
      const productSheet = workbook.Sheets[productSheetName];
      const importedProducts = XLSX.utils.sheet_to_json(productSheet);
      const formattedProducts = importedProducts.map((p) => {
        const includesTax = p['Sell Price Tax Included'] ? true : false;
        const salesPrice = p['Sell Price Tax Included'] || p['Sell Price'] || 0;
        const tax = p['Tax Code'] || 0;
        const priceBeforeTax = includesTax
          ? calculatePriceBeforeTax(salesPrice, tax, includesTax)
          : p['Sell Price'] || 0;
        const cost = p.Cost || 0;
        const markup = calculateMarkup(cost, priceBeforeTax);
        return {
          id: p['SKU Code'] || uuidv4(),
          _id: uuidv4(),
          name: p.Name || '',
          cost,
          priceBeforeTax,
          price: salesPrice,
          tax,
          markup,
          barcode: p['Barcode Nr'] || '',
          image: p.Image || '',
          group: p.Category || '',
          subCategory: p.SubCategory || '',
          bottomTierCategory: p.BottomTierCategory || '',
          active: true,
          includesTax,
          online: false,
          measurement: p.Measurement || 'kg',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          parentProductId: null,
          stock: 0,
          labelDesign: p.LabelDesign ? JSON.parse(p.LabelDesign) : defaultLabelDesign,
        };
      });
      setLocalProducts(formattedProducts);
      setAllProducts?.(formattedProducts);
      if (workbook.SheetNames.includes('Categories')) {
        const categorySheet = workbook.Sheets['Categories'];
        const importedCategories = XLSX.utils.sheet_to_json(categorySheet);
        const formattedCategories = importedCategories
          .map((cat) => ({
            name: cat.Name || '',
            isMain: cat.IsMain === 'true' || cat.IsMain === true,
            subcategories: cat.Subcategories ? JSON.parse(cat.Subcategories) : [],
          }))
          .filter(
            (cat) => cat.name.toLowerCase() !== 'all categories' && cat.name.toLowerCase() !== 'all'
          );
        setCategories(formattedCategories);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = (format = 'xlsx') => {
    const exportData = filteredProducts.map((p) => ({
      'SKU Code': p.id,
      Name: p.name,
      Measurement: p.measurement,
      Category: p.group,
      SubCategory: p.subCategory,
      BottomTierCategory: p.bottomTierCategory,
      Cost: p.cost,
      'Sell Price': p.priceBeforeTax,
      'Sell Price Tax Included': p.price,
      'Tax Code': p.tax,
      'Barcode Nr': p.barcode,
      Image: p.image,
      LabelDesign: JSON.stringify(p.labelDesign),
    }));
    const categoryExportData = categories.map((cat) => ({
      Name: cat.name,
      IsMain: cat.isMain,
      Subcategories: JSON.stringify(cat.subcategories),
    }));
    if (format === 'xlsx') {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(exportData), 'Products');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(categoryExportData), 'Categories');
      XLSX.writeFile(workbook, 'products_export.xlsx');
    } else if (format === 'csv') {
      const productCsv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(exportData));
      const categoryCsv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(categoryExportData));
      const productBlob = new Blob([productCsv], { type: 'text/csv;charset=utf-8;' });
      const productLink = document.createElement('a');
      productLink.href = URL.createObjectURL(productBlob);
      productLink.download = 'products_export.csv';
      productLink.click();
      const categoryBlob = new Blob([categoryCsv], { type: 'text/csv;charset=utf-8;' });
      const categoryLink = document.createElement('a');
      categoryLink.href = URL.createObjectURL(categoryBlob);
      categoryLink.download = 'categories_export.csv';
      categoryLink.click();
    }
  };

  const handlePrintTable = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Products</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h2>Product List</h2>
          <table>
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Bottom-Tier Category</th>
                <th>Name of Product</th>
                <th>Group</th>
                <th>Barcode</th>
                <th>Cost</th>
                <th>Sale Price (Before Tax)</th>
                <th>Taxes</th>
                <th>Sale Price</th>
                <th>Markup%</th>
                <th>Active</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProducts
                .map(
                  (p) => `
                    <tr>
                      <td>${p.id}</td>
                      <td>${p.bottomTierCategory}</td>
                      <td>${p.name}</td>
                      <td>${p.group}</td>
                      <td>${p.barcode}</td>
                      <td>$${p.cost}</td>
                      <td>$${p.priceBeforeTax}</td>
                      <td>${p.tax}%</td>
                      <td>$${p.price}</td>
                      <td>${p.markup}%</td>
                      <td>${p.active ? '✅' : '❌'}</td>
                      <td>${new Date(p.updatedAt).toLocaleString()}</td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSaveAsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Product List', 10, 10);
    doc.setFontSize(10);
    const headers = [
      'SKU Code',
      'Bottom-Tier Category',
      'Name',
      'Group',
      'Barcode',
      'Cost',
      'Price (Before Tax)',
      'Taxes',
      'Sale Price',
      'Markup%',
      'Active',
      'Updated',
    ];
    const data = filteredProducts.map((p) => [
      p.id,
      p.bottomTierCategory,
      p.name,
      p.group,
      p.barcode,
      `$${p.cost}`,
      `$${p.priceBeforeTax}`,
      `${p.tax}%`,
      `$${p.price}`,
      `${p.markup}%`,
      p.active ? 'Yes' : 'No',
      new Date(p.updatedAt).toLocaleString(),
    ]);
    doc.autoTable({
      head: [headers],
      body: data,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [200, 200, 200] },
    });
    doc.save('products.pdf');
  };

  const handlePrintLabel = () => {
    if (selectedProducts.length !== 1) {
      alert('Please select exactly one product to print its label.');
      return;
    }
    const product = products.find((p) => p.id === selectedProducts[0]);
    if (!product.labelDesign || !product.labelDesign.elements.length) {
      alert('No label design found for this product.');
      return;
    }

    const MM_TO_PX = 3.78 * 2;
    const labelWidth = product.labelDesign.width * MM_TO_PX;
    const labelHeight = product.labelDesign.height * MM_TO_PX;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label</title>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; }
            .label-container {
              width: ${labelWidth}px;
              height: ${labelHeight}px;
              border: 1px solid #000;
              position: relative;
              background: #fff;
            }
            .label-element {
              position: absolute;
              overflow: hidden;
            }
            .label-element img, .label-element svg {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .label-element span {
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              text-align: center;
              white-space: pre-wrap;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            ${product.labelDesign.elements
              .map((el) => {
                const x = product.labelDesign.positions[el.id]?.x || 0;
                const y = product.labelDesign.positions[el.id]?.y || 0;
                const width = product.labelDesign.sizes[el.id]?.width || 100;
                const height = product.labelDesign.sizes[el.id]?.height || 50;
                const rotation = product.labelDesign.rotations[el.id] || 0;
                const fontSize = Math.min(width * 0.1, height * 0.5) || 14;
                if (el.type === 'barcode' && el.content?.includes('<svg')) {
                  return `<div class="label-element" style="left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px; transform: rotate(${rotation}deg); transform-origin: center center;">
                    ${el.content}
                  </div>`;
                } else if (el.type === 'image' || el.type === 'barcode') {
                  return `<div class="label-element" style="left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px; transform: rotate(${rotation}deg); transform-origin: center center;">
                    <img src="${el.content}" alt="${el.type}" />
                  </div>`;
                } else {
                  return `<div class="label-element" style="left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px; transform: rotate(${rotation}deg); transform-origin: center center;">
                    <span style="font-size: ${fontSize}px;">${el.content}</span>
                  </div>`;
                }
              })
              .join('')}
            ${product.labelDesign.includeLogo && product.labelDesign.logo
              ? `<div class="label-element" style="left: ${product.labelDesign.logoPosition.x}px; top: ${product.labelDesign.logoPosition.y}px; width: ${product.labelDesign.logoSize.width}px; height: ${product.labelDesign.logoSize.height}px; transform: rotate(${product.labelDesign.logoRotation || 0}deg); transform-origin: center center;">
                  <img src="${product.labelDesign.logo}" alt="Logo" />
                </div>`
              : ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSelectProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleSortAndFilter = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    const values = products.map((p) =>
      key === 'bottomTierCategory' ? getBottomTierCategory(p) : p[key]
    );
    const mostCommonValue = values
      .filter((v) => v !== undefined && v !== null)
      .sort(
        (a, b) =>
          values.filter((v) => v === b).length - values.filter((v) => v === a).length
      )[0];
    setFilterConfig((prev) => {
      if (prev[key] === mostCommonValue) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: mostCommonValue };
    });
  };

  const startResize = (key, e) => {
    e.preventDefault();
    resizeRef.current = { key, startX: e.clientX, startWidth: columnWidths[key] };
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  };

  const resize = (e) => {
    if (resizeRef.current) {
      const { key, startX, startWidth } = resizeRef.current;
      const newWidth = startWidth + (e.clientX - startX);
      setColumnWidths((prev) => ({
        ...prev,
        [key]: Math.max(50, newWidth),
      }));
    }
  };

  const stopResize = () => {
    resizeRef.current = null;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  };

  const toggleMainCategory = (categoryName) => {
    setExpandedMainCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const toggleSubCategory = (subCategoryName) => {
    setExpandedSubCategories((prev) => ({
      ...prev,
      [subCategoryName]: !prev[subCategoryName],
    }));
  };

  const filteredProducts = products
    .filter((p) => {
      if (selectedCategory === 'All') return true;
      const mainCat = categories.find((c) => c.name === selectedCategory);
      if (mainCat) {
        return (
          p.group === selectedCategory ||
          mainCat.subcategories.some(
            (sub) =>
              sub.name === p.subCategory || sub.subcategories.includes(p.bottomTierCategory)
          )
        );
      }
      for (const cat of categories) {
        const subCat = cat.subcategories.find((sub) => sub.name === selectedCategory);
        if (subCat) {
          return (
            p.subCategory === selectedCategory ||
            subCat.subcategories.includes(p.bottomTierCategory)
          );
        }
        for (const sub of cat.subcategories) {
          if (sub.subcategories.includes(selectedCategory)) {
            return p.bottomTierCategory === selectedCategory;
          }
        }
      }
      return false;
    })
    .map((p) => ({ ...p, bottomTierCategory: getBottomTierCategory(p) }))
    .filter((p) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        `${p.name || ''} - ${p.bottomTierCategory || ''}`.toLowerCase().includes(query) ||
        String(p.id || '').toLowerCase().includes(query) ||
        String(p.barcode || '').toLowerCase().includes(query)
      );
    })
    .filter((p) =>
      Object.entries(filterConfig).every(([key, value]) => {
        if (!value) return true;
        return key === 'bottomTierCategory'
          ? p.bottomTierCategory === value
          : p[key] === value;
      })
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aValue =
        sortConfig.key === 'bottomTierCategory' ? a.bottomTierCategory : a[sortConfig.key];
      const bValue =
        sortConfig.key === 'bottomTierCategory' ? b.bottomTierCategory : b[sortConfig.key];
      return sortConfig.direction === 'asc'
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
        ? 1
        : -1;
    });

  const renderCategories = categories.filter(
    (cat) => cat.name.toLowerCase() !== 'all categories' && cat.name.toLowerCase() !== 'all'
  );

  return (
    <div className="product-manager">
      <div className="manager-container">
        <div className="category-sidebar">
          <h3 className="category-title">Categories</h3>
          <ul className="category-list">
            <li>
              <div
                className={`category-item ${selectedCategory === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('All')}
              >
                All
              </div>
            </li>
            {renderCategories.map((category) => (
              <li key={category.name}>
                <div
                  className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(category.name);
                    if (category.subcategories.length > 0) {
                      toggleMainCategory(category.name);
                    }
                  }}
                >
                  <span className="category-toggle">
                    {category.subcategories.length > 0 &&
                      (expandedMainCategories[category.name] ? '▼' : '▶')}
                  </span>
                  {category.name}
                </div>
                {expandedMainCategories[category.name] && category.subcategories.length > 0 && (
                  <ul className="subcategory-list">
                    {category.subcategories.map((sub) => (
                      <li key={sub.name}>
                        <div
                          className={`subcategory-item ${selectedCategory === sub.name ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(sub.name);
                            if (sub.subcategories.length > 0) {
                              toggleSubCategory(sub.name);
                            }
                          }}
                        >
                          <span className="category-toggle">
                            {sub.subcategories.length > 0 &&
                              (expandedSubCategories[sub.name] ? '▼' : '▶')}
                          </span>
                          {sub.name} (Stock: {sub.stock} {sub.measurement})
                        </div>
                        {expandedSubCategories[sub.name] && sub.subcategories.length > 0 && (
                          <ul className="subsubcategory-list">
                            {sub.subcategories.map((subSub) => (
                              <li
                                key={subSub}
                                className={`subsubcategory-item ${selectedCategory === subSub ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCategory(subSub);
                                }}
                              >
                                {subSub}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="main-content">
          <div className="actions">
            <button onClick={() => setShowFormModal(true)}>New Product</button>
            <button onClick={handleEdit} disabled={selectedProducts.length !== 1}>
              Edit Product
            </button>
            <button onClick={handleCopyProduct} disabled={selectedProducts.length !== 1}>
              Copy Product
            </button>
            <button onClick={handleDelete} disabled={selectedProducts.length === 0}>
              Delete Product
            </button>
            <button
              onClick={() => {
                setCategoryForm({ name: '', parent: '', subParent: '', isMain: false, originalName: '' });
                setShowCategoryModal(true);
              }}
            >
              New Category
            </button>
            <button
              onClick={() => {
                if (selectedCategory === 'All') {
                  alert('Please select a category to edit.');
                  return;
                }
                let parent = '';
                let subParent = '';
                let isMain = false;
                for (const cat of categories) {
                  if (cat.name === selectedCategory) {
                    isMain = cat.isMain;
                    break;
                  }
                  const subCat = cat.subcategories.find((sub) => sub.name === selectedCategory);
                  if (subCat) {
                    parent = cat.name;
                    break;
                  }
                  for (const sub of cat.subcategories) {
                    if (sub.subcategories.includes(selectedCategory)) {
                      parent = cat.name;
                      subParent = sub.name;
                      break;
                    }
                  }
                }
                setCategoryForm({
                  name: selectedCategory,
                  parent,
                  subParent,
                  isMain,
                  originalName: selectedCategory,
                });
                setShowFormModal(false);
                setShowCategoryModal(true);
              }}
              disabled={selectedCategory === 'All'}
            >
              Edit Category
            </button>
            <button onClick={handleDeleteCategory} disabled={selectedCategory === 'All'}>
              Delete Category
            </button>
            <button onClick={handlePrintTable}>Print</button>
            <button onClick={handleSaveAsPDF}>Save as PDF</button>
            <button onClick={handlePrintLabel} disabled={selectedProducts.length !== 1}>
              Print Label
            </button>
            <button>
              Import
              <input
                type="file"
                accept=".xlsx, .csv"
                onChange={handleImport}
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0 }}
              />
            </button>
            <button onClick={() => handleExport('xlsx')}>Export Excel</button>
            <button onClick={() => handleExport('csv')}>Export CSV</button>
          </div>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by Name, SKU Code, Barcode, or Bottom-Tier Category (e.g., Icing Sugar - 200g)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <h3 className="section-subtitle">All Products ({filteredProducts.length})</h3>
          <div className="products-table-container">
            <table className="products-table">
              <thead>
                <tr>
                  {[
                    { key: 'id', label: 'SKU Code' },
                    { key: 'bottomTierCategory', label: 'Bottom-Tier Category' },
                    { key: 'name', label: 'Name of Product' },
                    { key: 'group', label: 'Group' },
                    { key: 'barcode', label: 'Barcode' },
                    { key: 'cost', label: 'Cost' },
                    { key: 'priceBeforeTax', label: 'Sale Price (Before Tax)' },
                    { key: 'tax', label: 'Taxes' },
                    { key: 'price', label: 'Sale Price' },
                    { key: 'markup', label: 'Markup%' },
                    { key: 'active', label: 'Active' },
                    { key: 'updatedAt', label: 'Updated' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      style={{ width: columnWidths[col.key] }}
                      onClick={() => handleSortAndFilter(col.key)}
                    >
                      <div className="th-content">
                        {col.label}
                        <span className="sort-icon">
                          {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                        <div
                          className="resize-handle"
                          onMouseDown={(e) => startResize(col.key, e)}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
                    <tr
                      key={p._id || p.id}
                      className={selectedProducts.includes(p.id) ? 'selected' : ''}
                      onClick={() => handleSelectProduct(p.id)}
                    >
                      <td style={{ width: columnWidths.id }}>{p.id}</td>
                      <td style={{ width: columnWidths.bottomTierCategory }}>{p.bottomTierCategory}</td>
                      <td style={{ width: columnWidths.name }}>{p.name}</td>
                      <td style={{ width: columnWidths.group }}>{p.group}</td>
                      <td style={{ width: columnWidths.barcode }}>{p.barcode}</td>
                      <td style={{ width: columnWidths.cost }}>${p.cost}</td>
                      <td style={{ width: columnWidths.priceBeforeTax }}>${p.priceBeforeTax}</td>
                      <td style={{ width: columnWidths.tax }}>{p.tax}%</td>
                      <td style={{ width: columnWidths.price }}>${p.price}</td>
                      <td style={{ width: columnWidths.markup }}>{p.markup}%</td>
                      <td style={{ width: columnWidths.active }}>{p.active ? '✅' : '❌'}</td>
                      <td style={{ width: columnWidths.updatedAt }}>
                        {new Date(p.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12">No products available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showFormModal && (
        <div className="modal">
          <div className="modal-content wide-modal">
            <h3 className="modal-title">{form.id ? 'Edit Product' : 'Add Product'}</h3>
            <div className="form-container">
              <div className="form-column">
                <div className="form-group">
                  <label>Product ID</label>
                  <input
                    name="id"
                    value={form.id}
                    onChange={handleChange}
                    placeholder="Product ID"
                  />
                </div>
                <div className="form-group">
                  <label>Measurement</label>
                  <div className="measurement-group">
                    <select name="measurement" value={form.measurement} onChange={handleChange}>
                      {measurements.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={customMeasurement}
                      onChange={(e) => setCustomMeasurement(e.target.value)}
                      placeholder="New measurement"
                    />
                    <button onClick={handleAddMeasurement}>Add</button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Main Category</label>
                  <div className="category-group">
                    <select name="group" value={form.group} onChange={handleChange}>
                      <option value="">Select Main Category</option>
                      {categories.filter((c) => c.isMain).map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newMainCategory}
                      onChange={(e) => setNewMainCategory(e.target.value)}
                      placeholder="New Main Category"
                    />
                    <button onClick={() => handleAddCategory('main')}>Add</button>
                  </div>
                </div>
                {form.group && (
                  <div className="form-group">
                    <label>Subcategory</label>
                    <div className="category-group">
                      <select name="subCategory" value={form.subCategory} onChange={handleChange}>
                        <option value="">Select Subcategory</option>
                        {categories
                          .find((c) => c.name === form.group)
                          ?.subcategories.map((sub) => (
                            <option key={sub.name} value={sub.name}>
                              {sub.name}
                            </option>
                          ))}
                      </select>
                      <input
                        type="text"
                        value={newSubCategory}
                        onChange={(e) => setNewSubCategory(e.target.value)}
                        placeholder="New Subcategory"
                      />
                      <button onClick={() => handleAddCategory('sub')}>Add</button>
                    </div>
                  </div>
                )}
                {form.subCategory && (
                  <div className="form-group">
                    <label>Bottom-Tier Category</label>
                    <div className="category-group">
                      <select
                        name="bottomTierCategory"
                        value={form.bottomTierCategory}
                        onChange={handleChange}
                      >
                        <option value="">Select Bottom-Tier Category</option>
                        {categories
                          .find((c) => c.name === form.group)
                          ?.subcategories.find((sub) => sub.name === form.subCategory)
                          ?.subcategories.map((subSub) => (
                            <option key={subSub} value={subSub}>
                              {subSub}
                            </option>
                          ))}
                      </select>
                      <input
                        type="text"
                        value={newBottomTierCategory}
                        onChange={(e) => setNewBottomTierCategory(e.target.value)}
                        placeholder="New Bottom-Tier Category"
                      />
                      <button onClick={() => handleAddCategory('bottom')}>Add</button>
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label>Parent Product (Level 1 Subcategory)</label>
                  <select name="parentProductId" value={form.parentProductId || ''} onChange={handleChange}>
                    <option value="">None</option>
                    {products
                      .filter((p) => {
                        for (const cat of categories) {
                          if (cat.subcategories.some((sub) => sub.name === p.subCategory)) {
                            return true;
                          }
                        }
                        return false;
                      })
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.subCategory})
                        </option>
                      ))}
                  </select>
                </div>
                {form.subCategory && (
                  <div className="form-group">
                    <label>Stock (for Level 1 Subcategory)</label>
                    <input
                      name="stock"
                      type="number"
                      value={form.stock}
                      onChange={handleChange}
                      placeholder="Stock"
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Label Notes / Custom Label</label>
                  <textarea
                    name="label"
                    value={form.label}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Label Notes / Custom Label"
                  />
                </div>
                <div className="form-group">
                  <label>Batch Number</label>
                  <input
                    name="batchNumber"
                    value={form.batchNumber}
                    onChange={handleChange}
                    placeholder="Batch Number"
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    name="expiryDate"
                    type="date"
                    value={form.expiryDate}
                    onChange={handleChange}
                    placeholder="Expiry Date"
                  />
                </div>
                <div className="form-group">
                  <label>Barcode Option</label>
                  <div className="barcode-options">
                    {['scan', 'manual', 'generate'].map((option) => (
                      <label key={option}>
                        <input
                          type="radio"
                          value={option}
                          checked={form.barcodeOption === option}
                          onChange={handleBarcodeOptionChange}
                        />
                        {option.charAt(0).toUpperCase() + option.slice(1)}{' '}
                        {option === 'scan' ? 'Barcode' : option === 'generate' ? 'Barcode' : 'Entry'}
                      </label>
                    ))}
                  </div>
                </div>
                {(form.barcodeOption === 'scan' || form.barcodeOption === 'manual') && (
                  <div className="form-group">
                    <label>Barcode</label>
                    <input
                      name="barcode"
                      value={form.barcode}
                      onChange={handleBarcodeChange}
                      placeholder={form.barcodeOption === 'scan' ? 'Scan barcode...' : 'Enter barcode'}
                    />
                  </div>
                )}
                {form.barcodeOption === 'generate' && (
                  <div className="form-group">
                    <label>Generated Barcode</label>
                    <input
                      name="barcode"
                      value={form.barcode || ''}
                      onChange={handleBarcodeChange}
                      placeholder="Generated barcode"
                      readOnly
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Barcode Type</label>
                  <select name="barcodeType" value={form.barcodeType} onChange={handleBarcodeChange}>
                    <option value="CODE128">CODE128</option>
                    <option value="EAN13">EAN13</option>
                    <option value="UPC">UPC</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Barcode Preview</label>
                  {barcodeError && <p className="error-message">{barcodeError}</p>}
                  {barcodeSvg && (
                    <div
                      className="barcode-preview"
                      dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                    />
                  )}
                  {barcodePng && !barcodeSvg && (
                    <img src={barcodePng} alt="Barcode" className="barcode-preview" />
                  )}
                  {!barcodeSvg && !barcodePng && !barcodeError && (
                    <p>No barcode preview available.</p>
                  )}
                </div>
                <div className="form-group">
                  <label>Cost</label>
                  <input
                    name="cost"
                    type="number"
                    value={form.cost}
                    onChange={handleChange}
                    placeholder="Cost"
                  />
                </div>
                <div className="form-group">
                  <label>Markup %</label>
                  <input
                    name="markup"
                    type="number"
                    value={form.markup}
                    onChange={handleChange}
                    placeholder="Markup %"
                  />
                </div>
                <div className="form-group">
                  <label>Price (Before Tax)</label>
                  <input
                    name="priceBeforeTax"
                    type="number"
                    value={form.priceBeforeTax}
                    onChange={handleChange}
                    placeholder="Price (Before Tax)"
                  />
                </div>
                <div className="form-group">
                  <label>Tax %</label>
                  <input
                    name="tax"
                    type="number"
                    value={form.tax}
                    onChange={handleChange}
                    placeholder="Tax %"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="includesTax"
                      checked={form.includesTax}
                      onChange={handleChange}
                    />
                    Includes Tax in Sale Price
                  </label>
                </div>
                <div className="form-group">
                  <label>Final Sale Price</label>
                  <input
                    name="salesPrice"
                    type="number"
                    value={form.salesPrice}
                    onChange={handleChange}
                    placeholder="Final Sale Price"
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="active"
                      checked={form.active}
                      onChange={handleChange}
                    />
                    Active
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="online"
                      checked={form.online}
                      onChange={handleChange}
                    />
                    Show on Online Store
                  </label>
                </div>
                <div className="form-group">
                  <label>Image Upload</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/png, image/jpeg"
                  />
                  {form.image && <img src={form.image} alt="preview" className="image-preview" />}
                </div>
                <div className="form-group">
                  <LabelDesigner
                    labelDesign={form.labelDesign || defaultLabelDesign}
                    setLabelDesign={(newDesign) =>
                      setForm((prev) => ({ ...prev, labelDesign: newDesign }))
                    }
                    product={form}
                    barcodeImg={barcodePng || barcodeSvg}
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={handleSubmit}>
                Save Product
              </button>
              <button type="button" onClick={() => setShowFormModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal">
          <div className="modal-content">
            <h3 className="modal-title">{categoryForm.name ? 'Edit Category' : 'Add Category'}</h3>
            <div className="form-group">
              <label>Category Name</label>
              <input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Category Name"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={categoryForm.isMain}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      isMain: e.target.checked,
                      parent: '',
                      subParent: '',
                    })
                  }
                  disabled={categoryForm.originalName && !categoryForm.isMain}
                />
                Is Main Category
              </label>
            </div>
            {!categoryForm.isMain && (
              <>
                <div className="form-group">
                  <label>Main Category</label>
                  <select
                    value={categoryForm.parent}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, parent: e.target.value, subParent: '' })
                    }
                  >
                    <option value="">Select Main Category</option>
                    {categories.filter((c) => c.isMain).map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                {categoryForm.parent && (
                  <div className="form-group">
                    <label>Subcategory</label>
                    <select
                      value={categoryForm.subParent}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, subParent: e.target.value })
                      }
                    >
                      <option value="">Select Subcategory</option>
                      {categories
                        .find((c) => c.name === categoryForm.parent)
                        ?.subcategories.map((sub) => (
                          <option key={sub.name} value={sub.name}>
                            {sub.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </>
            )}
            <div className="modal-actions">
              <button type="button" onClick={handleCategorySubmit}>
                Save Category
              </button>
              <button type="button" onClick={() => setShowCategoryModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;