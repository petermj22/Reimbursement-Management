// =============================================================
// SOCKET.IO CLIENT - Real-time WebSocket connection
// =============================================================
import { io, Socket } from 'socket.io-client';
import { store, setNotificationCount } from '@/store';
import { api } from '@/store';
import { toast } from 'sonner';

let socket: Socket | null = null;

export function connectSocket() {
  const token = localStorage.getItem('auth_token');
  if (!token || socket?.connected) return;

  socket = io('http://localhost:3001', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('🔌 WebSocket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 WebSocket disconnected:', reason);
  });

  // ---- Real-time expense events ----
  socket.on('expense:submitted', (data: { title: string; message: string; expenseId: string }) => {
    toast.info(data.title, { description: data.message });
    // Invalidate RTK Query caches to refetch
    store.dispatch(api.util.invalidateTags(['Expenses', 'Dashboard', 'Notifications']));
  });

  socket.on('expense:approved', (data: { title: string; message: string; expenseId: string }) => {
    toast.success(data.title, { description: data.message });
    store.dispatch(api.util.invalidateTags(['Expenses', 'Dashboard', 'Notifications']));
  });

  socket.on('expense:rejected', (data: { title: string; message: string; expenseId: string }) => {
    toast.error(data.title, { description: data.message });
    store.dispatch(api.util.invalidateTags(['Expenses', 'Dashboard', 'Notifications']));
  });

  socket.on('expense:paid', (data: { title: string; message: string }) => {
    toast.success(data.title, { description: data.message });
    store.dispatch(api.util.invalidateTags(['Expenses', 'Dashboard']));
  });

  // ---- Notification count update ----
  socket.on('notification:count', (data: { count: number }) => {
    store.dispatch(setNotificationCount(data.count));
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 WebSocket disconnected manually');
  }
}

export function getSocket() {
  return socket;
}
