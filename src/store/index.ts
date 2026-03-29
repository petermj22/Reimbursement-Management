// =============================================================
// REDUX STORE - RTK Query API + Centralized State
// =============================================================
import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Expense, User, Notification, DashboardStats, ExpenseCategory, ApprovalRule, ApprovalLog } from '@/types';

const API_BASE = 'http://localhost:3001/api';

// ---- RTK Query API ----
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('auth_token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Expenses', 'Users', 'Notifications', 'Categories', 'Dashboard', 'ApprovalRules'],
  endpoints: (builder) => ({
    // ---- Auth ----
    login: builder.mutation<{ token: string; user: User }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Expenses', 'Dashboard', 'Notifications'],
    }),
    getMe: builder.query<{ user: User }, void>({
      query: () => '/auth/me',
    }),

    // ---- Expenses ----
    getExpenses: builder.query<{ expenses: Expense[]; total: number; page: number; limit: number }, {
      status?: string; search?: string; page?: number; limit?: number;
    }>({
      query: (params) => ({ url: '/expenses', params }),
      providesTags: ['Expenses'],
    }),
    getExpense: builder.query<{ expense: Expense; approvalLogs: ApprovalLog[] }, string>({
      query: (id) => `/expenses/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Expenses', id }],
    }),
    createExpense: builder.mutation<{ expense: Expense }, FormData | Partial<Expense>>({
      query: (body) => ({ url: '/expenses', method: 'POST', body }),
      invalidatesTags: ['Expenses', 'Dashboard'],
    }),
    approveExpense: builder.mutation<{ expense: Expense }, { id: string; comments?: string }>({
      query: ({ id, ...body }) => ({ url: `/expenses/${id}/approve`, method: 'PATCH', body }),
      invalidatesTags: ['Expenses', 'Dashboard', 'Notifications'],
    }),
    rejectExpense: builder.mutation<{ expense: Expense }, { id: string; comments: string }>({
      query: ({ id, ...body }) => ({ url: `/expenses/${id}/reject`, method: 'PATCH', body }),
      invalidatesTags: ['Expenses', 'Dashboard', 'Notifications'],
    }),
    payExpense: builder.mutation<{ expense: Expense }, string>({
      query: (id) => ({ url: `/expenses/${id}/pay`, method: 'PATCH' }),
      invalidatesTags: ['Expenses', 'Dashboard'],
    }),

    // ---- Users ----
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      transformResponse: (res: { users: User[] }) => res.users,
      providesTags: ['Users'],
    }),
    createUser: builder.mutation<User, Partial<User> & { password: string }>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['Users'],
    }),

    // ---- Notifications ----
    getNotifications: builder.query<Notification[], void>({
      query: () => '/notifications',
      transformResponse: (res: { notifications: Notification[] }) => res.notifications,
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),

    // ---- Analytics ----
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/analytics/dashboard',
      providesTags: ['Dashboard'],
    }),
    getTopSpenders: builder.query<Array<{ name: string; amount: number; count: number }>, void>({
      query: () => '/analytics/top-spenders',
      transformResponse: (res: { topSpenders: Array<{ name: string; amount: number; count: number }> }) => res.topSpenders,
    }),

    // ---- Categories ----
    getCategories: builder.query<ExpenseCategory[], void>({
      query: () => '/categories',
      transformResponse: (res: ExpenseCategory[] | { categories: ExpenseCategory[] }) => Array.isArray(res) ? res : res.categories,
      providesTags: ['Categories'],
    }),
    getApprovalRules: builder.query<ApprovalRule[], void>({
      query: () => '/categories/approval-rules',
      transformResponse: (res: { rules: ApprovalRule[] }) => res.rules,
      providesTags: ['ApprovalRules'],
    }),
  }),
});

// ---- UI State Slice ----
interface UIState {
  sidebarCollapsed: boolean;
  notificationCount: number;
  selectedExpenseIds: string[];
  theme: 'light' | 'dark';
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
    notificationCount: 0,
    selectedExpenseIds: [],
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  } as UIState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setNotificationCount: (state, action: PayloadAction<number>) => { state.notificationCount = action.payload; },
    setSelectedExpenses: (state, action: PayloadAction<string[]>) => { state.selectedExpenseIds = action.payload; },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
    },
  },
});

// ---- Auth State Slice ----
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: false,
    loading: true,
  } as AuthState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('auth_token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem('auth_token');
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

// ---- Store ----
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    ui: uiSlice.reducer,
    auth: authSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ---- Exports ----
export const {
  useLoginMutation,
  useGetMeQuery,
  useGetExpensesQuery,
  useGetExpenseQuery,
  useCreateExpenseMutation,
  useApproveExpenseMutation,
  useRejectExpenseMutation,
  usePayExpenseMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetDashboardStatsQuery,
  useGetTopSpendersQuery,
  useGetCategoriesQuery,
  useGetApprovalRulesQuery,
} = api;

export const { setCredentials, logout, setUser, setLoading } = authSlice.actions;
export const { toggleSidebar, setNotificationCount, setSelectedExpenses, toggleTheme } = uiSlice.actions;
