export type UserRole = 'admin' | 'manager' | 'staff'

export interface User {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  shopIds: string[]
  createdAt: string
  emailVerified: boolean
  subscriptionId?: string
  subscriptionStatus?: 'active' | 'inactive' | 'suspended' | 'trial'
  subscriptionEndDate?: string
}

// Super Admin Types
export interface SuperAdmin {
  id: string
  email: string
  password: string
  name: string
  role: 'superadmin'
  createdAt: string
}

export interface Subscription {
  id: string
  name: string
  price: number
  billingCycle: 'monthly' | '6months' | 'yearly'
  shopType: 'single' | 'multiple'
  features: string[]
  maxShops: number
  maxProducts: number
  maxUsers: number
  isActive: boolean
  createdAt: string
}

export interface UserSubscription {
  id: string
  userId: string
  subscriptionId: string
  status: 'trial' | 'active' | 'expired' | 'cancelled'
  startDate: string
  endDate: string
  trialEndDate?: string
  autoRenew: boolean
  createdAt: string
}

export interface Payment {
  id: string
  userId: string
  subscriptionId: string
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: 'card' | 'bank_transfer' | 'mobile'
  transactionId?: string
  createdAt: string
}

export interface PlatformStats {
  totalUsers: number
  activeUsers: number
  totalShops: number
  totalRevenue: number
  monthlyRevenue: number
  totalSales: number
  newUsersThisMonth: number
}

export interface Shop {
  id: string
  name: string
  address: string
  phone: string
  taxNumber?: string
  logo?: string
  footerMessage?: string
  ownerId: string
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  totalPurchases: number
  totalSpent: number
  lastPurchase: string | null
  shopId: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  type: 'phone' | 'accessory' | 'spare_part'
  shopId: string
}

export interface Product {
  id: string
  name: string
  brand: string
  categoryId: string
  sku: string
  barcode: string
  stockQuantity: number
  purchasePrice: number
  sellingPrice: number
  image?: string
  shopId: string
  createdAt: string
  lowStockThreshold: number
}

export interface IMEIRecord {
  id: string
  imei: string
  productId: string
  status: 'in_stock' | 'sold' | 'returned'
  saleId?: string
  shopId: string
  createdAt: string
}

export interface Supplier {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  shopId: string
  createdAt: string
}

export interface PurchaseRecord {
  id: string
  supplierId: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  shopId: string
  createdAt: string
}

export interface Sale {
  id: string
  receiptNumber: string
  items: SaleItem[]
  subtotal: number
  tax: number
  taxAmount: number
  total: number
  totalAmount: number
  discountAmount: number
  paidAmount: number
  dueAmount: number
  paymentMethod: 'cash' | 'card' | 'mobile'
  paymentStatus: 'paid' | 'partial' | 'pending' | 'refunded'
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  shopId: string
  staffId: string
  createdAt: string
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
  totalPrice: number
  discount: number
  imeiNumber?: string
  imeiNumbers?: string[]
}

export interface CartItem {
  product: Product
  quantity: number
  imeiNumbers?: string[]
}

export interface StockTransfer {
  id: string
  fromShopId: string
  toShopId: string
  productId: string
  quantity: number
  status: 'pending' | 'completed'
  createdAt: string
}

export interface DashboardStats {
  totalProducts: number
  lowStockCount: number
  todaySales: number
  monthlyRevenue: number
  profit: number
}
