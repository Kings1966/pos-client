import React, { useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemTypes = { BOX: 'box' };

const DraggableBox = () => {
  console.log('Rendering DraggableBox');
  const [{ isDragging }, drag] = useDrag({
    item: { type: ItemTypes.BOX },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        width: '100px',
        height: '100px',
        background: 'blue',
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
      }}
    >
      Drag me
    </div>
  );
};

const DropArea = () => {
  console.log('Rendering DropArea');
  const dropRef = useRef(null);
  const errorRef = useRef(null);

  try {
    const [, drop] = useDrop({
      accept: ItemTypes.BOX,
      drop: () => console.log('Dropped!'),
    });
    dropRef.current = drop;
  } catch (error) {
    console.error('Error in DropArea useDrop:', error);
    errorRef.current = error.message;
  }

  if (errorRef.current) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Drag-and-Drop Error</h2>
        <p>{errorRef.current}</p>
      </div>
    );
  }

  return (
    <div
      ref={dropRef.current}
      style={{ width: '300px', height: '300px', border: '1px solid black', marginTop: '20px' }}
    >
      Drop here
    </div>
  );
};

const TestDnd = () => {
  console.log('Rendering TestDnd');
  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: '20px' }}>
        <DraggableBox />
        <DropArea />
      </div>
    </DndProvider>
  );
};

export default TestDnd;