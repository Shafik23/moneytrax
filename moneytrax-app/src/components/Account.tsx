import React from 'react';
import type { Account as AccountType } from '../types';

interface AccountProps {
  account: AccountType;
  position: { x: number; y: number };
}

export const Account: React.FC<AccountProps> = ({ account, position }) => {
  return (
    <div
      className="account"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
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
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '3px solid rgba(255,255,255,0.2)',
          position: 'relative',
          overflow: 'hidden',
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
          }}
        />
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', zIndex: 1 }}>
          {account.name}
        </span>
        <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', zIndex: 1 }}>
          ${account.balance.toLocaleString()}
        </span>
      </div>
    </div>
  );
};