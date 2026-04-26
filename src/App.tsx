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

const sourceControls = initialSources.map((source) => source.id);
const monthlySavingsTarget = 2000;
const goalTargets: Record<string, number> = {
  '1': 18000,
  '2': 32000,
  '3': 56000,
};

interface Position {
  x: number;
  y: number;
}

type Focus =
  | { type: 'source'; id: string }
  | { type: 'account'; id: string }
  | { type: 'stream'; id: string };

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function App() {
  const [sources] = useState<SourceType[]>(initialSources);
  const [accounts] = useState<AccountType[]>(initialAccounts);
  const [streams] = useState<Stream[]>(initialStreams);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [sourcePositions, setSourcePositions] = useState<Record<string, Position>>({});
  const [accountPositions, setAccountPositions] = useState<Record<string, Position>>({});
  const [focus, setFocus] = useState<Focus | null>(null);
  const [months, setMonths] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'freeform' | 'sankey'>('freeform');
  const [freeformSnapshot, setFreeformSnapshot] = useState<{
    sourcePositions: Record<string, Position>;
    accountPositions: Record<string, Position>;
  } | null>(null);
  const [sourceMultipliers, setSourceMultipliers] = useState<Record<string, number>>({
    '1': 1,
    '2': 1,
    '3': 1,
    '4': 1,
    '5': 1,
    '6': 1,
  });

  const scenarioSources = useMemo(() => sources.map((source) => ({
    ...source,
    amount: Math.round(source.amount * (sourceMultipliers[source.id] ?? 1)),
  })), [sourceMultipliers, sources]);

  const scenarioStreams = useMemo(() => streams.map((stream) => {
    const baseSource = sources.find((source) => source.id === stream.sourceId);
    const scenarioSource = scenarioSources.find((source) => source.id === stream.sourceId);
    const ratio = baseSource && scenarioSource && baseSource.amount !== 0
      ? scenarioSource.amount / baseSource.amount
      : 1;

    return {
      ...stream,
      amount: Math.round(stream.amount * ratio),
    };
  }), [scenarioSources, sources, streams]);

  const projectedAccounts = useMemo(() => accounts.map((account) => {
    const monthlyChange = scenarioStreams
      .filter((stream) => stream.accountId === account.id)
      .reduce((total, stream) => total + stream.amount, 0);

    return {
      ...account,
      balance: account.balance + monthlyChange * months,
    };
  }), [accounts, months, scenarioStreams]);

  const summary = useMemo(() => {
    const monthlyIncome = scenarioSources
      .filter((source) => source.type === 'income')
      .reduce((total, source) => total + source.amount, 0);
    const monthlyExpenses = scenarioSources
      .filter((source) => source.type === 'expense')
      .reduce((total, source) => total + source.amount, 0);
    const totalBalance = projectedAccounts.reduce((total, account) => total + account.balance, 0);
    const activeStreams = scenarioStreams.filter((stream) => stream.active).length;

    return {
      monthlyIncome,
      monthlyExpenses,
      monthlyNet: monthlyIncome - monthlyExpenses,
      totalBalance,
      activeStreams,
      savingsRate: monthlyIncome === 0 ? 0 : (monthlyIncome - monthlyExpenses) / monthlyIncome,
    };
  }, [projectedAccounts, scenarioSources, scenarioStreams]);

  const selectedStream = useMemo(() => (
    focus?.type === 'stream'
      ? scenarioStreams.find((stream) => stream.id === focus.id)
      : undefined
  ), [focus, scenarioStreams]);

  const selectedSource = useMemo(() => {
    if (focus?.type === 'source') {
      return scenarioSources.find((source) => source.id === focus.id);
    }

    if (selectedStream) {
      return scenarioSources.find((source) => source.id === selectedStream.sourceId);
    }

    return undefined;
  }, [focus, scenarioSources, selectedStream]);

  const selectedAccount = useMemo(() => {
    if (focus?.type === 'account') {
      return projectedAccounts.find((account) => account.id === focus.id);
    }

    if (selectedStream) {
      return projectedAccounts.find((account) => account.id === selectedStream.accountId);
    }

    return undefined;
  }, [focus, projectedAccounts, selectedStream]);

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

  const getSankeySourcePosition = useCallback((index: number, type: 'income' | 'expense') => {
    const matchingSources = scenarioSources.filter((source) => source.type === type);
    const availableHeight = Math.max(260, dimensions.height - 250);
    const step = availableHeight / Math.max(1, matchingSources.length - 1);
    const y = 165 + step * index;
    const x = type === 'income' ? 135 : dimensions.width - 135;

    return clampPosition({ x, y }, 40);
  }, [clampPosition, dimensions, scenarioSources]);

  const getSankeyAccountPosition = useCallback((index: number) => {
    const availableHeight = Math.max(260, dimensions.height - 250);
    const step = availableHeight / Math.max(1, accounts.length - 1);
    const y = 165 + step * index;

    return clampPosition({ x: dimensions.width / 2, y }, 60);
  }, [accounts, clampPosition, dimensions]);

  const snapToSankeyLayout = useCallback(() => {
    const nextSourcePositions: Record<string, Position> = {};
    const nextAccountPositions: Record<string, Position> = {};
    const incomeSources = scenarioSources.filter((source) => source.type === 'income');
    const expenseSources = scenarioSources.filter((source) => source.type === 'expense');

    incomeSources.forEach((source, index) => {
      nextSourcePositions[source.id] = getSankeySourcePosition(index, 'income');
    });

    expenseSources.forEach((source, index) => {
      nextSourcePositions[source.id] = getSankeySourcePosition(index, 'expense');
    });

    accounts.forEach((account, index) => {
      nextAccountPositions[account.id] = getSankeyAccountPosition(index);
    });

    setSourcePositions(nextSourcePositions);
    setAccountPositions(nextAccountPositions);
    setLayoutMode('sankey');
  }, [accounts, getSankeyAccountPosition, getSankeySourcePosition, scenarioSources]);

  const toggleSankeyLayout = () => {
    if (layoutMode === 'sankey') {
      if (freeformSnapshot) {
        setSourcePositions(freeformSnapshot.sourcePositions);
        setAccountPositions(freeformSnapshot.accountPositions);
      }

      setLayoutMode('freeform');
      return;
    }

    setFreeformSnapshot({ sourcePositions, accountPositions });
    snapToSankeyLayout();
  };

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const intervalId = window.setInterval(() => {
      setMonths((currentMonth) => currentMonth >= 24 ? 1 : currentMonth + 1);
    }, 800);

    return () => window.clearInterval(intervalId);
  }, [isPlaying]);

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

  useEffect(() => {
    if (layoutMode !== 'sankey') return;
    snapToSankeyLayout();
  }, [layoutMode, snapToSankeyLayout]);

  const updateSourcePosition = (id: string, position: Position) => {
    setLayoutMode('freeform');
    setSourcePositions(prev => ({ ...prev, [id]: position }));
  };

  const updateAccountPosition = (id: string, position: Position) => {
    setLayoutMode('freeform');
    setAccountPositions(prev => ({ ...prev, [id]: position }));
  };

  const streamPaths = useMemo<StreamPath[]>(() => scenarioStreams.flatMap((stream) => {
    const source = scenarioSources.find(s => s.id === stream.sourceId);
    const account = projectedAccounts.find(a => a.id === stream.accountId);
    if (!source || !account) return [];

    const sourcePos = sourcePositions[source.id];
    const accountPos = accountPositions[account.id];
    if (!sourcePos || !accountPos) return [];

    const focused = !focus
      || (focus.type === 'source' && focus.id === source.id)
      || (focus.type === 'account' && focus.id === account.id)
      || (focus.type === 'stream' && focus.id === stream.id);

    return [{
      id: stream.id,
      from: source.type === 'income' ? sourcePos : accountPos,
      to: source.type === 'income' ? accountPos : sourcePos,
      color: source.type === 'income' ? '#4ade80' : '#f87171',
      active: stream.active,
      amount: stream.amount,
      focused,
      dimmed: !focused,
    }];
  }), [
    accountPositions,
    focus,
    projectedAccounts,
    scenarioSources,
    scenarioStreams,
    sourcePositions,
  ]);

  const relatedStreams = useMemo(() => scenarioStreams.filter((stream) => {
    if (!focus) return true;
    if (focus.type === 'stream') return stream.id === focus.id;
    if (focus.type === 'source') return stream.sourceId === focus.id;
    return stream.accountId === focus.id;
  }), [focus, scenarioStreams]);

  const handleAppClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, input, .inspector, .control-dock')) return;

    const clickPoint = { x: event.clientX, y: event.clientY };
    const sourceHit = scenarioSources.find((source) => {
      const position = sourcePositions[source.id];
      return position && Math.hypot(position.x - clickPoint.x, position.y - clickPoint.y) <= 48;
    });

    if (sourceHit) {
      setFocus({ type: 'source', id: sourceHit.id });
      return;
    }

    const accountHit = projectedAccounts.find((account) => {
      const position = accountPositions[account.id];
      return position && Math.hypot(position.x - clickPoint.x, position.y - clickPoint.y) <= 68;
    });

    if (accountHit) {
      setFocus({ type: 'account', id: accountHit.id });
      return;
    }

    setFocus(null);
  };

  const savingsGap = Math.max(0, monthlySavingsTarget - summary.monthlyNet);
  const leakLevel = clamp(savingsGap / monthlySavingsTarget, 0, 1);
  const timeScale = isPlaying ? 2.2 : 1 + months / 24;

  if (dimensions.width === 0 || dimensions.height === 0) {
    return (
      <div className="app">
        <h1 className="title">MoneyTrax</h1>
        <div className="subtitle">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app" onClick={handleAppClick}>
      <h1 className="title">MoneyTrax</h1>
      <div className="subtitle">Cash-flow lab</div>
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
          <span className="summary-label">{months}-month balance</span>
          <strong>{currencyFormatter.format(summary.totalBalance)}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Savings rate</span>
          <strong className={summary.savingsRate >= 0.25 ? 'positive' : 'warning'}>
            {Math.round(summary.savingsRate * 100)}%
          </strong>
        </div>
      </section>

      <AnimatedStream
        paths={streamPaths}
        selectedPathId={focus?.type === 'stream' ? focus.id : undefined}
        timeScale={timeScale}
        onPathSelect={(id) => setFocus({ type: 'stream', id })}
      />

      {leakLevel > 0 && (
        <div
          className="leak-field"
          style={{ opacity: 0.18 + leakLevel * 0.32 }}
          aria-hidden="true"
        />
      )}

      {scenarioSources.map((source) => {
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

      {projectedAccounts.map((account) => {
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

      {projectedAccounts.map((account) => {
        const position = accountPositions[account.id];
        if (!position) return null;

        const target = goalTargets[account.id];
        const progress = target ? clamp(account.balance / target, 0, 1) : 0;

        return (
          <div
            key={`goal-${account.id}`}
            className="goal-orbit"
            style={{
              left: position.x,
              top: position.y,
              '--goal-progress': `${progress * 360}deg`,
              '--account-color': account.color ?? '#3b82f6',
            } as React.CSSProperties}
            aria-hidden="true"
          >
            <span>{Math.round(progress * 100)}%</span>
          </div>
        );
      })}

      {focus && (
        <div
          className="focus-ring"
          style={{
            left: focus.type === 'source'
              ? sourcePositions[focus.id]?.x
              : focus.type === 'account'
                ? accountPositions[focus.id]?.x
                : undefined,
            top: focus.type === 'source'
              ? sourcePositions[focus.id]?.y
              : focus.type === 'account'
                ? accountPositions[focus.id]?.y
                : undefined,
            display: focus.type === 'stream' ? 'none' : 'block',
          }}
          aria-hidden="true"
        />
      )}

      <section className="control-dock" aria-label="Simulation controls">
        <div className="dock-row">
          <button
            type="button"
            className={isPlaying ? 'active' : ''}
            onClick={() => setIsPlaying((currentValue) => !currentValue)}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className={layoutMode === 'sankey' ? 'active' : ''}
            onClick={toggleSankeyLayout}
          >
            {layoutMode === 'sankey' ? 'Freeform' : 'Sankey'}
          </button>
          <button type="button" onClick={() => setFocus(null)}>
            Clear
          </button>
        </div>
        <label className="range-row">
          <span>Forecast</span>
          <input
            type="range"
            min="1"
            max="24"
            value={months}
            onChange={(event) => setMonths(Number(event.target.value))}
          />
          <strong>{months}m</strong>
        </label>
        {sourceControls.map((sourceId) => {
          const source = scenarioSources.find((item) => item.id === sourceId);
          if (!source) return null;

          return (
            <label className="range-row" key={source.id}>
              <span>{source.name}</span>
              <input
                type="range"
                min="60"
                max="150"
                value={Math.round((sourceMultipliers[source.id] ?? 1) * 100)}
                onChange={(event) => setSourceMultipliers((currentMultipliers) => ({
                  ...currentMultipliers,
                  [source.id]: Number(event.target.value) / 100,
                }))}
              />
              <strong>{currencyFormatter.format(source.amount)}</strong>
            </label>
          );
        })}
      </section>

      <aside className="inspector" aria-label="Flow inspector">
        <div>
          <span className="summary-label">Inspector</span>
          <strong>
            {selectedStream
              ? 'Selected stream'
              : selectedSource?.name ?? selectedAccount?.name ?? 'All flows'}
          </strong>
        </div>
        {selectedStream && selectedSource && selectedAccount ? (
          <div className="inspector-stack">
            <p>
              {selectedSource.type === 'income'
                ? `${selectedSource.name} to ${selectedAccount.name}`
                : `${selectedAccount.name} to ${selectedSource.name}`}
            </p>
            <strong className={selectedSource.type === 'income' ? 'positive' : 'negative'}>
              {currencyFormatter.format(Math.abs(selectedStream.amount))}/mo
            </strong>
            <span>{Math.round((Math.abs(selectedStream.amount) / Math.max(summary.monthlyIncome, 1)) * 100)}% of income</span>
            <span>{currencyFormatter.format(Math.abs(selectedStream.amount) * months)} over {months} months</span>
          </div>
        ) : (
          <div className="inspector-stack">
            <span>{relatedStreams.length} visible streams</span>
            <span>{currencyFormatter.format(relatedStreams.reduce((total, stream) => total + Math.abs(stream.amount), 0))}/mo traced</span>
            <span className={leakLevel > 0 ? 'negative' : 'positive'}>
              {leakLevel > 0
                ? `${currencyFormatter.format(savingsGap)} below ${currencyFormatter.format(monthlySavingsTarget)} target`
                : `${currencyFormatter.format(monthlySavingsTarget)} savings target intact`}
            </span>
          </div>
        )}
      </aside>
    </div>
  );
}

export default App;
