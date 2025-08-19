import React, { useState, useRef, useEffect } from 'react';
import type { Account as AccountType } from '../types';

interface AccountProps {
  account: AccountType;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
}

export const Account: React.FC<AccountProps> = ({ account, position, onPositionChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

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
      className="account"
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
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '20px',
          backgroundColor: account.color || '#3b82f6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDragging 
            ? `0 0 30px ${account.color || '#3b82f6'}, 0 10px 20px rgba(0,0,0,0.3)`
            : '0 4px 20px rgba(0,0,0,0.1)',
          border: '3px solid rgba(255,255,255,0.2)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'box-shadow 0.2s, transform 0.2s',
          transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <span style={{ 
          color: 'white', 
          fontWeight: 'bold', 
          fontSize: '16px', 
          zIndex: 1,
          pointerEvents: 'none',
        }}>
          {account.name}
        </span>
        <span style={{ 
          color: 'white', 
          fontSize: '20px', 
          fontWeight: 'bold', 
          zIndex: 1,
          pointerEvents: 'none',
        }}>
          ${account.balance.toLocaleString()}
        </span>
      </div>
    </div>
  );
};