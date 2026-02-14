// Client-side tool implementations for ElevenLabs agent

import { getUserByEmail, getOrdersByUserId, getOrderDetails } from './database-mock';
import { ToolContext } from './types';

// Helper to simulate async API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function createClientTools(context: ToolContext) {
  return {
    // Tool 1: Look up user by email
    getUserByEmail: async (parameters: { email: string }) => {
      const execId = context.onToolStart('getUserByEmail', parameters);

      try {
        // Simulate realistic API delay
        await delay(800);

        const user = getUserByEmail(parameters.email);

        if (!user) {
          const errorMsg = `No user found with email: ${parameters.email}`;
          context.onToolError(execId, errorMsg);
          return errorMsg;
        }

        context.onToolComplete(execId, user);
        return `Found user: ${user.name} (ID: ${user.id}, Email: ${user.email})`;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        context.onToolError(execId, errorMsg);
        return `Error looking up user: ${errorMsg}`;
      }
    },

    // Tool 2: Get orders for a user
    getOrdersByUserId: async (parameters: { userId: string }) => {
      const execId = context.onToolStart('getOrdersByUserId', parameters);

      try {
        // Simulate realistic API delay
        await delay(1000);

        const orders = getOrdersByUserId(parameters.userId);

        if (orders.length === 0) {
          const msg = `No orders found for user ID: ${parameters.userId}`;
          context.onToolComplete(execId, []);
          return msg;
        }

        context.onToolComplete(execId, orders);

        const orderSummary = orders.map(o =>
          `${o.productName} ($${o.price}) - ${o.status}`
        ).join(', ');

        return `Found ${orders.length} order(s) for user ${parameters.userId}: ${orderSummary}`;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        context.onToolError(execId, errorMsg);
        return `Error fetching orders: ${errorMsg}`;
      }
    },

    // Tool 3: Get detailed information about an order
    getOrderDetails: async (parameters: { orderId: string }) => {
      const execId = context.onToolStart('getOrderDetails', parameters);

      try {
        // Simulate realistic API delay
        await delay(600);

        const order = getOrderDetails(parameters.orderId);

        if (!order) {
          const errorMsg = `No order found with ID: ${parameters.orderId}`;
          context.onToolError(execId, errorMsg);
          return errorMsg;
        }

        context.onToolComplete(execId, order);

        const trackingInfo = order.trackingNumber
          ? `, Tracking: ${order.trackingNumber}`
          : '';

        return `Order ${order.id}: ${order.productName}, $${order.price}, Status: ${order.status}, Ordered: ${order.orderDate}${trackingInfo}`;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        context.onToolError(execId, errorMsg);
        return `Error fetching order details: ${errorMsg}`;
      }
    },
  };
}
