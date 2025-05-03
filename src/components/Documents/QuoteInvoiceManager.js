import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';

const QuoteInvoiceManager = () => {
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({
    customer: '',
    items: [],
    type: 'quote',
    notes: '',
  });

  const [currentItem, setCurrentItem] = useState({ description: '', quantity: 1, price: 0 });

  const fetchDocs = async () => {
    const res = await axios.get('/api/documents');
    setDocuments(res.data);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleAddItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, currentItem],
    }));
    setCurrentItem({ description: '', quantity: 1, price: 0 });
  };

  const handleSave = async () => {
    await axios.post('/api/documents', form);
    setForm({ customer: '', items: [], type: 'quote', notes: '' });
    fetchDocs();
  };

  const handleDownloadPDF = (doc) => {
    const pdf = new jsPDF();
    pdf.text(`${doc.type.toUpperCase()} for ${doc.customer}`, 10, 10);
    doc.items.forEach((item, idx) => {
      pdf.text(`${item.description} x ${item.quantity} = $${item.quantity * item.price}`, 10, 20 + idx * 10);
    });
    pdf.save(`${doc.type}-${doc._id}.pdf`);
  };

  const handleSendEmail = async (docId) => {
    await axios.post(`/api/documents/${docId}/email`);
    alert('Email sent!');
  };

  const handleSendWhatsApp = (doc) => {
    let message = `*${doc.type.toUpperCase()}* for ${doc.customer}\n\n`;
    doc.items.forEach((item, idx) => {
      message += `• ${item.description} x ${item.quantity} = $${item.quantity * item.price}\n`;
    });
    message += `\nThank you for doing business with us!`;
  
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = prompt("Enter the customer's WhatsApp number (e.g., 27821234567):");
  
    if (phoneNumber) {
      const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="p-4">
      <h2>Quote / Invoice Manager</h2>

      <div className="mb-4">
        <input placeholder="Customer" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="quote">Quote</option>
          <option value="invoice">Invoice</option>
        </select>
        <input
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <div>
          <input
            placeholder="Description"
            value={currentItem.description}
            onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Quantity"
            value={currentItem.quantity}
            onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Price"
            value={currentItem.price}
            onChange={(e) => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) })}
          />
          <button onClick={handleAddItem}>Add Item</button>
        </div>
        <button onClick={handleSave}>Save Document</button>
      </div>

      <h3>Existing Documents</h3>
      <ul>
        {documents.map((doc) => (
          <li key={doc._id}>
            {doc.type.toUpperCase()} - {doc.customer} - {doc.items.length} items
            <button onClick={() => handleDownloadPDF(doc)}>Download PDF</button>
            <button onClick={() => handleSendEmail(doc._id)}>Email</button>
            <button onClick={() => handleSendWhatsApp(doc)}>WhatsApp</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuoteInvoiceManager;
