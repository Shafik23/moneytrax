import React, { useState, useRef } from 'react';
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
  const nodeRadius = 60;

  const clamp = (value: number, min: number, max: number) => {
    const upperBound = Math.max(min, max);
    return Math.min(Math.max(value, min), upperBound);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = elementRef.current?.getBoundingClientRect();
    if (rect) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      setIsDragging(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    onPositionChange({
      x: clamp(e.clientX - dragOffset.x, nodeRadius, window.innerWidth - nodeRadius),
      y: clamp(e.clientY - dragOffset.y, nodeRadius, window.innerHeight - nodeRadius),
    });
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    setIsDragging(false);
  };

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
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
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
