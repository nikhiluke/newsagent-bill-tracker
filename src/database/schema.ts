export const initTablesQuery = `
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    landmark TEXT,
    newspaperName TEXT NOT NULL,
    newspapersCount INTEGER NOT NULL,
    monthlyBill REAL NOT NULL,
    startDate TEXT NOT NULL,
    deliveryNotes TEXT,
    status TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY NOT NULL,
    customerId TEXT NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    billAmount REAL NOT NULL,
    discount REAL NOT NULL,
    lateFee REAL NOT NULL,
    finalAmount REAL NOT NULL,
    paidAmount REAL NOT NULL,
    balance REAL NOT NULL,
    paymentMode TEXT NOT NULL,
    paymentDate TEXT NOT NULL,
    remarks TEXT,
    receiptNumber TEXT NOT NULL,
    FOREIGN KEY (customerId) REFERENCES customers (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one row
    businessName TEXT,
    ownerName TEXT,
    phone TEXT,
    address TEXT,
    passPin INTEGER
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one row
    darkMode INTEGER NOT NULL DEFAULT 0,
    notificationsEnabled INTEGER NOT NULL DEFAULT 1,
    appVersion TEXT NOT NULL,
    supportedNewspapers TEXT,
    allNewspapers TEXT
  );
`;
