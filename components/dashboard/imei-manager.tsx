'use client'

import { useState, useEffect } from 'react'
import { 
  getIMEIByProduct, createIMEI, checkIMEIDuplicate, updateProduct 
} from '@/lib/store'
import type { Product, IMEIRecord } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface IMEIManagerProps {
  product: Product
  shopId: string
  onUpdate: () => void
}

export function IMEIManager({ product, shopId, onUpdate }: IMEIManagerProps) {
  const [imeis, setImeis] = useState<IMEIRecord[]>([])
  const [newImei, setNewImei] = useState('')
  const [bulkImeis, setBulkImeis] = useState('')
  const [showBulk, setShowBulk] = useState(false)

  const loadIMEIs = () => {
    setImeis(getIMEIByProduct(product.id))
  }

  useEffect(() => {
    loadIMEIs()
  }, [product.id])

  const handleAddSingle = () => {
    if (!newImei.trim()) {
      toast.error('Please enter an IMEI number')
      return
    }

    if (checkIMEIDuplicate(newImei.trim())) {
      toast.error('This IMEI already exists in the system')
      return
    }

    createIMEI({
      imei: newImei.trim(),
      productId: product.id,
      status: 'in_stock',
      shopId,
    })

    // Update product stock
    updateProduct(product.id, { stockQuantity: product.stockQuantity + 1 })

    setNewImei('')
    loadIMEIs()
    onUpdate()
    toast.success('IMEI added successfully')
  }

  const handleAddBulk = () => {
    const imeiList = bulkImeis
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    if (imeiList.length === 0) {
      toast.error('Please enter at least one IMEI')
      return
    }

    let added = 0
    let duplicates = 0

    imeiList.forEach(imei => {
      if (checkIMEIDuplicate(imei)) {
        duplicates++
        return
      }

      createIMEI({
        imei,
        productId: product.id,
        status: 'in_stock',
        shopId,
      })
      added++
    })

    // Update product stock
    updateProduct(product.id, { stockQuantity: product.stockQuantity + added })

    setBulkImeis('')
    setShowBulk(false)
    loadIMEIs()
    onUpdate()
    
    if (duplicates > 0) {
      toast.warning(`Added ${added} IMEIs. ${duplicates} duplicates skipped.`)
    } else {
      toast.success(`Added ${added} IMEIs successfully`)
    }
  }

  const inStockCount = imeis.filter(i => i.status === 'in_stock').length
  const soldCount = imeis.filter(i => i.status === 'sold').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{imeis.length}</p>
        </div>
        <div className="rounded-lg border border-primary/50 bg-primary/5 p-3 text-center">
          <p className="text-sm text-muted-foreground">In Stock</p>
          <p className="text-2xl font-bold text-primary">{inStockCount}</p>
        </div>
        <div className="rounded-lg border border-muted p-3 text-center">
          <p className="text-sm text-muted-foreground">Sold</p>
          <p className="text-2xl font-bold">{soldCount}</p>
        </div>
      </div>

      {/* Add IMEI */}
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label>Add Single IMEI</Label>
            <Input
              placeholder="Enter IMEI number"
              value={newImei}
              onChange={(e) => setNewImei(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSingle()}
            />
          </div>
          <Button onClick={handleAddSingle} className="gap-2">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowBulk(!showBulk)}
          >
            {showBulk ? 'Hide Bulk Add' : 'Bulk Add IMEIs'}
          </Button>
        </div>

        {showBulk && (
          <div className="space-y-2">
            <Label>Bulk Add (one IMEI per line)</Label>
            <textarea
              className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Enter IMEIs, one per line..."
              value={bulkImeis}
              onChange={(e) => setBulkImeis(e.target.value)}
            />
            <Button onClick={handleAddBulk} className="w-full">
              Add All IMEIs
            </Button>
          </div>
        )}
      </div>

      {/* IMEI List */}
      <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IMEI Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {imeis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No IMEI numbers added yet
                </TableCell>
              </TableRow>
            ) : (
              imeis.map((imei) => (
                <TableRow key={imei.id}>
                  <TableCell className="font-mono">{imei.imei}</TableCell>
                  <TableCell>
                    <Badge variant={imei.status === 'in_stock' ? 'default' : 'secondary'}>
                      {imei.status === 'in_stock' ? 'In Stock' : 'Sold'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(imei.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Warning */}
      {inStockCount !== product.stockQuantity && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
          <AlertCircle className="h-4 w-4 text-warning" />
          <span>
            Stock quantity ({product.stockQuantity}) doesn&apos;t match available IMEIs ({inStockCount}).
            Consider syncing the values.
          </span>
        </div>
      )}
    </div>
  )
}
