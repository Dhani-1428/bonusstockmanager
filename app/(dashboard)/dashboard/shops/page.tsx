"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserShops, createShop, updateShop } from "@/lib/store"
import { Shop } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Store, Plus, Edit, MapPin, Phone, Mail, Building2, Check } from "lucide-react"
import { toast } from "sonner"

export default function ShopsPage() {
  const { user, switchShop, shops, currentShop } = useAuth()
  const [localShops, setLocalShops] = useState<Shop[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    taxRate: 0,
    currency: "USD",
    receiptHeader: "",
    receiptFooter: "",
  })

  useEffect(() => {
    if (user) {
      const userShops = getUserShops(user.id)
      setLocalShops(userShops)
    }
  }, [user, shops])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (editingShop) {
      updateShop(editingShop.id, {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
      })
      toast.success("Shop updated successfully")
    } else {
      createShop({
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        ownerId: user.id,
      })
      toast.success("Shop added successfully")
    }

    if (user) {
      const userShops = getUserShops(user.id)
      setLocalShops(userShops)
    }
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      taxRate: 0,
      currency: "USD",
      receiptHeader: "",
      receiptFooter: "",
    })
    setEditingShop(null)
    setDialogOpen(false)
  }

  const openEditDialog = (shop: Shop) => {
    setFormData({
      name: shop.name,
      address: shop.address || "",
      phone: shop.phone || "",
      email: "",
      taxRate: 0,
      currency: "USD",
      receiptHeader: "",
      receiptFooter: "",
    })
    setEditingShop(shop)
    setDialogOpen(true)
  }

  const handleSwitchShop = (shopId: string) => {
    switchShop(shopId)
    toast.success("Switched to shop successfully")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shops</h1>
          <p className="text-muted-foreground">Manage your shop locations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Shop
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingShop ? "Edit Shop" : "Add New Shop"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Shop Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="USD"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptHeader">Receipt Header</Label>
                <Textarea
                  id="receiptHeader"
                  value={formData.receiptHeader}
                  onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                  rows={2}
                  placeholder="Custom text at the top of receipts"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptFooter">Receipt Footer</Label>
                <Textarea
                  id="receiptFooter"
                  value={formData.receiptFooter}
                  onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                  rows={2}
                  placeholder="Custom text at the bottom of receipts (e.g., Thank you!)"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingShop ? "Update" : "Add"} Shop
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {localShops.map((shop) => (
          <Card 
            key={shop.id}
            className={`relative transition-all ${
              currentShop?.id === shop.id 
                ? "ring-2 ring-primary bg-primary/5" 
                : "hover:shadow-md"
            }`}
          >
            {currentShop?.id === shop.id && (
              <Badge className="absolute top-4 right-4 bg-primary">
                <Check className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                {shop.name}
              </CardTitle>
              <CardDescription>
                Created {new Date(shop.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                {shop.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{shop.address}</span>
                  </div>
                )}
                {shop.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{shop.phone}</span>
                  </div>
                )}
                {shop.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{shop.email}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleSwitchShop(shop.id)}
                >
                  Switch to Shop
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openEditDialog(shop)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {localShops.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Store className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No shops yet</h3>
              <p className="text-muted-foreground mb-4">Create your first shop to get started</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Shop
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
