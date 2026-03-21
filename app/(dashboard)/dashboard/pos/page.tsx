'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { 
  getProducts, getProductByBarcode, createSale, 
  getAvailableIMEIs, getShopById
} from '@/lib/store'
import type { Product, CartItem, IMEIRecord } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ScanBarcode, Plus, Minus, Trash2, ShoppingCart, 
  CreditCard, Banknote, Smartphone, Search, Receipt,
  X, Check, Camera
} from 'lucide-react'
import { BarcodeScanner } from '@/components/dashboard/barcode-scanner'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export default function POSPage() {
  const { currentShop, user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [imeiSelectProduct, setImeiSelectProduct] = useState<{ product: Product; availableImeis: IMEIRecord[] } | null>(null)
  const [lastSale, setLastSale] = useState<{ receiptNumber: string; total: number } | null>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentShop) {
      setProducts(getProducts(currentShop.id))
      // Reset transactional state when switching shops so old-shop cart/items
      // don't carry over into the newly selected shop.
      setCart([])
      setImeiSelectProduct(null)
      setBarcodeInput('')
      setSearchQuery('')
    }
  }, [currentShop])

  // Auto-focus barcode input for fast scanning
  useEffect(() => {
    barcodeInputRef.current?.focus()
  }, [])

  const handleBarcodeSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (!barcodeInput.trim() || !currentShop) return

    const product = getProductByBarcode(barcodeInput.trim(), currentShop.id)
    if (product) {
      addToCart(product)
      setBarcodeInput('')
    } else {
      toast.error('Product not found')
    }
    barcodeInputRef.current?.focus()
  }, [barcodeInput, currentShop])

  const addToCart = (product: Product) => {
    // Check if it's a phone that needs IMEI selection
    const availableImeis = getAvailableIMEIs(product.id)
    
    if (availableImeis.length > 0) {
      // For phones with IMEIs, show IMEI selection
      setImeiSelectProduct({ product, availableImeis })
      return
    }

    // For other products, just add to cart
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast.error('Not enough stock')
          return prev
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    toast.success(`Added ${product.name} to cart`)
  }

  const addWithIMEI = (product: Product, imei: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                imeiNumbers: [...(item.imeiNumbers || []), imei]
              }
            : item
        )
      }
      return [...prev, { product, quantity: 1, imeiNumbers: [imei] }]
    })
    setImeiSelectProduct(null)
    toast.success(`Added ${product.name} (IMEI: ${imei.slice(-4)}) to cart`)
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id !== productId) return item
        const newQty = item.quantity + delta
        if (newQty <= 0) return item
        if (newQty > item.product.stockQuantity) {
          toast.error('Not enough stock')
          return item
        }
        return { ...item, quantity: newQty }
      })
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setCustomerAddress('')
  }

  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0)
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + tax

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }
    setIsCheckoutOpen(true)
  }

  const completeSale = () => {
    if (!currentShop || !user) return

    const sale = createSale({
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice,
        total: item.product.sellingPrice * item.quantity,
        totalPrice: item.product.sellingPrice * item.quantity,
        discount: 0,
        imeiNumbers: item.imeiNumbers,
      })),
      subtotal,
      tax,
      taxAmount: tax,
      total,
      totalAmount: total,
      discountAmount: 0,
      paidAmount: total,
      dueAmount: 0,
      paymentStatus: 'paid',
      paymentMethod,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      customerAddress: customerAddress || undefined,
      shopId: currentShop.id,
      staffId: user.id,
    })

    setLastSale({ receiptNumber: sale.receiptNumber, total: sale.totalAmount })
    setIsCheckoutOpen(false)
    clearCart()
    setProducts(getProducts(currentShop.id)) // Refresh product stock
    toast.success('Sale completed!')
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Products Panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="mb-4 space-y-4">
          {/* Barcode Scanner Input */}
          <div className="flex gap-2">
            <form onSubmit={handleBarcodeSubmit} className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan barcode or enter manually..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="pl-10 text-lg"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>
              <Button type="submit">Add</Button>
            </form>
            <BarcodeScanner
              onScan={(code) => {
                // Auto-submit scanned code
                const product = getProductByBarcode(code, currentShop?.id || '')
                if (product) {
                  addToCart(product)
                  setBarcodeInput('')
                  toast.success(`Added ${product.name}`)
                } else {
                  toast.error('Product not found')
                }
              }}
              buttonText=""
              buttonVariant="outline"
            />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <motion.button
                key={product.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                disabled={product.stockQuantity === 0}
                className="flex flex-col items-start rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex w-full items-start justify-between">
                  <p className="font-medium">{product.name}</p>
                  {product.stockQuantity <= product.lowStockThreshold && (
                    <Badge variant="destructive" className="text-xs">Low</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{product.brand}</p>
                <div className="mt-2 flex w-full items-center justify-between">
                  <p className="text-lg font-bold">${product.sellingPrice.toFixed(2)}</p>
                  <Badge variant="outline">{product.stockQuantity} in stock</Badge>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <Card className="w-96 flex-shrink-0 flex flex-col">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-0">
          {/* Cart Items */}
          <div className="flex-1 overflow-auto p-4">
            <AnimatePresence mode="popLayout">
              {cart.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Cart is empty
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${item.product.sellingPrice.toFixed(2)} each
                          </p>
                          {item.imeiNumbers && item.imeiNumbers.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.imeiNumbers.map((imei, i) => (
                                <Badge key={i} variant="secondary" className="text-xs font-mono">
                                  ...{imei.slice(-4)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            disabled={item.quantity <= 1 || !!item.imeiNumbers}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            disabled={!!item.imeiNumbers}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="font-semibold">
                          ${(item.product.sellingPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart Summary */}
          <div className="border-t border-border p-4 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                Clear
              </Button>
              <Button 
                className="flex-1"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Checkout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IMEI Selection Dialog */}
      <Dialog open={!!imeiSelectProduct} onOpenChange={() => setImeiSelectProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select IMEI - {imeiSelectProduct?.product.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-auto">
            {imeiSelectProduct?.availableImeis.map((imei) => (
              <button
                key={imei.id}
                onClick={() => addWithIMEI(imeiSelectProduct.product, imei.imei)}
                className="w-full flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary/50 hover:bg-accent"
              >
                <span className="font-mono">{imei.imei}</span>
                <Check className="h-4 w-4 text-primary" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="space-y-2">
              <Label>Customer Name (Optional)</Label>
              <Input
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Customer Phone (Optional)</Label>
              <Input
                placeholder="Enter phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Customer Address (Optional)</Label>
              <Input
                placeholder="Enter customer address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'cash', label: 'Cash', icon: Banknote },
                  { value: 'card', label: 'Card', icon: CreditCard },
                  { value: 'mobile', label: 'Mobile', icon: Smartphone },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setPaymentMethod(value as typeof paymentMethod)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                      paymentMethod === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Items</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-border pt-2 mt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Button onClick={completeSale} className="w-full gap-2">
              <Receipt className="h-4 w-4" />
              Complete Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Complete Toast */}
      <Dialog open={!!lastSale} onOpenChange={() => setLastSale(null)}>
        <DialogContent>
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Sale Complete!</h3>
            <p className="text-muted-foreground">
              Receipt: {lastSale?.receiptNumber}
            </p>
            <p className="text-2xl font-bold">
              ${lastSale?.total.toFixed(2)}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setLastSale(null)}>
                New Sale
              </Button>
              <Button className="flex-1" onClick={() => {
                toast.info('Receipt printing would be triggered here')
                setLastSale(null)
              }}>
                Print Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
