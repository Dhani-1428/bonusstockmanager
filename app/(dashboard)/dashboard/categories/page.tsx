'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getCategories, createCategory, deleteCategory } from '@/lib/store'
import type { Category } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, FolderTree, Smartphone, Headphones, Wrench } from 'lucide-react'
import { toast } from 'sonner'

const categoryIcons = {
  phone: Smartphone,
  accessory: Headphones,
  spare_part: Wrench,
}

const categoryLabels = {
  phone: 'Mobile Phones',
  accessory: 'Accessories',
  spare_part: 'Spare Parts',
}

export default function CategoriesPage() {
  const { currentShop } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', type: 'phone' as Category['type'] })

  const loadCategories = () => {
    if (!currentShop) return
    setCategories(getCategories(currentShop.id))
  }

  useEffect(() => {
    loadCategories()
  }, [currentShop])

  const handleCreate = () => {
    if (!newCategory.name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    createCategory({
      name: newCategory.name,
      type: newCategory.type,
      shopId: currentShop!.id,
    })

    setNewCategory({ name: '', type: 'phone' })
    setIsDialogOpen(false)
    loadCategories()
    toast.success('Category created')
  }

  const handleDelete = (id: string) => {
    deleteCategory(id)
    loadCategories()
    toast.success('Category deleted')
  }

  const groupedCategories = {
    phone: categories.filter(c => c.type === 'phone'),
    accessory: categories.filter(c => c.type === 'accessory'),
    spare_part: categories.filter(c => c.type === 'spare_part'),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your products into categories
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input
                  placeholder="e.g., Samsung Phones"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category Type</Label>
                <Select 
                  value={newCategory.type} 
                  onValueChange={(v: Category['type']) => setNewCategory({ ...newCategory, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Mobile Phones</SelectItem>
                    <SelectItem value="accessory">Accessories</SelectItem>
                    <SelectItem value="spare_part">Spare Parts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Groups */}
      <div className="grid gap-6 lg:grid-cols-3">
        {(Object.keys(groupedCategories) as Array<keyof typeof groupedCategories>).map((type) => {
          const Icon = categoryIcons[type]
          const cats = groupedCategories[type]
          
          return (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  {categoryLabels[type]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cats.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No categories yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cats.map((cat) => (
                      <div 
                        key={cat.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <FolderTree className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cat.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
