// client/src/components/AppBuilder/AppBuilder.js
import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button, TextField, Typography, Box } from '@mui/material';
import './AppBuilder.css';

const ItemTypes = { COMPONENT: 'component' };

const DraggableComponent = ({ id, type, text, left, top }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.COMPONENT,
    item: { id, left, top },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  return type === 'button' ? (
    <Button
      ref={drag}
      variant="contained"
      style={{ position: 'absolute', left, top, opacity: isDragging ? 0.5 : 1 }}
    >
      {text}
    </Button>
  ) : (
    <TextField
      ref={drag}
      label={text}
      style={{ position: 'absolute', left, top, opacity: isDragging ? 0.5 : 1 }}
    />
  );
};

const AppBuilder = () => {
  const [components, setComponents] = useState([
    { id: 1, type: 'button', text: 'Add Item', left: 10, top: 10 },
    { id: 2, type: 'text', text: 'Product Name', left: 10, top: 50 },
  ]);

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.COMPONENT,
    drop: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      const left = Math.round(item.left + delta.x);
      const top = Math.round(item.top + delta.y);
      setComponents((prev) =>
        prev.map((comp) =>
          comp.id === item.id ? { ...comp, left, top } : comp
        )
      );
    },
  }));

  const generateCode = () => {
    const code = components.map((comp) => ({
      id: comp.id,
      type: comp.type,
      text: comp.text,
      style: { position: 'absolute', left: comp.left, top: comp.top },
    }));
    return JSON.stringify(code, null, 2);
  };

  return (
    <Box sx={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>App Builder</Typography>
      <DndProvider backend={HTML5Backend}>
        <div>
          <div
            ref={drop}
            style={{
              width: '100%',
              height: '600px',
              position: 'relative',
              border: '1px dashed gray',
              backgroundColor: '#f5f5f5',
            }}
          >
            {components.map((comp) => (
              <DraggableComponent key={comp.id} {...comp} />
            ))}
          </div>
          <Button variant="contained" onClick={() => alert(generateCode())} sx={{ mt: 2 }}>
            Generate Code
          </Button>
        </div>
      </DndProvider>
    </Box>
  );
};

export default AppBuilder;