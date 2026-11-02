import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Role = 'Admin' | 'Kasir';

export type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: Role;
  active: boolean;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  featured: boolean;
};

export type TransactionItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Transaction = {
  id: string;
  cashier: string;
  createdAt: string;
  items: TransactionItem[];
  total: number;
};

export type StoreData = {
  users: User[];
  products: Product[];
  transactions: Transaction[];
};

type CurrentUserContextValue = {
  user: User;
  logout: () => void;
};

const UserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ user, logout, children }: { user: User; logout: () => void; children: React.ReactNode }) {
  return <UserContext.Provider value={{ user, logout }}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useCurrentUser harus digunakan di dalam CurrentUserProvider.');
  return context.user;
}

export function useLogout() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useLogout harus digunakan di dalam CurrentUserProvider.');
  return context.logout;
}

const STORAGE_KEY = 'kasirku-store-v1';

export const initialStore: StoreData = {
  users: [
    { id: 'admin-1', name: 'Administrator', username: 'admin', password: 'admin123', role: 'Admin', active: true },
    { id: 'cashier-1', name: 'Kasir Demo', username: 'kasir', password: 'kasir123', role: 'Kasir', active: true },
  ],
  products: [
    { id: 'product-1', name: 'Kopi Susu Aren', price: 18000, stock: 24, category: 'Minuman', featured: true },
    { id: 'product-2', name: 'Croissant Butter', price: 22000, stock: 12, category: 'Makanan', featured: true },
    { id: 'product-3', name: 'Matcha Latte', price: 24000, stock: 18, category: 'Minuman', featured: false },
    { id: 'product-4', name: 'Roti Cokelat', price: 15000, stock: 20, category: 'Makanan', featured: false },
  ],
  transactions: [],
};

type StoreContextValue = {
  data: StoreData;
  persistenceError: string | null;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  toggleUser: (userId: string) => void;
  addUser: (user: Omit<User, 'id' | 'active'>) => void;
  completeTransaction: (items: TransactionItem[], cashier: string) => string | null;
  deleteTransaction: (transactionId: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ initialData, children }: { initialData: StoreData; children: React.ReactNode }) {
  const [data, setData] = useState(initialData);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      .then(() => setPersistenceError(null))
      .catch((error: unknown) => {
        setPersistenceError(error instanceof Error ? error.message : 'Data gagal disimpan di perangkat.');
      });
  }, [data]);

  const value = useMemo<StoreContextValue>(() => ({
    data,
    persistenceError,
    addProduct: (product) => setData((current) => ({
      ...current,
      products: [{ ...product, id: `product-${Date.now()}` }, ...current.products],
    })),
    updateProduct: (product) => setData((current) => ({
      ...current,
      products: current.products.map((item) => item.id === product.id ? product : item),
    })),
    deleteProduct: (productId) => setData((current) => ({
      ...current,
      products: current.products.filter((item) => item.id !== productId),
    })),
    toggleUser: (userId) => setData((current) => ({
      ...current,
      users: current.users.map((user) => user.id === userId ? { ...user, active: !user.active } : user),
    })),
    addUser: (user) => setData((current) => ({
      ...current,
      users: [...current.users, { ...user, id: `user-${Date.now()}`, active: true }],
    })),
    completeTransaction: (items, cashier) => {
      const currentProducts = data.products;
      const insufficient = items.find((item) => {
        const product = currentProducts.find((candidate) => candidate.id === item.productId);
        return !product || product.stock < item.quantity;
      });
      if (insufficient) return `Stok ${insufficient.name} tidak mencukupi.`;
      if (items.length === 0) return 'Tambahkan produk ke keranjang terlebih dahulu.';

      const transaction: Transaction = {
        id: `trx-${Date.now()}`,
        cashier,
        createdAt: new Date().toISOString(),
        items,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      };
      setData((current) => ({
        ...current,
        products: current.products.map((product) => {
          const purchased = items.find((item) => item.productId === product.id);
          return purchased ? { ...product, stock: product.stock - purchased.quantity } : product;
        }),
        transactions: [transaction, ...current.transactions],
      }));
      return null;
    },
    deleteTransaction: (transactionId) => setData((current) => {
      const transaction = current.transactions.find((item) => item.id === transactionId);
      if (!transaction) return current;
      return {
        ...current,
        products: current.products.map((product) => {
          const returned = transaction.items.find((item) => item.productId === product.id);
          return returned ? { ...product, stock: product.stock + returned.quantity } : product;
        }),
        transactions: current.transactions.filter((item) => item.id !== transactionId),
      };
    }),
  }), [data, persistenceError]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore harus digunakan di dalam StoreProvider.');
  return store;
}

export async function loadStore(): Promise<StoreData> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (!saved) return initialStore;
  const parsed: unknown = JSON.parse(saved);
  if (!isStoreData(parsed)) throw new Error('Data lokal aplikasi tidak valid. Hapus data aplikasi lalu coba kembali.');
  return parsed;
}

function isStoreData(value: unknown): value is StoreData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoreData>;
  return Array.isArray(candidate.users) &&
    candidate.users.every(isUser) &&
    Array.isArray(candidate.products) &&
    candidate.products.every(isProduct) &&
    Array.isArray(candidate.transactions) &&
    candidate.transactions.every(isTransaction);
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<User>;
  return typeof user.id === 'string' && typeof user.name === 'string' &&
    typeof user.username === 'string' && typeof user.password === 'string' &&
    (user.role === 'Admin' || user.role === 'Kasir') && typeof user.active === 'boolean';
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false;
  const product = value as Partial<Product>;
  return typeof product.id === 'string' && typeof product.name === 'string' &&
    typeof product.price === 'number' && typeof product.stock === 'number' &&
    typeof product.category === 'string' && typeof product.featured === 'boolean';
}

function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== 'object') return false;
  const transaction = value as Partial<Transaction>;
  return typeof transaction.id === 'string' && typeof transaction.cashier === 'string' &&
    typeof transaction.createdAt === 'string' && typeof transaction.total === 'number' &&
    Array.isArray(transaction.items) && transaction.items.every((item) => {
      if (!item || typeof item !== 'object') return false;
      const transactionItem = item as Partial<TransactionItem>;
      return typeof transactionItem.productId === 'string' && typeof transactionItem.name === 'string' &&
        typeof transactionItem.price === 'number' && typeof transactionItem.quantity === 'number';
    });
}
