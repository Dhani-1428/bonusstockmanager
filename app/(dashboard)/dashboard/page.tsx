'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { 
  getProducts, getLowStockProducts, getTodaySales, 
  getMonthSales, getTopSellingProducts, calculateProfit
} from '@/lib/store'
import type { Product, Sale } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, TrendingUp, AlertTriangle, DollarSign,
  ShoppingCart, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar
} from 'recharts'

export default function DashboardPage() {
  const { currentShop } = useAuth()
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    todaySalesCount: 0,
    todaySalesTotal: 0,
    monthlyRevenue: 0,
    monthlyProfit: 0,
  })
  const [topProducts, setTopProducts] = useState<{ productId: string; name: string; totalSold: number }[]>([])
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [salesData, setSalesData] = useState<{ date: string; sales: number }[]>([])

  useEffect(() => {
    if (!currentShop) return

    const products = getProducts(currentShop.id)
    const lowStock = getLowStockProducts(currentShop.id)
    const todaySales = getTodaySales(currentShop.id)
    const monthSales = getMonthSales(currentShop.id)
    const top = getTopSellingProducts(currentShop.id, 5)
    
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = now.toISOString()
    const profit = calculateProfit(currentShop.id, startOfMonth, endOfMonth)

    setStats({
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      todaySalesCount: todaySales.length,
      todaySalesTotal: todaySales.reduce((sum, s) => sum + s.total, 0),
      monthlyRevenue: monthSales.reduce((sum, s) => sum + s.total, 0),
      monthlyProfit: profit,
    })

    setTopProducts(top)
    setRecentSales(todaySales.slice(-5).reverse())
    setLowStockProducts(lowStock.slice(0, 5))

    // Generate sales data for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().slice(0, 10)
    })

    const salesByDay = last7Days.map(date => {
      const daySales = monthSales.filter(s => s.createdAt.slice(0, 10) === date)
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        sales: daySales.reduce((sum, s) => sum + s.total, 0),
      }
    })

    setSalesData(salesByDay)
  }, [currentShop])

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      change: '+12%',
      positive: true,
    },
    {
      title: 'Today\'s Sales',
      value: `$${stats.todaySalesTotal.toLocaleString()}`,
      subtitle: `${stats.todaySalesCount} transactions`,
      icon: ShoppingCart,
      change: '+8%',
      positive: true,
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      change: '+23%',
      positive: true,
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockCount.toString(),
      icon: AlertTriangle,
      change: stats.lowStockCount > 0 ? 'Action needed' : 'All good',
      positive: stats.lowStockCount === 0,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your shop overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <Card>
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
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sales Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorSales)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Selling Products
              </CardTitle>
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
                        dataKey="totalSold" 
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
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSales.length > 0 ? (
                <div className="space-y-4">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-medium">{sale.receiptNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.items.length} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${sale.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  No sales today
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length > 0 ? (
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.brand}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-destructive">{product.stockQuantity} left</p>
                        <p className="text-xs text-muted-foreground">
                          Threshold: {product.lowStockThreshold}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  All products are well stocked
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Monthly Profit Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      >
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Profit</p>
              <p className="text-3xl font-bold">${stats.monthlyProfit.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                Based on purchase and selling prices
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
