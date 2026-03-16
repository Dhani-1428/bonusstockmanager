'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { updateShop, getShopById } from '@/lib/store'
import type { Shop } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Store, Receipt, Printer, Bell, Shield, 
  Plus, Trash2, Save, Smartphone, User, Eye, EyeOff
} from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { currentShop, shops, addShop, refreshUser, user, updateAccount } = useAuth()
  const [shopSettings, setShopSettings] = useState<Partial<Shop>>({})
  const [receiptSettings, setReceiptSettings] = useState({
    paperSize: '80mm',
    showLogo: true,
    showTaxNumber: true,
    footerMessage: 'Thank you for your purchase!',
  })
  const [newShop, setNewShop] = useState({ name: '', address: '', phone: '' })
  const [isAddingShop, setIsAddingShop] = useState(false)
  
  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    if (currentShop) {
      setShopSettings({
        name: currentShop.name,
        address: currentShop.address,
        phone: currentShop.phone,
        taxNumber: currentShop.taxNumber || '',
        footerMessage: currentShop.footerMessage || '',
      })
    }
  }, [currentShop])

  useEffect(() => {
    if (user) {
      setAccountSettings(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
      }))
    }
  }, [user])

  const handleSaveShop = () => {
    if (!currentShop) return
    updateShop(currentShop.id, shopSettings)
    refreshUser()
    toast.success('Shop settings saved')
  }

  const handleAddShop = () => {
    if (!newShop.name) {
      toast.error('Please enter a shop name')
      return
    }
    addShop(newShop.name, newShop.address, newShop.phone)
    setNewShop({ name: '', address: '', phone: '' })
    setIsAddingShop(false)
    toast.success('Shop added successfully')
  }

  const handleSaveAccountInfo = () => {
    if (!accountSettings.name || !accountSettings.email) {
      toast.error('Name and email are required')
      return
    }
    const result = updateAccount({
      name: accountSettings.name,
      email: accountSettings.email,
    })
    if (result.success) {
      toast.success('Account information updated')
    } else {
      toast.error(result.error || 'Failed to update account')
    }
  }

  const handleChangePassword = () => {
    if (!user) return
    
    if (!accountSettings.currentPassword) {
      toast.error('Please enter your current password')
      return
    }
    if (accountSettings.currentPassword !== user.password) {
      toast.error('Current password is incorrect')
      return
    }
    if (!accountSettings.newPassword) {
      toast.error('Please enter a new password')
      return
    }
    if (accountSettings.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (accountSettings.newPassword !== accountSettings.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    const result = updateAccount({ password: accountSettings.newPassword })
    if (result.success) {
      toast.success('Password changed successfully')
      setAccountSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
    } else {
      toast.error(result.error || 'Failed to change password')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your shop settings, receipt configuration, and preferences
        </p>
      </div>

      <Tabs defaultValue="shop">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="shop" className="gap-2">
            <Store className="h-4 w-4 hidden sm:block" />
            Shop
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4 hidden sm:block" />
              Account
            </TabsTrigger>
          )}
          <TabsTrigger value="receipt" className="gap-2">
            <Receipt className="h-4 w-4 hidden sm:block" />
            Receipt
          </TabsTrigger>
          <TabsTrigger value="printers" className="gap-2">
            <Printer className="h-4 w-4 hidden sm:block" />
            Printers
          </TabsTrigger>
          <TabsTrigger value="shops" className="gap-2">
            <Store className="h-4 w-4 hidden sm:block" />
            All Shops
          </TabsTrigger>
        </TabsList>

        {/* Shop Settings */}
        <TabsContent value="shop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shop Information</CardTitle>
              <CardDescription>
                Update your shop details that appear on receipts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Shop Name</Label>
                  <Input
                    value={shopSettings.name || ''}
                    onChange={(e) => setShopSettings({ ...shopSettings, name: e.target.value })}
                    placeholder="My Mobile Shop"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={shopSettings.phone || ''}
                    onChange={(e) => setShopSettings({ ...shopSettings, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={shopSettings.address || ''}
                    onChange={(e) => setShopSettings({ ...shopSettings, address: e.target.value })}
                    placeholder="123 Main Street, City, Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax Number (Optional)</Label>
                  <Input
                    value={shopSettings.taxNumber || ''}
                    onChange={(e) => setShopSettings({ ...shopSettings, taxNumber: e.target.value })}
                    placeholder="TAX-123456789"
                  />
                </div>
              </div>
              <Button onClick={handleSaveShop} className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings - Admin Only */}
        {user?.role === 'admin' && (
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your personal account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={accountSettings.name}
                      onChange={(e) => setAccountSettings({ ...accountSettings, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={accountSettings.email}
                      onChange={(e) => setAccountSettings({ ...accountSettings, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveAccountInfo} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Account Info
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your account password for security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={accountSettings.currentPassword}
                        onChange={(e) => setAccountSettings({ ...accountSettings, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={accountSettings.newPassword}
                        onChange={(e) => setAccountSettings({ ...accountSettings, newPassword: e.target.value })}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={accountSettings.confirmPassword}
                      onChange={(e) => setAccountSettings({ ...accountSettings, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <Button onClick={handleChangePassword} className="gap-2">
                  <Shield className="h-4 w-4" />
                  Change Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="font-medium capitalize">{user?.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account ID:</span>
                    <span className="font-mono text-xs">{user?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shops:</span>
                    <span className="font-medium">{shops.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Receipt Settings */}
        <TabsContent value="receipt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Configuration</CardTitle>
              <CardDescription>
                Customize how your receipts look and what information they display
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Paper Size</Label>
                <Select 
                  value={receiptSettings.paperSize} 
                  onValueChange={(v) => setReceiptSettings({ ...receiptSettings, paperSize: v })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm (Small)</SelectItem>
                    <SelectItem value="80mm">80mm (Standard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Logo</p>
                    <p className="text-sm text-muted-foreground">
                      Display your shop logo on receipts
                    </p>
                  </div>
                  <Switch
                    checked={receiptSettings.showLogo}
                    onCheckedChange={(v) => setReceiptSettings({ ...receiptSettings, showLogo: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Tax Number</p>
                    <p className="text-sm text-muted-foreground">
                      Display tax registration number on receipts
                    </p>
                  </div>
                  <Switch
                    checked={receiptSettings.showTaxNumber}
                    onCheckedChange={(v) => setReceiptSettings({ ...receiptSettings, showTaxNumber: v })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Footer Message</Label>
                <Textarea
                  value={receiptSettings.footerMessage}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, footerMessage: e.target.value })}
                  placeholder="Thank you for shopping with us!"
                  rows={3}
                />
              </div>

              <Button onClick={() => toast.success('Receipt settings saved')} className="gap-2">
                <Save className="h-4 w-4" />
                Save Receipt Settings
              </Button>
            </CardContent>
          </Card>

          {/* Receipt Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mx-auto max-w-xs rounded-lg border border-dashed border-border bg-white p-4 text-black">
                <div className="text-center">
                  {receiptSettings.showLogo && (
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                      <Smartphone className="h-6 w-6" />
                    </div>
                  )}
                  <p className="font-bold">{shopSettings.name || 'Shop Name'}</p>
                  <p className="text-xs">{shopSettings.address || 'Shop Address'}</p>
                  <p className="text-xs">{shopSettings.phone || 'Phone Number'}</p>
                  {receiptSettings.showTaxNumber && shopSettings.taxNumber && (
                    <p className="text-xs">Tax: {shopSettings.taxNumber}</p>
                  )}
                </div>
                <div className="my-4 border-t border-dashed border-gray-300" />
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Receipt #:</span>
                    <span>RCP-20240101-ABC123</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="my-4 border-t border-dashed border-gray-300" />
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>iPhone 15 Pro x1</span>
                    <span>$999.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Case x1</span>
                    <span>$29.00</span>
                  </div>
                </div>
                <div className="my-4 border-t border-dashed border-gray-300" />
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>$1,028.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>$102.80</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>$1,130.80</span>
                  </div>
                </div>
                <div className="my-4 border-t border-dashed border-gray-300" />
                <p className="text-center text-xs text-gray-500">
                  {receiptSettings.footerMessage}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Printer Settings */}
        <TabsContent value="printers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Printer Configuration</CardTitle>
              <CardDescription>
                Set up and manage your receipt printers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Printer className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Browser Print</p>
                      <p className="text-sm text-muted-foreground">
                        Uses your browser&apos;s print dialog
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Test Print
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <Printer className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  To connect a thermal printer, please ensure it&apos;s set up as your system&apos;s default printer.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports USB, Bluetooth, and Network printers
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium">Supported Printers</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Thermal printers (58mm and 80mm)</li>
                  <li>USB connected printers</li>
                  <li>Bluetooth printers</li>
                  <li>Network/WiFi printers</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Shops */}
        <TabsContent value="shops" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Shops</CardTitle>
                <CardDescription>
                  Manage multiple shop locations
                </CardDescription>
              </div>
              <Button 
                onClick={() => setIsAddingShop(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Shop
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {shops.map((shop) => (
                <div 
                  key={shop.id}
                  className={`rounded-lg border p-4 ${
                    shop.id === currentShop?.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{shop.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {shop.address || 'No address set'}
                        </p>
                      </div>
                    </div>
                    {shop.id === currentShop?.id && (
                      <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                        Current
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Shop Form */}
              {isAddingShop && (
                <div className="rounded-lg border border-dashed border-primary p-4 space-y-4">
                  <h4 className="font-medium">Add New Shop</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Shop Name *</Label>
                      <Input
                        value={newShop.name}
                        onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                        placeholder="Branch Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={newShop.phone}
                        onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Address</Label>
                      <Input
                        value={newShop.address}
                        onChange={(e) => setNewShop({ ...newShop, address: e.target.value })}
                        placeholder="Shop address"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsAddingShop(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddShop}>
                      Add Shop
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
