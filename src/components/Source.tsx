import React, { useState, useRef, useEffect } from 'react';
import type { Source as SourceType } from '../types';

interface SourceProps {
  source: SourceType;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
}

export const Source: React.FC<SourceProps> = ({ source, position, onPositionChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  
  const color = source.type === 'income' ? '#4ade80' : '#f87171';

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = elementRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onPositionChange({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);
  
  return (
    <div
      ref={elementRef}
      className="source"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 1000 : 2,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="source-circle"
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: color,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDragging 
            ? `0 0 30px ${color}, 0 10px 20px rgba(0,0,0,0.3)` 
            : `0 0 20px ${color}`,
          transition: 'box-shadow 0.2s, transform 0.2s',
          transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          userSelect: 'none',
        }}
      >
        <span style={{ 
          color: 'white', 
          fontWeight: 'bold', 
          fontSize: '14px',
          pointerEvents: 'none',
        }}>
          {source.name}
        </span>
        <span style={{ 
          color: 'white', 
          fontSize: '12px',
          pointerEvents: 'none',
        }}>
          ${source.amount}/mo
        </span>
      </div>
    </div>
  );
};