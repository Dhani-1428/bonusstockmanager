"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getSales, getProducts, getShopById, updateSale, updateProduct, updateIMEI, getIMEIRecords } from "@/lib/store"
import type { IMEIRecord } from "@/lib/types"
import { Sale, Product, SaleItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ReceiptPrinter } from "@/components/dashboard/receipt-printer"
import { Search, Eye, Printer, RefreshCcw, DollarSign, TrendingUp, Receipt, Calendar } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

export default function SalesPage() {
  const { currentShop } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)

  useEffect(() => {
    if (currentShop) {
      setSales(getSales(currentShop.id))
      setProducts(getProducts(currentShop.id))
    }
  }, [currentShop])

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId)
    return product?.name || "Unknown Product"
  }

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || sale.paymentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalSales = sales.length
  const pendingAmount = sales
    .filter(s => s.paymentStatus === "partial" || s.paymentStatus === "pending")
    .reduce((sum, sale) => sum + sale.dueAmount, 0)

  const handleRefund = (sale: Sale) => {
    if (!currentShop) return
    
    // Restore inventory
    sale.items.forEach(item => {
      const product = products.find(p => p.id === item.productId)
      if (product) {
        updateProduct(product.id, {
          stockQuantity: product.stockQuantity + item.quantity
        })
        const imeis = item.imeiNumbers || (item.imeiNumber ? [item.imeiNumber] : [])
        const records = getIMEIRecords(currentShop.id)
        imeis.forEach(imei => {
          const record = records.find(r => r.imei === imei)
          if (record) {
            updateIMEI(record.id, { status: "in_stock" })
          }
        })
      }
    })

    // Update sale status
    updateSale(currentShop.id, sale.id, { paymentStatus: "refunded" })
    setSales(getSales(currentShop.id))
    setProducts(getProducts(currentShop.id))
    toast.success("Sale refunded successfully")
    setShowDetails(false)
  }

  const shop = currentShop ? getShopById(currentShop.id) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
        <p className="text-muted-foreground">View and manage all sales transactions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">${pendingAmount.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales.filter(s => 
                new Date(s.createdAt).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>All Sales</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by receipt or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full md:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No sales found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono font-medium">{sale.receiptNumber}</TableCell>
                      <TableCell>{format(new Date(sale.createdAt), "PPP")}</TableCell>
                      <TableCell>{sale.customerName || "Walk-in"}</TableCell>
                      <TableCell>{sale.items.length} items</TableCell>
                      <TableCell className="font-medium">${sale.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            sale.paymentStatus === "paid" ? "default" :
                            sale.paymentStatus === "refunded" ? "destructive" :
                            "secondary"
                          }
                          className={
                            sale.paymentStatus === "paid" ? "bg-success text-success-foreground" : ""
                          }
                        >
                          {sale.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSale(sale)
                              setShowDetails(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSale(sale)
                              setShowReceipt(true)
                            }}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sale Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sale Details - {selectedSale?.receiptNumber}</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{format(new Date(selectedSale.createdAt), "PPP p")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge 
                    variant={selectedSale.paymentStatus === "paid" ? "default" : "secondary"}
                    className={selectedSale.paymentStatus === "paid" ? "bg-success text-success-foreground" : ""}
                  >
                    {selectedSale.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{selectedSale.customerName || "Walk-in"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <p className="font-medium capitalize">{selectedSale.paymentMethod}</p>
                </div>
                {selectedSale.customerPhone && (
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedSale.customerPhone}</p>
                  </div>
                )}
                {selectedSale.customerAddress && (
                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="font-medium">{selectedSale.customerAddress}</p>
                  </div>
                )}
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>IMEI</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.items.map((item, index) => {
                      const imei = item.imeiNumber || (item.imeiNumbers && item.imeiNumbers.length > 0 ? item.imeiNumbers[0] : null)
                      return (
                        <TableRow key={index}>
                          <TableCell>{getProductName(item.productId)}</TableCell>
                          <TableCell className="font-mono text-xs">{imei || "-"}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${(item.totalPrice || item.total).toFixed(2)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2 text-right">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${selectedSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span>-${selectedSale.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>${selectedSale.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${selectedSale.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid:</span>
                  <span>${selectedSale.paidAmount.toFixed(2)}</span>
                </div>
                {selectedSale.dueAmount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Due:</span>
                    <span>${selectedSale.dueAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                {selectedSale.paymentStatus !== "refunded" && (
                  <Button variant="destructive" onClick={() => handleRefund(selectedSale)}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Process Refund
                  </Button>
                )}
                <Button onClick={() => {
                  setShowDetails(false)
                  setShowReceipt(true)
                }}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Printer */}
      <ReceiptPrinter
        sale={selectedSale}
        shop={shop}
        products={products}
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
      />
    </div>
  )
}
