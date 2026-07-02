import { getDB } from './db';
import { Payment } from '../types';

export const getPayments = async (): Promise<Payment[]> => {
  try {
    const db = getDB();
    const allRows = await db.getAllAsync<Payment>('SELECT * FROM payments ORDER BY paymentDate DESC;');
    return allRows;
  } catch (error) {
    console.error('[paymentQueries] getPayments failed:', error);
    throw error;
  }
};

export const insertPayment = async (payment: Payment): Promise<void> => {
  try {
    const db = getDB();
    await db.runAsync(
      `INSERT INTO payments (id, customerId, month, year, billAmount, discount, lateFee, finalAmount, paidAmount, balance, paymentMode, paymentDate, remarks, receiptNumber) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        payment.id,
        payment.customerId,
        payment.month,
        payment.year,
        payment.billAmount,
        payment.discount,
        payment.lateFee,
        payment.finalAmount,
        payment.paidAmount,
        payment.balance,
        payment.paymentMode,
        payment.paymentDate,
        payment.remarks || null,
        payment.receiptNumber
      ]
    );
  } catch (error) {
    console.error('[paymentQueries] insertPayment failed:', error);
    throw error;
  }
};

export const deletePaymentData = async (id: string): Promise<void> => {
  try {
    const db = getDB();
    await db.runAsync('DELETE FROM payments WHERE id = ?;', [id]);
  } catch (error) {
    console.error('[paymentQueries] deletePaymentData failed:', error);
    throw error;
  }
};
