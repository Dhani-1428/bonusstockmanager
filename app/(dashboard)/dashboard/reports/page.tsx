'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { 
  getSales, getProducts, calculateProfit, getTopSellingProducts
} from '@/lib/store'
import type { Sale, Product } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  BarChart3, TrendingUp, DollarSign, ShoppingCart,
  Calendar, Download, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']

export default function ReportsPage() {
  const { currentShop } = useAuth()
  const [period, setPeriod] = useState('month')
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalSales: 0,
    avgOrderValue: 0,
  })
  const [salesByDay, setSalesByDay] = useState<{ date: string; revenue: number; profit: number }[]>([])
  const [topProducts, setTopProducts] = useState<{ name: string; value: number }[]>([])
  const [paymentMethods, setPaymentMethods] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    if (!currentShop) return

    const allSales = getSales(currentShop.id)
    const allProducts = getProducts(currentShop.id)
    
    // Filter by period
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const filteredSales = allSales.filter(s => new Date(s.createdAt) >= startDate)
    setSales(filteredSales)
    setProducts(allProducts)

    // Calculate stats
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0)
    const profit = calculateProfit(currentShop.id, startDate.toISOString(), now.toISOString())
    
    setStats({
      totalRevenue,
      totalProfit: profit,
      totalSales: filteredSales.length,
      avgOrderValue: filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0,
    })

    // Sales by day
    const salesMap = new Map<string, { revenue: number; profit: number }>()
    filteredSales.forEach(sale => {
      const date = sale.createdAt.slice(0, 10)
      const existing = salesMap.get(date) || { revenue: 0, profit: 0 }
      
      let saleProfit = 0
      sale.items.forEach(item => {
        const product = allProducts.find(p => p.id === item.productId)
        if (product) {
          saleProfit += (item.unitPrice - product.purchasePrice) * item.quantity
        }
      })
      
      salesMap.set(date, {
        revenue: existing.revenue + sale.total,
        profit: existing.profit + saleProfit,
      })
    })

    const sortedDays = Array.from(salesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14) // Last 14 days
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...data,
      }))
    
    setSalesByDay(sortedDays)

    // Top products
    const top = getTopSellingProducts(currentShop.id, 5)
    setTopProducts(top.map(p => ({ name: p.name, value: p.totalSold })))

    // Payment methods distribution
    const methodCounts = {
      cash: filteredSales.filter(s => s.paymentMethod === 'cash').length,
      card: filteredSales.filter(s => s.paymentMethod === 'card').length,
      mobile: filteredSales.filter(s => s.paymentMethod === 'mobile').length,
    }
    setPaymentMethods([
      { name: 'Cash', value: methodCounts.cash },
      { name: 'Card', value: methodCounts.card },
      { name: 'Mobile', value: methodCounts.mobile },
    ].filter(m => m.value > 0))

  }, [currentShop, period])

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: '+12.5%',
      positive: true,
    },
    {
      title: 'Total Profit',
      value: `$${stats.totalProfit.toLocaleString()}`,
      icon: TrendingUp,
      change: '+8.2%',
      positive: true,
    },
    {
      title: 'Total Sales',
      value: stats.totalSales.toString(),
      icon: ShoppingCart,
      change: '+5.4%',
      positive: true,
    },
    {
      title: 'Avg Order Value',
      value: `$${stats.avgOrderValue.toFixed(2)}`,
      icon: BarChart3,
      change: '-2.1%',
      positive: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analyze your sales and profit performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.positive ? 'text-green-500' : 'text-destructive'
                }`}>
                  {stat.positive ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue & Profit Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Profit Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesByDay}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString()}`, 
                      name === 'revenue' ? 'Revenue' : 'Profit'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="hsl(var(--chart-2))"
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" className="text-xs fill-muted-foreground" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      className="text-xs fill-muted-foreground"
                      width={100}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [value, 'Units Sold']}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No sales data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [value, 'Transactions']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No sales data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No sales in this period
                  </TableCell>
                </TableRow>
              ) : (
                sales.slice(0, 10).map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono">{sale.receiptNumber}</TableCell>
                    <TableCell>
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{sale.items.length} items</TableCell>
                    <TableCell className="capitalize">{sale.paymentMethod}</TableCell>
                    <TableCell>{sale.customerName || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${sale.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
