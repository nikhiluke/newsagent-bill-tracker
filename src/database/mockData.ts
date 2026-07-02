import { Customer, Payment, DistributorProfile, AppSettings } from '../types';

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'John Doe',
    phone: '9876543210',
    address: '123 Main St',
    landmark: 'Near Park',
    newspaperName: 'Daily News',
    newspapersCount: 2,
    monthlyBill: 1500,
    startDate: '2023-01-01',
    deliveryNotes: '',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-2',
    name: 'Jane Smith',
    phone: '9123456780',
    address: '456 Oak Ave',
    newspaperName: 'Morning Herald',
    newspapersCount: 1,
    monthlyBill: 800,
    startDate: '2024-03-15',
    deliveryNotes: '',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    customerId: 'cust-1',
    month: 'January',
    year: 2026,
    billAmount: 1500,
    discount: 0,
    lateFee: 0,
    finalAmount: 1500,
    paidAmount: 1500,
    balance: 0,
    paymentMode: 'Cash',
    paymentDate: '2026-01-05',
    receiptNumber: 'REC-2026-1001',
  },
];

export const MOCK_PROFILE: DistributorProfile = {
  businessName: 'Demo Newspaper Agency',
  ownerName: 'Owner Name',
  phone: '9876543210',
  address: 'Demo Address',
  passPin: 1234
};

export const MOCK_SETTINGS: AppSettings = {
  darkMode: false,
  notificationsEnabled: true,
  appVersion: '1.2.0',
};
