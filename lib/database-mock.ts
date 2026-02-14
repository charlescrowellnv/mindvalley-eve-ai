// Mock database with hardcoded customer support data

import { User, Order } from './types';

// Sample users
const users: User[] = [
  {
    id: 'user_001',
    name: 'John Doe',
    email: 'john@example.com',
    joinDate: '2024-01-15',
  },
  {
    id: 'user_002',
    name: 'Jane Smith',
    email: 'jane@example.com',
    joinDate: '2024-03-22',
  },
  {
    id: 'user_003',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    joinDate: '2024-06-10',
  },
];

// Sample orders
const orders: Order[] = [
  {
    id: 'order_001',
    userId: 'user_001',
    productName: 'Wireless Headphones',
    price: 89.99,
    status: 'delivered',
    orderDate: '2024-02-10',
    trackingNumber: 'TRK123456789',
  },
  {
    id: 'order_002',
    userId: 'user_001',
    productName: 'USB-C Cable (3-pack)',
    price: 24.99,
    status: 'processing',
    orderDate: '2024-02-12',
  },
  {
    id: 'order_003',
    userId: 'user_002',
    productName: 'Laptop Stand',
    price: 49.99,
    status: 'shipped',
    orderDate: '2024-02-08',
    trackingNumber: 'TRK987654321',
  },
  {
    id: 'order_004',
    userId: 'user_003',
    productName: 'Mechanical Keyboard',
    price: 129.99,
    status: 'delivered',
    orderDate: '2024-01-25',
    trackingNumber: 'TRK555666777',
  },
  {
    id: 'order_005',
    userId: 'user_003',
    productName: 'Wireless Mouse',
    price: 39.99,
    status: 'cancelled',
    orderDate: '2024-02-01',
  },
];

// Database query functions
export function getUserByEmail(email: string): User | null {
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  return user || null;
}

export function getOrdersByUserId(userId: string): Order[] {
  return orders.filter(order => order.userId === userId);
}

export function getOrderDetails(orderId: string): Order | null {
  const order = orders.find(o => o.id === orderId);
  return order || null;
}

// Export for potential debugging
export const mockDatabase = {
  users,
  orders,
  getUserByEmail,
  getOrdersByUserId,
  getOrderDetails,
};
