import { useState, useEffect } from 'react';
import './App.css';
import { Source } from './components/Source';
import { Account } from './components/Account';
import { AnimatedStream } from './components/AnimatedStream';
import type { Source as SourceType, Account as AccountType, Stream } from './types';

const initialSources: SourceType[] = [
  { id: '1', name: 'Salary', amount: 5000, type: 'income' },
  { id: '2', name: 'Freelance', amount: 1500, type: 'income' },
  { id: '3', name: 'Investments', amount: 800, type: 'income' },
  { id: '4', name: 'Rent', amount: 1800, type: 'expense' },
  { id: '5', name: 'Groceries', amount: 600, type: 'expense' },
  { id: '6', name: 'Utilities', amount: 300, type: 'expense' },
];

const initialAccounts: AccountType[] = [
  { id: '1', name: 'Checking', balance: 12500, color: '#3b82f6' },
  { id: '2', name: 'Savings', balance: 25000, color: '#8b5cf6' },
  { id: '3', name: 'Investment', balance: 45000, color: '#06b6d4' },
];

const initialStreams: Stream[] = [
  { id: '1', sourceId: '1', accountId: '1', amount: 4000, active: true },
  { id: '2', sourceId: '1', accountId: '2', amount: 1000, active: true },
  { id: '3', sourceId: '2', accountId: '1', amount: 1500, active: true },
  { id: '4', sourceId: '3', accountId: '3', amount: 800, active: true },
  { id: '5', sourceId: '4', accountId: '1', amount: -1800, active: true },
  { id: '6', sourceId: '5', accountId: '1', amount: -600, active: true },
  { id: '7', sourceId: '6', accountId: '1', amount: -300, active: true },
];

interface Position {
  x: number;
  y: number;
}

function App() {
  const [sources] = useState<SourceType[]>(initialSources);
  const [accounts] = useState<AccountType[]>(initialAccounts);
  const [streams] = useState<Stream[]>(initialStreams);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [sourcePositions, setSourcePositions] = useState<Record<string, Position>>({});
  const [accountPositions, setAccountPositions] = useState<Record<string, Position>>({});

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Initialize positions when dimensions are available
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    // Initialize source positions if not set
    const newSourcePositions: Record<string, Position> = {};
    const incomeSourcesIndexed = sources.filter(s => s.type === 'income');
    const expenseSourcesIndexed = sources.filter(s => s.type === 'expense');

    incomeSourcesIndexed.forEach((source, index) => {
      if (!sourcePositions[source.id]) {
        newSourcePositions[source.id] = getDefaultSourcePosition(index, 'income');
      }
    });

    expenseSourcesIndexed.forEach((source, index) => {
      if (!sourcePositions[source.id]) {
        newSourcePositions[source.id] = getDefaultSourcePosition(index, 'expense');
      }
    });

    if (Object.keys(newSourcePositions).length > 0) {
      setSourcePositions(prev => ({ ...prev, ...newSourcePositions }));
    }

    // Initialize account positions if not set
    const newAccountPositions: Record<string, Position> = {};
    accounts.forEach((account, index) => {
      if (!accountPositions[account.id]) {
        newAccountPositions[account.id] = getDefaultAccountPosition(index);
      }
    });

    if (Object.keys(newAccountPositions).length > 0) {
      setAccountPositions(prev => ({ ...prev, ...newAccountPositions }));
    }
  }, [dimensions, sources, accounts]);

  const getDefaultSourcePosition = (index: number, type: 'income' | 'expense') => {
    const isIncome = type === 'income';
    const count = sources.filter(s => s.type === type).length;
    const spacing = 150;
    const startY = 150;
    const x = isIncome ? 150 : dimensions.width - 150;
    const totalHeight = (count - 1) * spacing;
    const y = startY + (index * spacing) - (totalHeight / 2) + (dimensions.height / 2 - startY);
    
    return { x, y };
  };

  const getDefaultAccountPosition = (index: number) => {
    const count = accounts.length;
    const spacing = 200;
    const totalWidth = (count - 1) * spacing;
    const x = (dimensions.width / 2) - (totalWidth / 2) + (index * spacing);
    const y = dimensions.height / 2;
    
    return { x, y };
  };

  const updateSourcePosition = (id: string, position: Position) => {
    setSourcePositions(prev => ({ ...prev, [id]: position }));
  };

  const updateAccountPosition = (id: string, position: Position) => {
    setAccountPositions(prev => ({ ...prev, [id]: position }));
  };

  if (dimensions.width === 0 || dimensions.height === 0) {
    return (
      <div className="app">
        <h1 className="title">MoneyTrax</h1>
        <div className="subtitle">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1 className="title">MoneyTrax</h1>
      <div className="subtitle">Watch your money flow in real-time</div>
      
      {sources.map((source) => {
        const position = sourcePositions[source.id];
        if (!position) return null;
        
        return (
          <Source
            key={source.id}
            source={source}
            position={position}
            onPositionChange={(newPos) => updateSourcePosition(source.id, newPos)}
          />
        );
      })}

      {accounts.map((account) => {
        const position = accountPositions[account.id];
        if (!position) return null;
        
        return (
          <Account
            key={account.id}
            account={account}
            position={position}
            onPositionChange={(newPos) => updateAccountPosition(account.id, newPos)}
          />
        );
      })}

      {streams.map((stream) => {
        const source = sources.find(s => s.id === stream.sourceId);
        const account = accounts.find(a => a.id === stream.accountId);
        if (!source || !account) return null;

        const sourcePos = sourcePositions[source.id];
        const accountPos = accountPositions[account.id];
        if (!sourcePos || !accountPos) return null;

        // For income: flow from source to account
        // For expense: flow from account to source (reversed)
        const fromPos = source.type === 'income' ? sourcePos : accountPos;
        const toPos = source.type === 'income' ? accountPos : sourcePos;
        
        return (
          <AnimatedStream
            key={stream.id}
            from={fromPos}
            to={toPos}
            color={source.type === 'income' ? '#4ade80' : '#f87171'}
            active={stream.active}
          />
        );
      })}
    </div>
  );
}

export default App;