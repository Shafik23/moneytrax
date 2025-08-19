export interface Source {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  color?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  color?: string;
}

export interface Stream {
  id: string;
  sourceId: string;
  accountId: string;
  amount: number;
  active: boolean;
}