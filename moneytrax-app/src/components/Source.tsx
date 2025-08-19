import React from 'react';
import type { Source as SourceType } from '../types';

interface SourceProps {
  source: SourceType;
  position: { x: number; y: number };
}

export const Source: React.FC<SourceProps> = ({ source, position }) => {
  const color = source.type === 'income' ? '#4ade80' : '#f87171';
  
  return (
    <div
      className="source"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
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
          boxShadow: `0 0 20px ${color}`,
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
          {source.name}
        </span>
        <span style={{ color: 'white', fontSize: '12px' }}>
          ${source.amount}/mo
        </span>
      </div>
    </div>
  );
};