'use client'

import type { 
  User, Shop, Product, Category, IMEIRecord, 
  Supplier, PurchaseRecord, Sale, StockTransfer, Customer,
  Subscription, UserSubscription
} from './types'

const STORAGE_KEYS = {
  USERS: 'pos_users',
  CURRENT_USER: 'pos_current_user',
  SHOPS: 'pos_shops',
  PRODUCTS: 'pos_products',
  CATEGORIES: 'pos_categories',
  IMEI_RECORDS: 'pos_imei_records',
  SUPPLIERS: 'pos_suppliers',
  PURCHASE_RECORDS: 'pos_purchase_records',
  SALES: 'pos_sales',
  STOCK_TRANSFERS: 'pos_stock_transfers',
  CURRENT_SHOP: 'pos_current_shop',
  CUSTOMERS: 'pos_customers',
  SUBSCRIPTIONS: 'pos_subscriptions',
  USER_SUBSCRIPTIONS: 'pos_user_subscriptions',
} as const

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  const item = localStorage.getItem(key)
  return item ? JSON.parse(item) : defaultValue
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function generateBarcode(): string {
  return Math.random().toString().slice(2, 15)
}

export function generateReceiptNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substr(2, 6).toUpperCase()
  return `RCP-${dateStr}-${random}`
}

// User functions
export function getUsers(): User[] {
  return getItem<User[]>(STORAGE_KEYS.USERS, [])
}

export function createUser(userData: Omit<User, 'id' | 'createdAt' | 'emailVerified'>): User {
  const users = getUsers()
  const newUser: User = {
    ...userData,
    id: generateId(),
    createdAt: new Date().toISOString(),
    emailVerified: false,
  }
  users.push(newUser)
  setItem(STORAGE_KEYS.USERS, users)
  return newUser
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase())
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = getUsers()
  const index = users.findIndex(u => u.id === id)
  if (index === -1) return null
  users[index] = { ...users[index], ...updates }
  setItem(STORAGE_KEYS.USERS, users)
  return users[index]
}

export function getCurrentUser(): User | null {
  return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null)
}

export function setCurrentUser(user: User | null): void {
  setItem(STORAGE_KEYS.CURRENT_USER, user)
}

// Shop functions
export function getShops(): Shop[] {
  return getItem<Shop[]>(STORAGE_KEYS.SHOPS, [])
}

export function getShopById(id: string): Shop | undefined {
  return getShops().find(s => s.id === id)
}

export function getUserShops(userId: string): Shop[] {
  const user = getUsers().find(u => u.id === userId)
  if (!user) return []
  return getShops().filter(s => user.shopIds.includes(s.id))
}

export function createShop(shopData: Omit<Shop, 'id' | 'createdAt'>): Shop {
  const shops = getShops()
  const newShop: Shop = {
    ...shopData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  shops.push(newShop)
  setItem(STORAGE_KEYS.SHOPS, shops)
  
  // Add shop to user's shopIds
  const user = getUsers().find(u => u.id === shopData.ownerId)
  if (user) {
    updateUser(user.id, { shopIds: [...user.shopIds, newShop.id] })
  }
  
  return newShop
}

export function updateShop(id: string, updates: Partial<Shop>): Shop | null {
  const shops = getShops()
  const index = shops.findIndex(s => s.id === id)
  if (index === -1) return null
  shops[index] = { ...shops[index], ...updates }
  setItem(STORAGE_KEYS.SHOPS, shops)
  return shops[index]
}

export function getCurrentShop(): string | null {
  return getItem<string | null>(STORAGE_KEYS.CURRENT_SHOP, null)
}

export function setCurrentShop(shopId: string | null): void {
  setItem(STORAGE_KEYS.CURRENT_SHOP, shopId)
}

// Category functions
export function getCategories(shopId: string): Category[] {
  return getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []).filter(c => c.shopId === shopId)
}

export function createCategory(categoryData: Omit<Category, 'id'>): Category {
  const categories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, [])
  const newCategory: Category = {
    ...categoryData,
    id: generateId(),
  }
  categories.push(newCategory)
  setItem(STORAGE_KEYS.CATEGORIES, categories)
  return newCategory
}

export function deleteCategory(id: string): void {
  const categories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, [])
  setItem(STORAGE_KEYS.CATEGORIES, categories.filter(c => c.id !== id))
}

// Product functions
export function getProducts(shopId: string): Product[] {
  return getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []).filter(p => p.shopId === shopId)
}

export function getProductById(id: string): Product | undefined {
  return getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []).find(p => p.id === id)
}

export function getProductByBarcode(barcode: string, shopId: string): Product | undefined {
  return getProducts(shopId).find(p => p.barcode === barcode)
}

export function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'barcode'> & { barcode?: string }): Product {
  const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, [])
  const newProduct: Product = {
    ...productData,
    id: generateId(),
    barcode: productData.barcode || generateBarcode(),
    createdAt: new Date().toISOString(),
  }
  products.push(newProduct)
  setItem(STORAGE_KEYS.PRODUCTS, products)
  return newProduct
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, [])
  const index = products.findIndex(p => p.id === id)
  if (index === -1) return null
  products[index] = { ...products[index], ...updates }
  setItem(STORAGE_KEYS.PRODUCTS, products)
  return products[index]
}

export function deleteProduct(id: string): void {
  const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, [])
  setItem(STORAGE_KEYS.PRODUCTS, products.filter(p => p.id !== id))
}

export function getLowStockProducts(shopId: string): Product[] {
  return getProducts(shopId).filter(p => p.stockQuantity <= p.lowStockThreshold)
}

// IMEI functions
export function getIMEIRecords(shopId: string): IMEIRecord[] {
  return getItem<IMEIRecord[]>(STORAGE_KEYS.IMEI_RECORDS, []).filter(r => r.shopId === shopId)
}

export function getIMEIByProduct(productId: string): IMEIRecord[] {
  return getItem<IMEIRecord[]>(STORAGE_KEYS.IMEI_RECORDS, []).filter(r => r.productId === productId)
}

export function getAvailableIMEIs(productId: string): IMEIRecord[] {
  return getIMEIByProduct(productId).filter(r => r.status === 'in_stock')
}

export function createIMEI(imeiData: Omit<IMEIRecord, 'id' | 'createdAt'>): IMEIRecord {
  const records = getItem<IMEIRecord[]>(STORAGE_KEYS.IMEI_RECORDS, [])
  const newRecord: IMEIRecord = {
    ...imeiData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  records.push(newRecord)
  setItem(STORAGE_KEYS.IMEI_RECORDS, records)
  return newRecord
}

export function updateIMEI(id: string, updates: Partial<IMEIRecord>): IMEIRecord | null {
  const records = getItem<IMEIRecord[]>(STORAGE_KEYS.IMEI_RECORDS, [])
  const index = records.findIndex(r => r.id === id)
  if (index === -1) return null
  records[index] = { ...records[index], ...updates }
  setItem(STORAGE_KEYS.IMEI_RECORDS, records)
  return records[index]
}

export function checkIMEIDuplicate(imei: string): boolean {
  return getItem<IMEIRecord[]>(STORAGE_KEYS.IMEI_RECORDS, []).some(r => r.imei === imei)
}

// Supplier functions
export function getSuppliers(shopId: string): Supplier[] {
  return getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []).filter(s => s.shopId === shopId)
}

export function createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
  const suppliers = getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, [])
  const newSupplier: Supplier = {
    ...supplierData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  suppliers.push(newSupplier)
  setItem(STORAGE_KEYS.SUPPLIERS, suppliers)
  return newSupplier
}

export function updateSupplier(id: string, updates: Partial<Supplier>): Supplier | null {
  const suppliers = getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, [])
  const index = suppliers.findIndex(s => s.id === id)
  if (index === -1) return null
  suppliers[index] = { ...suppliers[index], ...updates }
  setItem(STORAGE_KEYS.SUPPLIERS, suppliers)
  return suppliers[index]
}

export function deleteSupplier(id: string): void {
  const suppliers = getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, [])
  setItem(STORAGE_KEYS.SUPPLIERS, suppliers.filter(s => s.id !== id))
}

// Purchase Record functions
export function getPurchaseRecords(shopId: string): PurchaseRecord[] {
  return getItem<PurchaseRecord[]>(STORAGE_KEYS.PURCHASE_RECORDS, []).filter(r => r.shopId === shopId)
}

export function createPurchaseRecord(recordData: Omit<PurchaseRecord, 'id' | 'createdAt'>): PurchaseRecord {
  const records = getItem<PurchaseRecord[]>(STORAGE_KEYS.PURCHASE_RECORDS, [])
  const newRecord: PurchaseRecord = {
    ...recordData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  records.push(newRecord)
  setItem(STORAGE_KEYS.PURCHASE_RECORDS, records)
  return newRecord
}

// Sales functions
export function getSales(shopId: string): Sale[] {
  return getItem<Sale[]>(STORAGE_KEYS.SALES, []).filter(s => s.shopId === shopId)
}

export function getSaleById(id: string): Sale | undefined {
  return getItem<Sale[]>(STORAGE_KEYS.SALES, []).find(s => s.id === id)
}

export function createSale(saleData: Omit<Sale, 'id' | 'createdAt' | 'receiptNumber' | 'totalAmount' | 'taxAmount' | 'discountAmount' | 'paidAmount' | 'dueAmount' | 'paymentStatus'> & { 
  totalAmount?: number
  taxAmount?: number
  discountAmount?: number
  paidAmount?: number
  dueAmount?: number
  paymentStatus?: 'paid' | 'partial' | 'pending' | 'refunded'
}): Sale {
  const sales = getItem<Sale[]>(STORAGE_KEYS.SALES, [])
  const totalAmount = saleData.totalAmount ?? saleData.total
  const taxAmount = saleData.taxAmount ?? saleData.tax
  const discountAmount = saleData.discountAmount ?? 0
  const paidAmount = saleData.paidAmount ?? totalAmount
  const dueAmount = saleData.dueAmount ?? (totalAmount - paidAmount)
  const paymentStatus = saleData.paymentStatus ?? (dueAmount > 0 ? 'partial' : 'paid')
  
  const newSale: Sale = {
    ...saleData,
    id: generateId(),
    receiptNumber: generateReceiptNumber(),
    createdAt: new Date().toISOString(),
    totalAmount,
    taxAmount,
    discountAmount,
    paidAmount,
    dueAmount,
    paymentStatus,
  }
  sales.push(newSale)
  setItem(STORAGE_KEYS.SALES, sales)
  
  // Update product stock and IMEI status
  saleData.items.forEach(item => {
    const product = getProductById(item.productId)
    if (product) {
      updateProduct(item.productId, { 
        stockQuantity: product.stockQuantity - item.quantity 
      })
    }
    
    // Mark IMEIs as sold
    const imeis = item.imeiNumbers || (item.imeiNumber ? [item.imeiNumber] : [])
    imeis.forEach(imei => {
      const records = getItem<IMEIRecord[]>(STORAGE_KEYS.IMEI_RECORDS, [])
      const record = records.find(r => r.imei === imei)
      if (record) {
        updateIMEI(record.id, { status: 'sold', saleId: newSale.id })
      }
    })
  })
  
  return newSale
}

export function updateSale(shopId: string, saleId: string, updates: Partial<Sale>): Sale | null {
  const sales = getItem<Sale[]>(STORAGE_KEYS.SALES, [])
  const sale = sales.find(s => s.id === saleId && s.shopId === shopId)
  if (!sale) return null
  
  const index = sales.findIndex(s => s.id === saleId)
  sales[index] = { ...sales[index], ...updates }
  setItem(STORAGE_KEYS.SALES, sales)
  return sales[index]
}

export function getTodaySales(shopId: string): Sale[] {
  const today = new Date().toISOString().slice(0, 10)
  return getSales(shopId).filter(s => s.createdAt.slice(0, 10) === today)
}

export function getMonthSales(shopId: string): Sale[] {
  const month = new Date().toISOString().slice(0, 7)
  return getSales(shopId).filter(s => s.createdAt.slice(0, 7) === month)
}

// Stock Transfer functions
export function getStockTransfers(shopId: string): StockTransfer[] {
  return getItem<StockTransfer[]>(STORAGE_KEYS.STOCK_TRANSFERS, [])
    .filter(t => t.fromShopId === shopId || t.toShopId === shopId)
}

export function createStockTransfer(transferData: Omit<StockTransfer, 'id' | 'createdAt'>): StockTransfer {
  const transfers = getItem<StockTransfer[]>(STORAGE_KEYS.STOCK_TRANSFERS, [])
  const newTransfer: StockTransfer = {
    ...transferData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  transfers.push(newTransfer)
  setItem(STORAGE_KEYS.STOCK_TRANSFERS, transfers)
  return newTransfer
}

export function completeStockTransfer(id: string): void {
  const transfers = getItem<StockTransfer[]>(STORAGE_KEYS.STOCK_TRANSFERS, [])
  const transfer = transfers.find(t => t.id === id)
  if (!transfer || transfer.status === 'completed') return
  
  // Update source shop product stock
  const allProducts = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, [])
  const sourceProduct = allProducts.find(p => p.id === transfer.productId && p.shopId === transfer.fromShopId)
  if (sourceProduct) {
    updateProduct(sourceProduct.id, { stockQuantity: sourceProduct.stockQuantity - transfer.quantity })
  }
  
  // Find or create product in destination shop
  let destProduct = allProducts.find(p => p.id === transfer.productId && p.shopId === transfer.toShopId)
  if (destProduct) {
    updateProduct(destProduct.id, { stockQuantity: destProduct.stockQuantity + transfer.quantity })
  } else if (sourceProduct) {
    // Clone product to destination shop
    createProduct({
      ...sourceProduct,
      shopId: transfer.toShopId,
      stockQuantity: transfer.quantity,
    })
  }
  
  // Mark transfer as completed
  const index = transfers.findIndex(t => t.id === id)
  transfers[index] = { ...transfers[index], status: 'completed' }
  setItem(STORAGE_KEYS.STOCK_TRANSFERS, transfers)
}

// Analytics functions
export function calculateProfit(shopId: string, startDate: string, endDate: string): number {
  const sales = getSales(shopId).filter(s => 
    s.createdAt >= startDate && s.createdAt <= endDate
  )
  
  let profit = 0
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const product = getProductById(item.productId)
      if (product) {
        profit += (item.unitPrice - product.purchasePrice) * item.quantity
      }
    })
  })
  
  return profit
}

export function getTopSellingProducts(shopId: string, limit: number = 5): { productId: string; name: string; totalSold: number }[] {
  const sales = getSales(shopId)
  const productSales: Record<string, { name: string; totalSold: number }> = {}
  
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.productName, totalSold: 0 }
      }
      productSales[item.productId].totalSold += item.quantity
    })
  })
  
  return Object.entries(productSales)
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, limit)
}

// Customer functions
export function getCustomers(shopId: string): Customer[] {
  return getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []).filter(c => c.shopId === shopId)
}

export function createCustomer(shopId: string, customerData: Omit<Customer, 'id' | 'shopId' | 'createdAt' | 'totalPurchases' | 'totalSpent' | 'lastPurchase'>): Customer {
  const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
  const newCustomer: Customer = {
    ...customerData,
    id: generateId(),
    shopId,
    totalPurchases: 0,
    totalSpent: 0,
    lastPurchase: null,
    createdAt: new Date().toISOString(),
  }
  customers.push(newCustomer)
  setItem(STORAGE_KEYS.CUSTOMERS, customers)
  return newCustomer
}

export function updateCustomer(shopId: string, customerId: string, updates: Partial<Omit<Customer, 'id' | 'shopId' | 'createdAt'>>): Customer | null {
  const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
  const customer = customers.find(c => c.id === customerId && c.shopId === shopId)
  if (!customer) return null
  
  const index = customers.findIndex(c => c.id === customerId)
  customers[index] = { ...customers[index], ...updates }
  setItem(STORAGE_KEYS.CUSTOMERS, customers)
  return customers[index]
}

export function deleteCustomer(shopId: string, customerId: string): void {
  const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
  setItem(STORAGE_KEYS.CUSTOMERS, customers.filter(c => !(c.id === customerId && c.shopId === shopId)))
}

// Subscription functions
export function getSubscriptions(): Subscription[] {
  return getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, [])
}

export function createSubscription(subscriptionData: Omit<Subscription, 'id' | 'createdAt'>): Subscription {
  const subscriptions = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, [])
  const newSubscription: Subscription = {
    ...subscriptionData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  subscriptions.push(newSubscription)
  setItem(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions)
  return newSubscription
}

export function getUserSubscription(userId: string): UserSubscription | null {
  const subscriptions = getItem<UserSubscription[]>(STORAGE_KEYS.USER_SUBSCRIPTIONS, [])
  return subscriptions.find(s => s.userId === userId && s.status !== 'cancelled') || null
}

export function createUserSubscription(
  userId: string,
  subscriptionId: string,
  startTrial: boolean = true
): UserSubscription {
  const subscriptions = getItem<UserSubscription[]>(STORAGE_KEYS.USER_SUBSCRIPTIONS, [])
  const subscription = getSubscriptions().find(s => s.id === subscriptionId)
  if (!subscription) {
    throw new Error('Subscription not found')
  }

  const now = new Date()
  const trialEndDate = startTrial ? new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) : null
  
  // Calculate end date based on billing cycle
  let endDate = new Date(now)
  if (!startTrial) {
    if (subscription.billingCycle === 'monthly') {
      endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    } else if (subscription.billingCycle === '6months') {
      endDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
    } else if (subscription.billingCycle === 'yearly') {
      endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    }
  } else {
    endDate = trialEndDate || now
  }

  const newUserSubscription: UserSubscription = {
    id: generateId(),
    userId,
    subscriptionId,
    status: startTrial ? 'trial' : 'active',
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    trialEndDate: trialEndDate?.toISOString(),
    autoRenew: true,
    createdAt: now.toISOString(),
  }

  subscriptions.push(newUserSubscription)
  setItem(STORAGE_KEYS.USER_SUBSCRIPTIONS, subscriptions)

  // Update user subscription status
  updateUser(userId, {
    subscriptionId,
    subscriptionStatus: startTrial ? 'trial' : 'active',
    subscriptionEndDate: endDate.toISOString(),
  })

  return newUserSubscription
}

export function updateUserSubscription(
  subscriptionId: string,
  updates: Partial<UserSubscription>
): UserSubscription | null {
  const subscriptions = getItem<UserSubscription[]>(STORAGE_KEYS.USER_SUBSCRIPTIONS, [])
  const index = subscriptions.findIndex(s => s.id === subscriptionId)
  if (index === -1) return null
  
  subscriptions[index] = { ...subscriptions[index], ...updates }
  setItem(STORAGE_KEYS.USER_SUBSCRIPTIONS, subscriptions)
  return subscriptions[index]
}

export function checkTrialStatus(userId: string): { isTrial: boolean; daysRemaining: number } {
  const userSubscription = getUserSubscription(userId)
  if (!userSubscription || userSubscription.status !== 'trial') {
    return { isTrial: false, daysRemaining: 0 }
  }

  const trialEnd = new Date(userSubscription.trialEndDate || userSubscription.endDate)
  const now = new Date()
  const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  if (daysRemaining === 0 && userSubscription.status === 'trial') {
    // Trial expired, update status
    updateUserSubscription(userSubscription.id, { status: 'expired' })
    updateUser(userId, { subscriptionStatus: 'inactive' })
    return { isTrial: false, daysRemaining: 0 }
  }

  return { isTrial: true, daysRemaining }
}
