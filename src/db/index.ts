import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';
import path from 'path';

let db: any;

const INIT_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS user (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified integer NOT NULL DEFAULT 0,
  image text,
  created_at integer NOT NULL,
  updated_at integer NOT NULL
);
CREATE TABLE IF NOT EXISTS session (
  id text PRIMARY KEY NOT NULL,
  expires_at integer NOT NULL,
  token text NOT NULL UNIQUE,
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  ip_address text,
  user_agent text,
  user_id text NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS account (
  id text PRIMARY KEY NOT NULL,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id text NOT NULL,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at integer,
  refresh_token_expires_at integer,
  scope text,
  password text,
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS verification (
  id text PRIMARY KEY NOT NULL,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at integer NOT NULL,
  created_at integer,
  updated_at integer
);
CREATE TABLE IF NOT EXISTS admin_users (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  name text NOT NULL,
  created_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id integer NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at text NOT NULL,
  created_at text NOT NULL,
  FOREIGN KEY (user_id) REFERENCES admin_users(id)
);
CREATE TABLE IF NOT EXISTS customers (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  address text,
  photo_urls text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  name text NOT NULL,
  rate real NOT NULL,
  category text,
  product_type text NOT NULL,
  stock_quantity integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 5,
  total_sales integer NOT NULL DEFAULT 0,
  total_rentals integer NOT NULL DEFAULT 0,
  last_restocked text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS sales_bills (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  serial_no integer NOT NULL,
  bill_date text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text,
  items text NOT NULL,
  subtotal real NOT NULL,
  tax_percentage real NOT NULL DEFAULT 0,
  tax_amount real NOT NULL,
  tax_type text,
  advance_amount real NOT NULL,
  total_amount real NOT NULL,
  is_paid integer NOT NULL,
  customer_feedback text,
  shop_name text,
  shop_address text,
  shop_phone_1 text,
  shop_phone_2 text,
  shop_logo_url text,
  shop_qr_url text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS rental_bills (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  serial_no integer NOT NULL,
  from_date text NOT NULL,
  to_date text,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text,
  items text NOT NULL,
  subtotal real NOT NULL,
  transport_fees real NOT NULL,
  tax_percentage real NOT NULL DEFAULT 0,
  tax_amount real NOT NULL,
  tax_type text,
  advance_amount real NOT NULL,
  total_amount real NOT NULL,
  is_paid integer NOT NULL,
  customer_feedback text,
  shop_name text,
  shop_address text,
  shop_phone_1 text,
  shop_phone_2 text,
  shop_logo_url text,
  shop_qr_url text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  bill_type text NOT NULL,
  bill_id integer NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text,
  items text NOT NULL,
  total_amount real NOT NULL,
  booking_date text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'booked',
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS calendar_bookings (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  booking_date text NOT NULL,
  bill_type text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  notes text,
  created_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS shop_settings (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  shop_name text NOT NULL,
  shop_address text,
  phone_number_1 text,
  phone_number_2 text,
  logo_url text,
  payment_qr_url text,
  language text NOT NULL DEFAULT 'english',
  theme text NOT NULL DEFAULT 'light',
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS stock_history (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  product_id integer NOT NULL,
  change_type text NOT NULL,
  quantity_change integer NOT NULL,
  previous_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  notes text,
  created_at text NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`;

try {
  const isBlockedSandboxUrl = process.env.TURSO_CONNECTION_URL?.includes('db-4d39cf09');
  const hasCustomRemoteUrl = Boolean(
    process.env.TURSO_CONNECTION_URL &&
    !isBlockedSandboxUrl &&
    !process.env.TURSO_CONNECTION_URL.startsWith('file:')
  );
  const dbUrl = hasCustomRemoteUrl ? process.env.TURSO_CONNECTION_URL! : 'file:local.db';
  const client = createClient({
    url: dbUrl,
    authToken: hasCustomRemoteUrl ? process.env.TURSO_AUTH_TOKEN : undefined,
  });

  // If local sqlite file, run initial schema setup
  if (dbUrl.startsWith('file:')) {
    client.executeMultiple(INIT_SCHEMA_SQL).catch((err) => {
      console.warn('[AI Studio] Local DB schema init warning:', err);
    });
  }

  db = drizzle(client, { schema });
} catch (error) {
  console.warn('[AI Studio] Database not connected — using mock', error);
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  db = new Proxy({}, {
    get: (_, prop) =>
      prop === 'query'
        ? new Proxy({}, { get: () => noOp })
        : async () => [],
  });
}

export { db };
export type Database = typeof db;