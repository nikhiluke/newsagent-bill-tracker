import { create } from 'zustand';
import { Customer, Payment, DistributorProfile, AppSettings, CustomerStatus } from '../types';
import { NEWSPAPERS } from '../data';
import {
  initDatabase,
  getCustomers as fetchCustomers,
  insertCustomer as dbInsertCustomer,
  updateCustomerData,
  deleteCustomerData,
  getPayments as fetchPayments,
  insertPayment as dbInsertPayment,
  deletePaymentData,
  getProfile,
  saveProfile,
  getSettings,
  saveSettings,
  getCustomerById
} from '../database';
import { MOCK_CUSTOMERS, MOCK_PAYMENTS, MOCK_PROFILE, MOCK_SETTINGS } from '../database/mockData';
import { getCurrentYear } from '../utility';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('Storage not available', e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Storage not available', e);
    }
  }
};

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

type Tab = 'dashboard' | 'customers' | 'ledger' | 'reports' | 'settings';

interface AppState {
  // Data
  isDbReady: boolean;
  customers: Customer[];
  payments: Payment[];
  profile: DistributorProfile;
  settings: AppSettings;

  // Auth
  isLoggedIn: boolean;

  // UI Navigation
  currentTab: Tab;
  selectedCustomerId: string | null;
  editingCustomerId: string | null;
  paymentEntryCustomerId: string | null;
  paymentEntryPreselectedMonth: string | null;

  // Initialisation
  initialize: () => Promise<void>;

  // Navigation actions
  navigateTo: (tab: Tab) => void;
  viewCustomerDetails: (id: string) => void;
  openAddCustomer: () => void;
  openEditCustomer: (id: string) => void;
  openPaymentEntry: (id: string, month?: string) => void;
  closeSubScreens: () => void;

  // Auth actions
  login: (phone: string, passcode: string) => boolean;
  logout: () => void;

  // Customer CRUD
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Payment CRUD
  addPayment: (payment: Omit<Payment, 'id' | 'receiptNumber'>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  // Settings & Profile
  updateProfile: (profile: DistributorProfile) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  toggleNotifications: () => Promise<void>;
  addSupportedNewspaper: (newspaper: string) => Promise<void>;
  toggleSupportedNewspaper: (newspaper: string) => Promise<void>;

  // Data utilities
  backupData: () => string;
  restoreData: (jsonData: string) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState>((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────────
  isDbReady: false,
  customers: [],
  payments: [],
  profile: null,
  settings: {
    darkMode: false,
    notificationsEnabled: true,
    appVersion: '1.2.0',
    supportedNewspapers: [],
    allNewspapers: NEWSPAPERS
  },
  isLoggedIn: safeStorage.getItem('ns_logged_in') === 'true',
  currentTab: 'dashboard',
  selectedCustomerId: null,
  editingCustomerId: null,
  paymentEntryCustomerId: null,
  paymentEntryPreselectedMonth: null,

  // ── Initialisation ───────────────────────────────────────────────────────
  initialize: async () => {
    try {
      await initDatabase();

      const [fetchedCustomers, fetchedPayments, fetchedProfile, fetchedSettings] =
        await Promise.all([
          fetchCustomers(),
          fetchPayments(),
          getProfile(),
          getSettings()
        ]);

      const useMock = process.env.USE_MOCK_DATA === 'true';
      if (useMock) {
        set({
          customers: MOCK_CUSTOMERS,
          payments: MOCK_PAYMENTS,
          profile: MOCK_PROFILE,
          settings: MOCK_SETTINGS,
          isDbReady: true
        });
      } else {
        set({
          customers: fetchedCustomers,
          payments: fetchedPayments,
          profile: fetchedProfile,
          settings: fetchedSettings,
          isDbReady: true
        });
      }

      // Apply dark mode from loaded settings
      const { settings } = get();
      if (typeof document !== 'undefined') {
        if (settings.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  login: (phone, passcode) => {
    const { profile } = get();
    if (profile && phone === profile.phone && parseInt(passcode) === profile.passPin) {
      set({ isLoggedIn: true });
      safeStorage.setItem('ns_logged_in', 'true');
      return true;
    }
    return false;
  },

  logout: () => {
    set({
      isLoggedIn: false,
      selectedCustomerId: null,
      editingCustomerId: null,
      paymentEntryCustomerId: null,
      paymentEntryPreselectedMonth: null,
      currentTab: 'dashboard'
    });
    safeStorage.setItem('ns_logged_in', 'false');
  },

  // ── Navigation ───────────────────────────────────────────────────────────
  navigateTo: (tab) => {
    set({
      currentTab: tab,
      selectedCustomerId: null,
      editingCustomerId: null,
      paymentEntryCustomerId: null,
      paymentEntryPreselectedMonth: null
    });
  },

  viewCustomerDetails: (id) => {
    set({
      selectedCustomerId: id,
      editingCustomerId: null,
      paymentEntryCustomerId: null,
      currentTab: 'customers'
    });
  },

  openAddCustomer: () => {
    set({
      editingCustomerId: 'new',
      selectedCustomerId: null,
      paymentEntryCustomerId: null,
      currentTab: 'customers'
    });
  },

  openEditCustomer: (id) => {
    set({
      editingCustomerId: id,
      selectedCustomerId: null,
      paymentEntryCustomerId: null,
      currentTab: 'customers'
    });
  },

  openPaymentEntry: (id, month) => {
    set({
      paymentEntryCustomerId: id,
      paymentEntryPreselectedMonth: month || null,
      selectedCustomerId: null,
      editingCustomerId: null,
      currentTab: 'ledger'
    });
  },

  closeSubScreens: () => {
    const { paymentEntryCustomerId, editingCustomerId, selectedCustomerId } = get();
    if (paymentEntryCustomerId) {
      set({ paymentEntryCustomerId: null, paymentEntryPreselectedMonth: null });
    } else if (editingCustomerId) {
      set({ editingCustomerId: null });
    } else if (selectedCustomerId) {
      set({ selectedCustomerId: null });
    }
  },

  // ── Customers ────────────────────────────────────────────────────────────
  addCustomer: async (customerData) => {
    const newId = `cust-${Date.now()}`;
    const nowStr = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id: newId,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    await dbInsertCustomer(newCustomer);
    set((state) => ({
      customers: [newCustomer, ...state.customers],
      editingCustomerId: null
    }));
  },

  updateCustomer: async (id, updatedFields) => {
    const nowStr = new Date().toISOString();
    const existing = get().customers.find((c) => c.id === id);
    if (!existing) return;

    const updatedCustomer = { ...existing, ...updatedFields, updatedAt: nowStr };
    await updateCustomerData(updatedCustomer);

    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? updatedCustomer : c)),
      editingCustomerId: null
    }));
  },

  deleteCustomer: async (id) => {
    // performing soft delete
    const nowStr = new Date().toISOString();
    const existing = get().customers.find((c) => c.id === id);
    if (!existing) return;
    const updatedStatus: CustomerStatus = 'Inactive';
    const updatedCustomer = { ...existing, status: updatedStatus, updatedAt: nowStr };
    await updateCustomerData(updatedCustomer)

    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? updatedCustomer : c)),
    }));
  },

  // ── Payments ─────────────────────────────────────────────────────────────
  addPayment: async (paymentData) => {
    const newId = `pay-${Date.now()}`;
    const randReceiptNum = `REC-${getCurrentYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment: Payment = {
      ...paymentData,
      id: newId,
      receiptNumber: randReceiptNum
    };

    await dbInsertPayment(newPayment);
    set((state) => ({
      payments: [newPayment, ...state.payments],
      paymentEntryCustomerId: null,
      paymentEntryPreselectedMonth: null
    }));
  },

  deletePayment: async (id) => {
    await deletePaymentData(id);
    set((state) => ({ payments: state.payments.filter((p) => p.id !== id) }));
  },

  // ── Profile & Settings ───────────────────────────────────────────────────
  updateProfile: async (updatedProfile) => {
    await saveProfile(updatedProfile);
    set({ profile: updatedProfile });
  },

  toggleDarkMode: async () => {
    const { settings } = get();
    const newSettings = { ...settings, darkMode: !settings.darkMode };
    await saveSettings(newSettings);
    set({ settings: newSettings });

    if (typeof document !== 'undefined') {
      if (newSettings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  toggleNotifications: async () => {
    const { settings } = get();
    const newSettings = { ...settings, notificationsEnabled: !settings.notificationsEnabled };
    await saveSettings(newSettings);
    set({ settings: newSettings });
  },

  addSupportedNewspaper: async (newspaper) => {
    if (!newspaper.trim()) return;
    const { settings } = get();
    const current = settings.supportedNewspapers || [];
    const newSettings = { ...settings, supportedNewspapers: [...current, newspaper.trim()] };
    await saveSettings(newSettings);
    set({ settings: newSettings });
  },

  toggleSupportedNewspaper: async (newspaper) => {
    const { settings } = get();
    const current = settings.supportedNewspapers || [];
    const exists = current.includes(newspaper);
    const newList = exists ? current.filter((n) => n !== newspaper) : [...current, newspaper];
    const newSettings = { ...settings, supportedNewspapers: newList, allNewspapers: settings.allNewspapers };
    await saveSettings(newSettings);
    set({ settings: newSettings });
  },

  // ── Data utilities ───────────────────────────────────────────────────────
  backupData: () => {
    const { customers, payments, profile, settings } = get();
    return JSON.stringify({ customers, payments, profile, settings }, null, 2);
  },

  restoreData: async (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.customers && parsed.payments && parsed.profile) {
        set({
          customers: parsed.customers,
          payments: parsed.payments,
          profile: parsed.profile,
          ...(parsed.settings ? { settings: parsed.settings } : {})
        });
        return true;
      }
    } catch (e) {
      console.error('Failed to restore data:', e);
    }
    return false;
  },

  resetToDefaults: async () => {
    const defaultSettings = {
      darkMode: false,
      notificationsEnabled: true,
      appVersion: '1.2.0',
      supportedNewspapers: [] as string[],
      allNewspapers: NEWSPAPERS
    };
    set({
      customers: [],
      payments: [],
      profile: null,
      settings: defaultSettings,
      selectedCustomerId: null,
      editingCustomerId: null,
      paymentEntryCustomerId: null,
      paymentEntryPreselectedMonth: null,
      currentTab: 'dashboard'
    });
    await saveSettings(defaultSettings);
    await saveProfile(null);
  }
}));
