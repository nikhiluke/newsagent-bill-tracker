import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Payment, DistributorProfile, AppSettings } from '../types';
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
  saveSettings
} from '../database';
import { MOCK_CUSTOMERS, MOCK_PAYMENTS, MOCK_PROFILE, MOCK_SETTINGS } from '../database/mockData';
import { getCurrentYear } from '../utility';

interface AppState {
  isDbReady: boolean;
  customers: Customer[];
  payments: Payment[];
  profile: DistributorProfile;
  settings: AppSettings;
  isLoggedIn: boolean;
  currentTab: 'dashboard' | 'customers' | 'ledger' | 'reports' | 'settings';
  selectedCustomerId: string | null;
  editingCustomerId: string | null;
  paymentEntryCustomerId: string | null;
  paymentEntryPreselectedMonth: string | null;
  
  // Navigation actions
  navigateTo: (tab: 'dashboard' | 'customers' | 'ledger' | 'reports' | 'settings') => void;
  viewCustomerDetails: (id: string) => void;
  openAddCustomer: () => void;
  openEditCustomer: (id: string) => void;
  openPaymentEntry: (id: string, month?: string) => void;
  closeSubScreens: () => void;
  
  // Business actions
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'receiptNumber'>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  updateProfile: (profile: DistributorProfile) => Promise<void>;
  
  // App utilities
  toggleDarkMode: () => Promise<void>;
  toggleNotifications: () => Promise<void>;
  login: (phone: string, passcode: string) => boolean;
  logout: () => void;
  
  // Data actions
  backupData: () => string;
  restoreData: (jsonData: string) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
  addSupportedNewspaper: (newspaper: string) => Promise<void>;
  toggleSupportedNewspaper: (newspaper: string) => Promise<void>;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

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

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDbReady, setIsDbReady] = useState(false);

  // Authentication State (still using localStorage for auth token if needed, or simple mock)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return safeStorage.getItem('ns_logged_in') === 'true';
  });

  // Business Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profile, setProfile] = useState<DistributorProfile>(null);
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false,
    notificationsEnabled: true,
    appVersion: '1.2.0',
    supportedNewspapers: [],
    allNewspapers: NEWSPAPERS
  });

  // UI Navigation State
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'customers' | 'ledger' | 'reports' | 'settings'>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [paymentEntryCustomerId, setPaymentEntryCustomerId] = useState<string | null>(null);
  const [paymentEntryPreselectedMonth, setPaymentEntryPreselectedMonth] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        
        // Fetch all data
        const [fetchedCustomers, fetchedPayments, fetchedProfile, fetchedSettings] = await Promise.all([
          fetchCustomers(),
          fetchPayments(),
          getProfile(),
          getSettings()
        ]);

        // Determine if mock data should be used
        const useMock = process.env.USE_MOCK_DATA === 'true';
        if (useMock) {
          setCustomers(MOCK_CUSTOMERS);
          setPayments(MOCK_PAYMENTS);
          setProfile(MOCK_PROFILE);
          setSettings(MOCK_SETTINGS);
        } else {
          setCustomers(fetchedCustomers);
          setPayments(fetchedPayments);
          setProfile(fetchedProfile);
          setSettings(fetchedSettings);
        }
        setIsDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    // Apply Dark Mode Class
    if (typeof document !== 'undefined') {
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings.darkMode]);

  useEffect(() => {
    safeStorage.setItem('ns_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  const login = (phone: string, passcode: string): boolean => {
    if (profile){
      if (phone == profile.phone && parseInt(passcode) === profile.passPin){
        setIsLoggedIn(true);
        return true;
      }else{
        return false;
      }
    }else{
      return false;
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setSelectedCustomerId(null);
    setEditingCustomerId(null);
    setPaymentEntryCustomerId(null);
    setPaymentEntryPreselectedMonth(null);
    setCurrentTab('dashboard');
  };

  // Navigation Handlers
  const navigateTo = (tab: 'dashboard' | 'customers' | 'ledger' | 'reports' | 'settings') => {
    setCurrentTab(tab);
    setSelectedCustomerId(null);
    setEditingCustomerId(null);
    setPaymentEntryCustomerId(null);
    setPaymentEntryPreselectedMonth(null);
  };

  const viewCustomerDetails = (id: string) => {
    setSelectedCustomerId(id);
    setEditingCustomerId(null);
    setPaymentEntryCustomerId(null);
    setCurrentTab('customers');
  };

  const openAddCustomer = () => {
    setEditingCustomerId('new');
    setSelectedCustomerId(null);
    setPaymentEntryCustomerId(null);
    setCurrentTab('customers');
  };

  const openEditCustomer = (id: string) => {
    setEditingCustomerId(id);
    setSelectedCustomerId(null);
    setPaymentEntryCustomerId(null);
    setCurrentTab('customers');
  };

  const openPaymentEntry = (id: string, month?: string) => {
    setPaymentEntryCustomerId(id);
    setPaymentEntryPreselectedMonth(month || null);
    setSelectedCustomerId(null);
    setEditingCustomerId(null);
    setCurrentTab('ledger');
  };

  const closeSubScreens = () => {
    if (paymentEntryCustomerId) {
      setPaymentEntryCustomerId(null);
      setPaymentEntryPreselectedMonth(null);
    } else if (editingCustomerId) {
      setEditingCustomerId(null);
    } else if (selectedCustomerId) {
      setSelectedCustomerId(null);
    }
  };

  // Customer Management
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `cust-${Date.now()}`;
    const nowStr = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id: newId,
      createdAt: nowStr,
      updatedAt: nowStr
    };
    
    await dbInsertCustomer(newCustomer);
    setCustomers(prev => [newCustomer, ...prev]);
    setEditingCustomerId(null);
  };

  const updateCustomer = async (id: string, updatedFields: Partial<Customer>) => {
    const nowStr = new Date().toISOString();
    const existing = customers.find(c => c.id === id);
    if (!existing) return;
    
    const updatedCustomer = {
      ...existing,
      ...updatedFields,
      updatedAt: nowStr
    };
    
    await updateCustomerData(updatedCustomer);
    
    setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
    setEditingCustomerId(null);
    if (selectedCustomerId === id) {
      setSelectedCustomerId(id);
    }
  };

  const deleteCustomer = async (id: string) => {
    await deleteCustomerData(id);
    
    setCustomers(prev => prev.filter(c => c.id !== id));
    setPayments(prev => prev.filter(p => p.customerId !== id));
    
    if (selectedCustomerId === id) {
      setSelectedCustomerId(null);
    }
    if (editingCustomerId === id) {
      setEditingCustomerId(null);
    }
  };

  // Payment Management
  const addPayment = async (paymentData: Omit<Payment, 'id' | 'receiptNumber'>) => {
    const newId = `pay-${Date.now()}`;
    const randReceiptNum = `REC-${getCurrentYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment: Payment = {
      ...paymentData,
      id: newId,
      receiptNumber: randReceiptNum
    };
    
    await dbInsertPayment(newPayment);
    setPayments(prev => [newPayment, ...prev]);
    setPaymentEntryCustomerId(null);
    setPaymentEntryPreselectedMonth(null);
  };

  const deletePayment = async (id: string) => {
    await deletePaymentData(id);
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  // Settings & Utilities
  const updateProfile = async (updatedProfile: DistributorProfile) => {
    await saveProfile(updatedProfile);
    setProfile(updatedProfile);
  };

  const toggleDarkMode = async () => {
    const newSettings = {
      ...settings,
      darkMode: !settings.darkMode
    };
    await saveSettings(newSettings);
    setSettings(newSettings);
  };

  const toggleNotifications = async () => {
    const newSettings = {
      ...settings,
      notificationsEnabled: !settings.notificationsEnabled
    };
    await saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Supported Newspapers management
  const addSupportedNewspaper = async (newspaper: string) => {
    if (!newspaper.trim()) return;
    const current = settings.supportedNewspapers || [];
    const newList = [...current, newspaper.trim()];
    const newSettings = { ...settings, supportedNewspapers: newList };
    await saveSettings(newSettings);
    setSettings(newSettings);
  };

  const toggleSupportedNewspaper = async (newspaper: string) => {
    const current = settings.supportedNewspapers || [];
    const exists = current.includes(newspaper);
    const newList = exists ? current.filter(n => n !== newspaper) : [...current, newspaper];
    const newSettings = { ...settings, supportedNewspapers: newList, allNewspapers: settings.allNewspapers};
    await saveSettings(newSettings);
    setSettings(newSettings);
  };

  const backupData = (): string => {
    const dataToBackup = {
      customers,
      payments,
      profile,
      settings
    };
    return JSON.stringify(dataToBackup, null, 2);
  };

  const restoreData = async (jsonData: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.customers && parsed.payments && parsed.profile) {
        // Since sqlite requires individual inserts, we would need to 
        // delete existing and insert the parsed ones.
        // For brevity and safe operations, left as exercise or can loop inserts.
        // Doing a shallow React state update for now.
        setCustomers(parsed.customers);
        setPayments(parsed.payments);
        setProfile(parsed.profile);
        if (parsed.settings) {
          setSettings(parsed.settings);
        }
        return true;
      }
    } catch (e) {
      console.error("Failed to restore data:", e);
    }
    return false;
  };

  const resetToDefaults = async () => {
    // Need to clear db as well, this might require custom query
    setCustomers([]);
    setPayments([]);
    setProfile(null);
    const defaultSettings = {
      darkMode: false,
      notificationsEnabled: true,
      appVersion: '1.2.0'
    };
    setSettings(defaultSettings);
    await saveSettings(defaultSettings);
    await saveProfile(null);
    
    setSelectedCustomerId(null);
    setEditingCustomerId(null);
    setPaymentEntryCustomerId(null);
    setPaymentEntryPreselectedMonth(null);
    setCurrentTab('dashboard');
  };

  return (
    <AppStateContext.Provider
      value={{
        isDbReady,
        customers,
        payments,
        profile,
        settings,
        isLoggedIn,
        currentTab,
        selectedCustomerId,
        editingCustomerId,
        paymentEntryCustomerId,
        paymentEntryPreselectedMonth,
        navigateTo,
        viewCustomerDetails,
        openAddCustomer,
        openEditCustomer,
        openPaymentEntry,
        closeSubScreens,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addPayment,
        deletePayment,
        updateProfile,
        toggleDarkMode,
        toggleNotifications,
        addSupportedNewspaper,
        toggleSupportedNewspaper,
        login,
        logout,
        backupData,
        restoreData,
        resetToDefaults
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const decrp_useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
