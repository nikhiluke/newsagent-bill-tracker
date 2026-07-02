export type CustomerStatus = 'Active' | 'Inactive';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  landmark?: string;
  newspaperName: string;
  newspapersCount: number;
  monthlyBill: number;
  startDate: string;
  deliveryNotes?: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';

export interface Payment {
  id: string;
  customerId: string;
  month: string; // e.g. "January"
  year: number;  // e.g. 2026
  billAmount: number;
  discount: number;
  lateFee: number;
  finalAmount: number;
  paidAmount: number;
  balance: number;
  paymentMode: PaymentMode;
  paymentDate: string;
  remarks?: string;
  receiptNumber: string;
}

export interface DistributorProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  passPin: number;
}

export interface AppSettings {
  darkMode: boolean;
  notificationsEnabled: boolean;
  appVersion: string;
  supportedNewspapers?: string[];
  allNewspapers?: string[];
}

export interface IPayment extends Payment {
  customerName: string;
  phone: string;
}

export interface ReceiptModalProps {
  profile: DistributorProfile;
  payment: IPayment;
  onClose: () => void;
}