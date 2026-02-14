// Core data types for the customer support database

export interface User {
  id: string;
  name: string;
  email: string;
  joinDate: string;
}

export interface Order {
  id: string;
  userId: string;
  productName: string;
  price: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  trackingNumber?: string;
}

// Tool execution state types
export type ToolExecutionState = 'pending' | 'executing' | 'completed' | 'error';

export interface ToolExecution {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  state: ToolExecutionState;
  result?: unknown;
  error?: string;
  timestamp: number;
}

export interface ToolContext {
  onToolStart: (toolName: string, parameters: Record<string, unknown>) => string;
  onToolComplete: (id: string, result: unknown) => void;
  onToolError: (id: string, error: string) => void;
}
