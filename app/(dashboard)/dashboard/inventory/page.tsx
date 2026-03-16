'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { 
  getProducts, getCategories, deleteProduct, 
  getAvailableIMEIs, createProduct, updateProduct 
} from '@/lib/store'
import type { Product, Category } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { 
  Plus, Search, MoreHorizontal, Pencil, Trash2, 
  Package, Barcode, Filter, ScanBarcode
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IMEIManager } from '@/components/dashboard/imei-manager'

export default function InventoryPage() {
  const { currentShop } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const loadData = () => {
    if (!currentShop) return
    setProducts(getProducts(currentShop.id))
    setCategories(getCategories(currentShop.id))
  }

  useEffect(() => {
    loadData()
  }, [currentShop])

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.includes(searchQuery) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, categoryFilter])

  const handleDelete = (id: string) => {
    deleteProduct(id)
    loadData()
    toast.success('Product deleted')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your products, stock levels, and IMEI numbers
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm 
              categories={categories}
              shopId={currentShop?.id || ''}
              onSuccess={() => {
                setIsAddDialogOpen(false)
                loadData()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
              <Barcode className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Stock</p>
              <p className="text-2xl font-bold">
                {products.reduce((sum, p) => sum + p.stockQuantity, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <Package className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold">
                {products.filter(p => p.stockQuantity <= p.lowStockThreshold).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, brand, barcode, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU / Barcode</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>IMEIs</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const availableImeis = getAvailableIMEIs(product.id)
                    const isLowStock = product.stockQuantity <= product.lowStockThreshold
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.brand}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-mono text-sm">{product.sku}</p>
                            <p className="font-mono text-xs text-muted-foreground">{product.barcode}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${isLowStock ? 'text-destructive' : ''}`}>
                            {product.stockQuantity}
                          </span>
                          {isLowStock && (
                            <span className="ml-2 text-xs text-destructive">(Low)</span>
                          )}
                        </TableCell>
                        <TableCell>${product.purchasePrice.toFixed(2)}</TableCell>
                        <TableCell>${product.sellingPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="gap-1"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <ScanBarcode className="h-4 w-4" />
                            {availableImeis.length}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(product.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm 
              categories={categories}
              shopId={currentShop?.id || ''}
              product={editingProduct}
              onSuccess={() => {
                setEditingProduct(null)
                loadData()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* IMEI Manager Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>IMEI Manager - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <IMEIManager 
              product={selectedProduct} 
              shopId={currentShop?.id || ''}
              onUpdate={loadData}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductForm({ 
  categories, 
  shopId, 
  product, 
  onSuccess 
}: { 
  categories: Category[]
  shopId: string
  product?: Product
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    categoryId: product?.categoryId || '',
    sku: product?.sku || '',
    stockQuantity: product?.stockQuantity || 0,
    purchasePrice: product?.purchasePrice || 0,
    sellingPrice: product?.sellingPrice || 0,
    lowStockThreshold: product?.lowStockThreshold || 5,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.brand || !formData.categoryId) {
      toast.error('Please fill in all required fields')
      return
    }

    if (product) {
      updateProduct(product.id, formData)
      toast.success('Product updated')
    } else {
      createProduct({
        ...formData,
        shopId,
      })
      toast.success('Product created')
    }
    
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="iPhone 15 Pro"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand">Brand *</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="Apple"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select 
            value={formData.categoryId} 
            onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="IP15PRO-256-BLK"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock Quantity</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stockQuantity}
            onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="threshold">Low Stock Threshold</Label>
          <Input
            id="threshold"
            type="number"
            min="0"
            value={formData.lowStockThreshold}
            onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchase">Purchase Price ($)</Label>
          <Input
            id="purchase"
            type="number"
            min="0"
            step="0.01"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="selling">Selling Price ($)</Label>
          <Input
            id="selling"
            type="number"
            min="0"
            step="0.01"
            value={formData.sellingPrice}
            onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="submit">
          {product ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  )
}
