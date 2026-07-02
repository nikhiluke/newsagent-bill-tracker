import * as SQLite from 'expo-sqlite';
import { initTablesQuery } from './schema';

// Singleton DB instance — opened once and reused across all queries.
// Opening a new connection on every query causes NullPointerException
// on Android when multiple writes happen in quick succession.
let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = (): SQLite.SQLiteDatabase => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('ledger.db');
  }
  return dbInstance;
};

export const initDatabase = async () => {
  try {
    const db = getDB();
    await db.execAsync(initTablesQuery);
    console.log('Database tables initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
