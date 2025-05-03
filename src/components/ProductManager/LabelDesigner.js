import React, { useState, useRef, useEffect, useCallback } from 'react';
import './LabelDesigner.css';

const LabelDesigner = ({ labelDesign, setLabelDesign, product, barcodeImg }) => {
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [rotating, setRotating] = useState(null);
  const [editing, setEditing] = useState(null); // Track which element is being edited
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const labelRef = useRef(null);
  const fileInputRef = useRef(null);
  const widthInputRef = useRef(null);

  // Conversion factor: 1mm = 3.78 pixels (96 DPI), doubled for 2x size
  const MM_TO_PX = 3.78 * 2;

  // Default label design
  const defaultLabelDesign = {
    size: 'medium',
    width: 100,
    height: 50,
    elements: [],
    positions: {},
    sizes: {},
    rotations: {},
    logo: null,
    logoSize: { width: 30, height: 30 },
    logoPosition: { x: 0, y: 0 },
    logoRotation: 0,
    includeLogo: false,
  };

  // Ensure labelDesign has all required properties
  const safeLabelDesign = {
    size: labelDesign?.size || 'medium',
    width: labelDesign?.width || 100,
    height: labelDesign?.height || 50,
    elements: labelDesign?.elements || [],
    positions: labelDesign?.positions || {},
    sizes: labelDesign?.sizes || {},
    rotations: labelDesign?.rotations || {},
    logo: labelDesign?.logo || null,
    logoSize: labelDesign?.logoSize || { width: 30, height: 30 },
    logoPosition: labelDesign?.logoPosition || { x: 0, y: 0 },
    logoRotation: labelDesign?.logoRotation || 0,
    includeLogo: labelDesign?.includeLogo || false,
  };

  // Debug props and state
  useEffect(() => {
    console.log('LabelDesigner props:', { labelDesign, product, barcodeImg });
    console.log('LabelDesigner: safeLabelDesign updated:', safeLabelDesign);
  }, [safeLabelDesign, labelDesign, product, barcodeImg]);

  // Debug editing state
  useEffect(() => {
    console.log('Editing state changed:', editing);
  }, [editing]);

  // Load templates from local storage
  useEffect(() => {
    const savedTemplates = JSON.parse(localStorage.getItem('labelTemplates') || '[]');
    setTemplates(savedTemplates);
  }, []);

  // Save template
  const saveTemplate = () => {
    const templateName = prompt('Enter template name:');
    if (!templateName) return;

    const template = {
      name: templateName,
      size: safeLabelDesign.size,
      width: safeLabelDesign.width,
      height: safeLabelDesign.height,
      elements: safeLabelDesign.elements.map((el) => ({
        id: el.id,
        type: el.type,
        content: el.type === 'text' || el.type === 'name' || el.type === 'price' || el.type === 'batchNumber' || el.type === 'expiryDate' ? el.content : null,
      })),
      positions: safeLabelDesign.positions,
      sizes: safeLabelDesign.sizes,
      rotations: safeLabelDesign.rotations,
      logoSize: safeLabelDesign.logoSize,
      logoPosition: safeLabelDesign.logoPosition,
      logoRotation: safeLabelDesign.logoRotation,
      includeLogo: safeLabelDesign.includeLogo,
    };

    const updatedTemplates = [...templates, template];
    setTemplates(updatedTemplates);
    localStorage.setItem('labelTemplates', JSON.stringify(updatedTemplates));
    setSelectedTemplate(templateName);
  };

  // Load template
  const loadTemplate = (templateName) => {
    const template = templates.find((t) => t.name === templateName);
    if (!template) return;

    const newElements = template.elements.map((el) => ({
      ...el,
      content:
        el.type === 'text'
          ? el.content
          : el.type === 'name'
          ? product.name || el.content || 'Unnamed Product'
          : el.type === 'price'
          ? `$${product.salesPrice || el.content || '0.00'}`
          : el.type === 'batchNumber'
          ? product.batchNumber || el.content || 'N/A'
          : el.type === 'expiryDate'
          ? product.expiryDate || el.content || 'N/A'
          : el.type === 'barcode'
          ? barcodeImg
          : el.type === 'image'
          ? product.image
          : null,
    }));

    setLabelDesign({
      size: template.size,
      width: template.width,
      height: template.height,
      elements: newElements,
      positions: template.positions,
      sizes: template.sizes,
      rotations: template.rotations,
      logoSize: template.logoSize,
      logoPosition: template.logoPosition,
      logoRotation: template.logoRotation,
      includeLogo: template.includeLogo,
      logo: safeLabelDesign.logo,
    });
    setSelectedTemplate(templateName);
  };

  // Add element
  const handleAddElement = (type) => {
    console.log('Adding element:', type, { product, barcodeImg });
    const newElement = {
      id: Date.now(),
      type,
      content:
        type === 'text'
          ? 'Sample Text'
          : type === 'name'
          ? product.name || 'Unnamed Product'
          : type === 'price'
          ? `$${product.salesPrice || '0.00'}`
          : type === 'batchNumber'
          ? product.batchNumber || 'N/A'
          : type === 'expiryDate'
          ? product.expiryDate || 'N/A'
          : type === 'barcode'
          ? barcodeImg
          : type === 'image'
          ? product.image
          : '',
    };
    const updatedLabelDesign = {
      ...safeLabelDesign,
      elements: [...safeLabelDesign.elements, newElement],
      positions: { ...safeLabelDesign.positions, [newElement.id]: { x: 0, y: 0 } },
      sizes: { ...safeLabelDesign.sizes, [newElement.id]: { width: 100, height: 50 } },
      rotations: { ...safeLabelDesign.rotations, [newElement.id]: 0 },
    };
    setLabelDesign(updatedLabelDesign);
    console.log('Updated labelDesign:', updatedLabelDesign);
  };

  // Delete element
  const handleDeleteElement = (id) => {
    const updatedLabelDesign = {
      ...safeLabelDesign,
      elements: safeLabelDesign.elements.filter((el) => el.id !== id),
      positions: { ...safeLabelDesign.positions, [id]: undefined },
      sizes: { ...safeLabelDesign.sizes, [id]: undefined },
      rotations: { ...safeLabelDesign.rotations, [id]: undefined },
    };
    setLabelDesign(updatedLabelDesign);
    console.log('Deleted element, updated labelDesign:', updatedLabelDesign);
    if (editing === id) setEditing(null);
  };

  // Reset label
  const handleResetLabel = () => {
    setLabelDesign(defaultLabelDesign);
    setEditing(null);
    console.log('Label reset to:', defaultLabelDesign);
  };

  // Start editing
  const startEditing = (id) => {
    console.log('Starting edit for element:', id);
    setEditing(id);
  };

  // Save edited content
  const saveEdit = (id, value) => {
    console.log('Saving edit:', { id, value });
    setLabelDesign({
      ...safeLabelDesign,
      elements: safeLabelDesign.elements.map((el) =>
        el.id === id ? { ...el, content: value } : el
      ),
    });
    setEditing(null);
  };

  // Handle drag
  const handleMouseDown = (e, id, action) => {
    e.preventDefault();
    e.stopPropagation();
    if (action === 'drag') {
      setDragging(id);
    } else if (action === 'resize') {
      setResizing(id);
    } else if (action === 'rotate') {
      setRotating(id);
    }
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (dragging !== null) {
        const rect = labelRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - (safeLabelDesign.sizes[dragging]?.width || 100) / 2;
        const y = e.clientY - rect.top - (safeLabelDesign.sizes[dragging]?.height || 50) / 2;
        const boundedX = Math.max(0, Math.min(x, safeLabelDesign.width * MM_TO_PX - (safeLabelDesign.sizes[dragging]?.width || 100)));
        const boundedY = Math.max(0, Math.min(y, safeLabelDesign.height * MM_TO_PX - (safeLabelDesign.sizes[dragging]?.height || 50)));
        setLabelDesign({
          ...safeLabelDesign,
          positions: { ...safeLabelDesign.positions, [dragging]: { x: boundedX, y: boundedY } },
        });
      } else if (resizing !== null) {
        const rect = labelRef.current.getBoundingClientRect();
        const width = e.clientX - rect.left - (safeLabelDesign.positions[resizing]?.x || 0);
        const height = e.clientY - rect.top - (safeLabelDesign.positions[resizing]?.y || 0);
        setLabelDesign({
          ...safeLabelDesign,
          sizes: {
            ...safeLabelDesign.sizes,
            [resizing]: {
              width: Math.max(20, width),
              height: Math.max(20, height),
            },
          },
        });
      } else if (rotating !== null) {
        const rect = labelRef.current.getBoundingClientRect();
        const centerX = rect.left + (safeLabelDesign.positions[rotating]?.x || 0) + (safeLabelDesign.sizes[rotating]?.width || 100) / 2;
        const centerY = rect.top + (safeLabelDesign.positions[rotating]?.y || 0) + (safeLabelDesign.sizes[rotating]?.height || 50) / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const snappedAngle = Math.round(angle / 90) * 90;
        setLabelDesign({
          ...safeLabelDesign,
          rotations: { ...safeLabelDesign.rotations, [rotating]: snappedAngle },
        });
      }
    },
    [dragging, resizing, rotating, safeLabelDesign]
  );

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
    setRotating(null);
  };

  // Logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLabelDesign({
          ...safeLabelDesign,
          logo: reader.result,
          includeLogo: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Logo drag
  const handleLogoMouseDown = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    if (action === 'drag') {
      setDragging('logo');
    } else if (action === 'resize') {
      setResizing('logo');
    } else if (action === 'rotate') {
      setRotating('logo');
    }
  };

  const handleLogoMouseMove = useCallback(
    (e) => {
      if (dragging === 'logo') {
        const rect = labelRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - (safeLabelDesign.logoSize.width || 30) / 2;
        const y = e.clientY - rect.top - (safeLabelDesign.logoSize.height || 30) / 2;
        const boundedX = Math.max(0, Math.min(x, safeLabelDesign.width * MM_TO_PX - (safeLabelDesign.logoSize.width || 30)));
        const boundedY = Math.max(0, Math.min(y, safeLabelDesign.height * MM_TO_PX - (safeLabelDesign.logoSize.height || 30)));
        setLabelDesign({
          ...safeLabelDesign,
          logoPosition: { x: boundedX, y: boundedY },
        });
      } else if (resizing === 'logo') {
        const rect = labelRef.current.getBoundingClientRect();
        const width = e.clientX - rect.left - (safeLabelDesign.logoPosition.x || 0);
        const height = e.clientY - rect.top - (safeLabelDesign.logoPosition.y || 0);
        setLabelDesign({
          ...safeLabelDesign,
          logoSize: {
            width: Math.max(20, width),
            height: Math.max(20, height),
          },
        });
      } else if (rotating === 'logo') {
        const rect = labelRef.current.getBoundingClientRect();
        const centerX = rect.left + (safeLabelDesign.logoPosition.x || 0) + (safeLabelDesign.logoSize.width || 30) / 2;
        const centerY = rect.top + (safeLabelDesign.logoPosition.y || 0) + (safeLabelDesign.logoSize.height || 30) / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const snappedAngle = Math.round(angle / 90) * 90;
        setLabelDesign({
          ...safeLabelDesign,
          logoRotation: snappedAngle,
        });
      }
    },
    [dragging, resizing, rotating, safeLabelDesign]
  );

  useEffect(() => {
    const handler = (e) => {
      handleMouseMove(e);
      handleLogoMouseMove(e);
    };
    document.addEventListener('mousemove', handler);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handler);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleLogoMouseMove]);

  // Render element content
  const renderElementContent = (el) => {
    console.log('Rendering element:', { id: el.id, type: el.type, content: el.content, editing: editing === el.id });
    if (el.type === 'barcode' && el.content?.includes('<svg')) {
      return <div dangerouslySetInnerHTML={{ __html: el.content }} />;
    } else if (el.type === 'image' || el.type === 'barcode') {
      return <img src={el.content} alt={el.type} style={{ width: '100%', height: '100%' }} />;
    } else if (editing === el.id) {
      return (
        <textarea
          value={el.content}
          onChange={(e) => saveEdit(el.id, e.target.value)}
          onBlur={() => saveEdit(el.id, el.content)} // Save on blur
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              saveEdit(el.id, e.target.value);
            }
          }}
          autoFocus
          style={{
            width: '100%',
            height: '100%',
            fontSize: `${Math.min(safeLabelDesign.sizes[el.id]?.width * 0.1, safeLabelDesign.sizes[el.id]?.height * 0.5) || 14}px`,
            whiteSpace: 'pre-wrap',
            resize: 'none',
            border: '1px solid #ffd700',
            background: '#fff',
            padding: '10px', // Avoid overlap with delete button
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 20, // Above drag-handle
          }}
        />
      );
    } else {
      return (
        <span
          style={{
            width: '100%',
            height: '100%',
            fontSize: `${Math.min(safeLabelDesign.sizes[el.id]?.width * 0.1, safeLabelDesign.sizes[el.id]?.height * 0.5) || 14}px`,
            whiteSpace: 'pre-wrap',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '10px', // Avoid overlap with delete button
            boxSizing: 'border-box',
          }}
          onDoubleClick={(e) => {
            e.stopPropagation(); // Prevent drag
            startEditing(el.id);
          }}
        >
          {el.content}
        </span>
      );
    }
  };

  return (
    <div className="label-designer">
      <h4>Label Designer</h4>
      <div className="label-controls">
        <select
          value={safeLabelDesign.size}
          onChange={(e) => {
            const size = e.target.value;
            if (size === 'custom') {
              widthInputRef.current?.focus();
              return;
            }
            const dimensions = {
              small: { width: 50, height: 25 },
              medium: { width: 100, height: 50 },
              large: { width: 150, height: 75 },
            }[size];
            setLabelDesign({
              ...safeLabelDesign,
              size,
              width: dimensions.width,
              height: dimensions.height,
            });
          }}
        >
          <option value="small">Small (50x25mm)</option>
          <option value="medium">Medium (100x50mm)</option>
          <option value="large">Large (150x75mm)</option>
          <option value="custom">Custom</option>
        </select>
        <input
          ref={widthInputRef}
          type="number"
          value={safeLabelDesign.width}
          onChange={(e) =>
            setLabelDesign({
              ...safeLabelDesign,
              width: parseFloat(e.target.value) || 100,
              size: 'custom',
            })
          }
          placeholder="Width (mm)"
          min="10"
        />
        <input
          type="number"
          value={safeLabelDesign.height}
          onChange={(e) =>
            setLabelDesign({
              ...safeLabelDesign,
              height: parseFloat(e.target.value) || 50,
              size: 'custom',
            })
          }
          placeholder="Height (mm)"
          min="10"
        />
        <select
          value={selectedTemplate}
          onChange={(e) => loadTemplate(e.target.value)}
        >
          <option value="">Select Template</option>
          {templates.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
        <button onClick={saveTemplate}>Save Template</button>
        <button onClick={handleResetLabel}>Reset Label</button>
        <button onClick={() => handleAddElement('text')}>Add Text</button>
        <button onClick={() => handleAddElement('name')}>Add Product Name</button>
        <button onClick={() => handleAddElement('price')}>Add Price</button>
        <button onClick={() => handleAddElement('batchNumber')}>Add Batch Number</button>
        <button onClick={() => handleAddElement('expiryDate')}>Add Expiry Date</button>
        <button onClick={() => handleAddElement('barcode')} disabled={!barcodeImg}>
          Add Barcode
        </button>
        <button onClick={() => handleAddElement('image')} disabled={!product.image}>
          Add Image
        </button>
        <label>
          <input
            type="checkbox"
            checked={safeLabelDesign.includeLogo}
            onChange={(e) =>
              setLabelDesign({
                ...safeLabelDesign,
                includeLogo: e.target.checked,
              })
            }
          />
          Include Logo
        </label>
        {safeLabelDesign.includeLogo && (
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoUpload}
            accept="image/png, image/jpeg"
          />
        )}
      </div>
      <div
        className="label-preview"
        ref={labelRef}
        style={{
          width: `${safeLabelDesign.width * MM_TO_PX}px`,
          height: `${safeLabelDesign.height * MM_TO_PX}px`,
          position: 'relative',
          border: '1px solid #000',
          background: '#fff',
          margin: '20px auto',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        }}
      >
        {safeLabelDesign.elements.length === 0 && (
          <div className="empty-preview">Add elements to design your label</div>
        )}
        {safeLabelDesign.elements.map((el) => (
          <div
            key={el.id}
            className="label-element"
            style={{
              position: 'absolute',
              left: safeLabelDesign.positions[el.id]?.x || 0,
              top: safeLabelDesign.positions[el.id]?.y || 0,
              width: safeLabelDesign.sizes[el.id]?.width || 100,
              height: safeLabelDesign.sizes[el.id]?.height || 50,
              transform: `rotate(${safeLabelDesign.rotations[el.id] || 0}deg)`,
              transformOrigin: 'center center',
              border: '1px dashed #ffd700',
              cursor: dragging === el.id ? 'grabbing' : 'grab',
              overflow: 'hidden',
              zIndex: 10,
            }}
          >
            {renderElementContent(el)}
            <div
              className="drag-handle"
              onMouseDown={(e) => handleMouseDown(e, el.id, 'drag')}
              style={{ zIndex: 15 }}
            />
            <div
              className="resize-handle"
              onMouseDown={(e) => handleMouseDown(e, el.id, 'resize')}
              style={{ zIndex: 15 }}
            />
            <div
              className="rotate-handle"
              onMouseDown={(e) => handleMouseDown(e, el.id, 'rotate')}
              style={{ zIndex: 15 }}
            />
            <button
              className="delete-button"
              onClick={() => handleDeleteElement(el.id)}
              style={{ zIndex: 15 }}
            >
              ×
            </button>
          </div>
        ))}
        {safeLabelDesign.includeLogo && safeLabelDesign.logo && (
          <div
            className="label-element logo"
            style={{
              position: 'absolute',
              left: safeLabelDesign.logoPosition.x,
              top: safeLabelDesign.logoPosition.y,
              width: safeLabelDesign.logoSize.width,
              height: safeLabelDesign.logoSize.height,
              transform: `rotate(${safeLabelDesign.logoRotation || 0}deg)`,
              transformOrigin: 'center center',
              border: '1px dashed #ffd700',
              cursor: dragging === 'logo' ? 'grabbing' : 'grab',
              zIndex: 10,
            }}
          >
            <img
              src={safeLabelDesign.logo}
              alt="Logo"
              style={{ width: '100%', height: '100%' }}
            />
            <div
              className="drag-handle"
              onMouseDown={(e) => handleLogoMouseDown(e, 'drag')}
              style={{ zIndex: 15 }}
            />
            <div
              className="resize-handle"
              onMouseDown={(e) => handleLogoMouseDown(e, 'resize')}
              style={{ zIndex: 15 }}
            />
            <div
              className="rotate-handle"
              onMouseDown={(e) => handleLogoMouseDown(e, 'rotate')}
              style={{ zIndex: 15 }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LabelDesigner;