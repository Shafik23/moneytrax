import { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { Source } from './components/Source';
import { Account } from './components/Account';
import { AnimatedStream } from './components/AnimatedStream';
import type { StreamPath } from './components/AnimatedStream';
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

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function App() {
  const [sources] = useState<SourceType[]>(initialSources);
  const [accounts] = useState<AccountType[]>(initialAccounts);
  const [streams] = useState<Stream[]>(initialStreams);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [sourcePositions, setSourcePositions] = useState<Record<string, Position>>({});
  const [accountPositions, setAccountPositions] = useState<Record<string, Position>>({});

  const summary = useMemo(() => {
    const monthlyIncome = sources
      .filter((source) => source.type === 'income')
      .reduce((total, source) => total + source.amount, 0);
    const monthlyExpenses = sources
      .filter((source) => source.type === 'expense')
      .reduce((total, source) => total + source.amount, 0);
    const totalBalance = accounts.reduce((total, account) => total + account.balance, 0);
    const activeStreams = streams.filter((stream) => stream.active).length;

    return {
      monthlyIncome,
      monthlyExpenses,
      monthlyNet: monthlyIncome - monthlyExpenses,
      totalBalance,
      activeStreams,
    };
  }, [accounts, sources, streams]);

  const clampPosition = useCallback((position: Position, radius: number) => ({
    x: Math.min(Math.max(position.x, radius), Math.max(radius, dimensions.width - radius)),
    y: Math.min(Math.max(position.y, radius), Math.max(radius, dimensions.height - radius)),
  }), [dimensions]);

  const getDefaultSourcePosition = useCallback((index: number, type: 'income' | 'expense') => {
    const isIncome = type === 'income';
    const count = sources.filter(s => s.type === type).length;
    const spacing = 150;
    const startY = 150;
    const x = isIncome ? 150 : dimensions.width - 150;
    const totalHeight = (count - 1) * spacing;
    const y = startY + (index * spacing) - (totalHeight / 2) + (dimensions.height / 2 - startY);

    return { x, y };
  }, [dimensions, sources]);

  const getDefaultAccountPosition = useCallback((index: number) => {
    const count = accounts.length;
    const spacing = 200;
    const totalWidth = (count - 1) * spacing;
    const x = (dimensions.width / 2) - (totalWidth / 2) + (index * spacing);
    const y = dimensions.height / 2;

    return { x, y };
  }, [accounts, dimensions]);

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

    const incomeSourcesIndexed = sources.filter(s => s.type === 'income');
    const expenseSourcesIndexed = sources.filter(s => s.type === 'expense');

    setSourcePositions((previousPositions) => {
      let changed = false;
      const nextPositions = { ...previousPositions };

      incomeSourcesIndexed.forEach((source, index) => {
        const nextPosition = previousPositions[source.id]
          ? clampPosition(previousPositions[source.id], 40)
          : clampPosition(getDefaultSourcePosition(index, 'income'), 40);

        if (
          !previousPositions[source.id] ||
          previousPositions[source.id].x !== nextPosition.x ||
          previousPositions[source.id].y !== nextPosition.y
        ) {
          nextPositions[source.id] = nextPosition;
          changed = true;
        }
      });

      expenseSourcesIndexed.forEach((source, index) => {
        const nextPosition = previousPositions[source.id]
          ? clampPosition(previousPositions[source.id], 40)
          : clampPosition(getDefaultSourcePosition(index, 'expense'), 40);

        if (
          !previousPositions[source.id] ||
          previousPositions[source.id].x !== nextPosition.x ||
          previousPositions[source.id].y !== nextPosition.y
        ) {
          nextPositions[source.id] = nextPosition;
          changed = true;
        }
      });

      return changed ? nextPositions : previousPositions;
    });

    setAccountPositions((previousPositions) => {
      let changed = false;
      const nextPositions = { ...previousPositions };

      accounts.forEach((account, index) => {
        const nextPosition = previousPositions[account.id]
          ? clampPosition(previousPositions[account.id], 60)
          : clampPosition(getDefaultAccountPosition(index), 60);

        if (
          !previousPositions[account.id] ||
          previousPositions[account.id].x !== nextPosition.x ||
          previousPositions[account.id].y !== nextPosition.y
        ) {
          nextPositions[account.id] = nextPosition;
          changed = true;
        }
      });

      return changed ? nextPositions : previousPositions;
    });
  }, [
    accounts,
    clampPosition,
    dimensions,
    getDefaultAccountPosition,
    getDefaultSourcePosition,
    sources,
  ]);

  const updateSourcePosition = (id: string, position: Position) => {
    setSourcePositions(prev => ({ ...prev, [id]: position }));
  };

  const updateAccountPosition = (id: string, position: Position) => {
    setAccountPositions(prev => ({ ...prev, [id]: position }));
  };

  const streamPaths = useMemo<StreamPath[]>(() => streams.flatMap((stream) => {
    const source = sources.find(s => s.id === stream.sourceId);
    const account = accounts.find(a => a.id === stream.accountId);
    if (!source || !account) return [];

    const sourcePos = sourcePositions[source.id];
    const accountPos = accountPositions[account.id];
    if (!sourcePos || !accountPos) return [];

    return [{
      id: stream.id,
      from: source.type === 'income' ? sourcePos : accountPos,
      to: source.type === 'income' ? accountPos : sourcePos,
      color: source.type === 'income' ? '#4ade80' : '#f87171',
      active: stream.active,
    }];
  }), [accounts, accountPositions, sources, sourcePositions, streams]);

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
      <section className="summary-panel" aria-label="Financial summary">
        <div className="summary-card">
          <span className="summary-label">Monthly net</span>
          <strong className={summary.monthlyNet >= 0 ? 'positive' : 'negative'}>
            {currencyFormatter.format(summary.monthlyNet)}
          </strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Income</span>
          <strong className="positive">{currencyFormatter.format(summary.monthlyIncome)}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Expenses</span>
          <strong className="negative">{currencyFormatter.format(summary.monthlyExpenses)}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total balance</span>
          <strong>{currencyFormatter.format(summary.totalBalance)}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Active streams</span>
          <strong>{summary.activeStreams}</strong>
        </div>
      </section>
      <AnimatedStream paths={streamPaths} />
      
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
    </div>
  );
}

export default App;
