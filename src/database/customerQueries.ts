import { getDB } from './db';
import { Customer } from '../types';

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const db = getDB();
    const allRows = await db.getAllAsync<Customer>('SELECT * FROM customers ORDER BY createdAt DESC;');
    return allRows;
  } catch (error) {
    console.error('[customerQueries] getCustomers failed:', error);
    throw error;
  }
};

export const insertCustomer = async (customer: Customer): Promise<void> => {
  try {
    console.log('db', customer);
    const db = getDB();
    await db.runAsync(
      `INSERT INTO customers (id, name, phone, address, landmark, newspaperName, newspapersCount, monthlyBill, startDate, deliveryNotes, status, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        customer.id,
        customer.name,
        customer.phone,
        customer.address,
        customer.landmark || null,
        customer.newspaperName,
        customer.newspapersCount,
        customer.monthlyBill,
        customer.startDate,
        customer.deliveryNotes || null,
        customer.status,
        customer.createdAt,
        customer.updatedAt
      ]
    );
  } catch (error) {
    console.error('[customerQueries] insertCustomer failed:', error);
    throw error;
  }
};

export const updateCustomerData = async (customer: Customer): Promise<void> => {
  try {
    const db = getDB();
    await db.runAsync(
      `UPDATE customers 
       SET name = ?, phone = ?, address = ?, landmark = ?, newspaperName = ?, newspapersCount = ?, monthlyBill = ?, startDate = ?, deliveryNotes = ?, status = ?, updatedAt = ? 
       WHERE id = ?;`,
      [
        customer.name,
        customer.phone,
        customer.address,
        customer.landmark || null,
        customer.newspaperName,
        customer.newspapersCount,
        customer.monthlyBill,
        customer.startDate,
        customer.deliveryNotes || null,
        customer.status,
        customer.updatedAt,
        customer.id
      ]
    );
  } catch (error) {
    console.error('[customerQueries] updateCustomerData failed:', error);
    throw error;
  }
};

export const deleteCustomerData = async (id: string): Promise<void> => {
  try {
    const db = getDB();
    await db.runAsync('DELETE FROM customers WHERE id = ?;', [id]);
  } catch (error) {
    console.error('[customerQueries] deleteCustomerData failed:', error);
    throw error;
  }
};

export const getCustomerById = async (id: string): Promise<Customer> => {
  try {
    const db = getDB();
    const allRows = await db.getFirstAsync<Customer>('SELECT * FROM customers WHERE id = ?;', [id]);
    return allRows;
  } catch (error) {
    console.error('[customerQueries] getCustomerById failed:', error);
    throw error;
  }
}