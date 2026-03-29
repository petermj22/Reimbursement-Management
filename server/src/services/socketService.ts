// =============================================================
// SOCKET SERVICE - Real-time WebSocket event emission
// =============================================================
import { Server as SocketIOServer } from 'socket.io';
import logger from '../config/logger.js';

let io: SocketIOServer | null = null;

export function initSocketService(socketIo: SocketIOServer) {
  io = socketIo;
  logger.info('🔌 Socket service initialized');
}

export function emitToUser(userId: string, event: string, data: unknown) {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit');
    return;
  }
  io.to(`user:${userId}`).emit(event, data);
  logger.debug('Socket event emitted', { userId, event });
}

export function emitExpenseSubmitted(managerId: string, expense: {
  id: string;
  description: string;
  amount: number;
  employeeName: string;
}) {
  emitToUser(managerId, 'expense:submitted', {
    type: 'expense_submitted',
    title: 'New Expense Submitted',
    message: `${expense.employeeName} submitted $${expense.amount}: ${expense.description}`,
    expenseId: expense.id,
    timestamp: new Date().toISOString(),
  });
}

export function emitExpenseApproved(employeeId: string, expense: {
  id: string;
  description: string;
  amount: number;
  approverName: string;
  fullyApproved: boolean;
}) {
  emitToUser(employeeId, 'expense:approved', {
    type: expense.fullyApproved ? 'expense_approved' : 'expense_step_approved',
    title: expense.fullyApproved ? 'Expense Approved! 🎉' : 'Approval Step Complete',
    message: `${expense.approverName} ${expense.fullyApproved ? 'fully approved' : 'approved a step for'} your $${expense.amount} expense`,
    expenseId: expense.id,
    timestamp: new Date().toISOString(),
  });
}

export function emitExpenseRejected(employeeId: string, expense: {
  id: string;
  description: string;
  amount: number;
  approverName: string;
  reason: string;
}) {
  emitToUser(employeeId, 'expense:rejected', {
    type: 'expense_rejected',
    title: 'Expense Rejected',
    message: `${expense.approverName} rejected your $${expense.amount} expense: ${expense.reason}`,
    expenseId: expense.id,
    timestamp: new Date().toISOString(),
  });
}

export function emitExpensePaid(employeeId: string, expense: {
  id: string;
  amount: number;
}) {
  emitToUser(employeeId, 'expense:paid', {
    type: 'expense_paid',
    title: 'Payment Processed! 💰',
    message: `Your expense of $${expense.amount} has been paid`,
    expenseId: expense.id,
    timestamp: new Date().toISOString(),
  });
}

export function emitNotificationCount(userId: string, count: number) {
  emitToUser(userId, 'notification:count', { count });
}
