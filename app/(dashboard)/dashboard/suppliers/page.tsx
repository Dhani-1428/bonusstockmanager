'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { 
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getPurchaseRecords, createPurchaseRecord, getProducts
} from '@/lib/store'
import type { Supplier, PurchaseRecord, Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Plus, Truck, Phone, Mail, MapPin, Pencil, Trash2, 
  Package, DollarSign, Calendar
} from 'lucide-react'
import { toast } from 'sonner'

export default function SuppliersPage() {
  const { currentShop } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const loadData = () => {
    if (!currentShop) return
    setSuppliers(getSuppliers(currentShop.id))
    setPurchases(getPurchaseRecords(currentShop.id))
    setProducts(getProducts(currentShop.id))
  }

  useEffect(() => {
    loadData()
  }, [currentShop])

  const handleDeleteSupplier = (id: string) => {
    deleteSupplier(id)
    loadData()
    toast.success('Supplier deleted')
  }

  const getSupplierName = (supplierId: string) => {
    return suppliers.find(s => s.id === supplierId)?.name || 'Unknown'
  }

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Unknown'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
        <p className="text-muted-foreground">
          Manage your suppliers and track purchase history
        </p>
      </div>

      <Tabs defaultValue="suppliers">
        <TabsList>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="purchases">Purchase History</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Supplier</DialogTitle>
                </DialogHeader>
                <SupplierForm 
                  shopId={currentShop?.id || ''}
                  onSuccess={() => {
                    setIsAddSupplierOpen(false)
                    loadData()
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
                  No suppliers added yet
                </CardContent>
              </Card>
            ) : (
              suppliers.map((supplier) => {
                const supplierPurchases = purchases.filter(p => p.supplierId === supplier.id)
                const totalSpent = supplierPurchases.reduce((sum, p) => sum + p.totalPrice, 0)
                
                return (
                  <Card key={supplier.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Truck className="h-5 w-5 text-primary" />
                          </div>
                          <span>{supplier.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingSupplier(supplier)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {supplier.phone}
                      </div>
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {supplier.address}
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between rounded-lg bg-muted p-2">
                        <span className="text-sm text-muted-foreground">Total Purchases</span>
                        <span className="font-semibold">${totalSpent.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddPurchaseOpen} onOpenChange={setIsAddPurchaseOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Record Purchase
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record New Purchase</DialogTitle>
                </DialogHeader>
                <PurchaseForm 
                  shopId={currentShop?.id || ''}
                  suppliers={suppliers}
                  products={products}
                  onSuccess={() => {
                    setIsAddPurchaseOpen(false)
                    loadData()
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No purchase records yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getSupplierName(purchase.supplierId)}</TableCell>
                        <TableCell>{getProductName(purchase.productId)}</TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell>${purchase.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">
                          ${purchase.totalPrice.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Supplier Dialog */}
      <Dialog open={!!editingSupplier} onOpenChange={() => setEditingSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          {editingSupplier && (
            <SupplierForm 
              shopId={currentShop?.id || ''}
              supplier={editingSupplier}
              onSuccess={() => {
                setEditingSupplier(null)
                loadData()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SupplierForm({ 
  shopId, 
  supplier, 
  onSuccess 
}: { 
  shopId: string
  supplier?: Supplier
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone) {
      toast.error('Please fill in required fields')
      return
    }

    if (supplier) {
      updateSupplier(supplier.id, formData)
      toast.success('Supplier updated')
    } else {
      createSupplier({ ...formData, shopId })
      toast.success('Supplier created')
    }
    
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Supplier name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Phone *</Label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="Phone number"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Email address"
        />
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Address"
        />
      </div>
      <Button type="submit" className="w-full">
        {supplier ? 'Update Supplier' : 'Add Supplier'}
      </Button>
    </form>
  )
}

function PurchaseForm({ 
  shopId, 
  suppliers, 
  products,
  onSuccess 
}: { 
  shopId: string
  suppliers: Supplier[]
  products: Product[]
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    supplierId: '',
    productId: '',
    quantity: 1,
    unitPrice: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.supplierId || !formData.productId) {
      toast.error('Please select supplier and product')
      return
    }

    createPurchaseRecord({
      ...formData,
      totalPrice: formData.quantity * formData.unitPrice,
      shopId,
    })
    
    toast.success('Purchase recorded')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Supplier *</Label>
        <Select 
          value={formData.supplierId} 
          onValueChange={(v) => setFormData({ ...formData, supplierId: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select supplier" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Product *</Label>
        <Select 
          value={formData.productId} 
          onValueChange={(v) => setFormData({ ...formData, productId: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Unit Price ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.unitPrice}
            onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div className="rounded-lg bg-muted p-3 text-center">
        <span className="text-sm text-muted-foreground">Total: </span>
        <span className="font-semibold">
          ${(formData.quantity * formData.unitPrice).toFixed(2)}
        </span>
      </div>
      <Button type="submit" className="w-full">
        Record Purchase
      </Button>
    </form>
  )
}
