'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  Smartphone, BarChart3, ScanBarcode, Receipt, 
  Shield, Users, ArrowRight, Check, Store, Zap,
  Package, TrendingUp
} from 'lucide-react'

const features = [
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track mobile phones, accessories, and spare parts with automatic barcode generation.',
  },
  {
    icon: ScanBarcode,
    title: 'Barcode Scanning',
    description: 'Support for USB, Bluetooth, and camera barcode scanners with instant product lookup.',
  },
  {
    icon: Smartphone,
    title: 'IMEI Tracking',
    description: 'Track individual phones by IMEI, prevent duplicates, and view complete sales history.',
  },
  {
    icon: Receipt,
    title: 'Receipt Printing',
    description: 'Print receipts on thermal printers (58mm/80mm) or send digital receipts via WhatsApp.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time insights on sales, profits, top products, and low stock alerts.',
  },
  {
    icon: Store,
    title: 'Multi-Shop Support',
    description: 'Manage multiple shop locations with separate inventories and stock transfers.',
  },
]

const freeTrial = {
  price: '€0',
  days: '15 days',
  label: 'Free Trial',
}

const pricingTiers = [
  {
    key: '1month',
    title: '1 Month',
    singlePrice: 20,
    singleSuffix: '/ month',
    multiPrice: 40,
    multiSuffix: '/ month',
    highlight: false,
  },
  {
    key: '6months',
    title: '6 Months',
    singlePrice: 150,
    singleSuffix: '/ 6 months',
    multiPrice: 190,
    multiSuffix: '/ 6 months',
    highlight: true,
  },
  {
    key: '12months',
    title: '12 Months',
    singlePrice: 210,
    singleSuffix: '/ 12 months',
    multiPrice: 250,
    multiSuffix: '/ 12 months',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Smartphone className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">MobileStock Pro</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span>Now with WhatsApp Digital Receipts</span>
            </div>
            
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
              Complete POS & Inventory for{' '}
              <span className="text-primary">Mobile Shops</span>
            </h1>
            
            <p className="mt-6 text-pretty text-lg text-muted-foreground sm:text-xl">
              Manage your mobile phone shop with barcode scanning, IMEI tracking, receipt printing, and powerful analytics. All in one modern platform.
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline">
                  See Features
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div 
            className="mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
                <div className="flex h-10 items-center gap-2 border-b border-border bg-muted/50 px-4">
                  <div className="h-3 w-3 rounded-full bg-destructive/60" />
                  <div className="h-3 w-3 rounded-full bg-warning/60" />
                  <div className="h-3 w-3 rounded-full bg-success/60" />
                </div>
                <div className="p-6">
                  <div className="grid gap-4 sm:grid-cols-4">
                    {[
                      { label: 'Total Products', value: '1,248', icon: Package },
                      { label: 'Today\'s Sales', value: '$3,842', icon: TrendingUp },
                      { label: 'Low Stock Items', value: '12', icon: Shield },
                      { label: 'Active Shops', value: '3', icon: Store },
                    ].map((stat, i) => (
                      <div key={i} className="rounded-lg border border-border bg-background/50 p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <stat.icon className="h-4 w-4" />
                          <span className="text-sm">{stat.label}</span>
                        </div>
                        <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to run your shop
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed specifically for mobile phone retailers
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="mt-16 space-y-8">
            {/* Free trial */}
            <motion.div
              className="relative overflow-hidden rounded-xl border border-border bg-card p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h3 className="text-lg font-semibold">{freeTrial.label}</h3>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{freeTrial.price}</span>
                    <span className="text-muted-foreground">{freeTrial.days}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try everything risk-free. Then choose your subscription duration.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    Includes barcode scanning, IMEI tracking, POS, inventory and reports.
                  </div>
                </div>
              </div>

              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  'Barcode scanning (camera + scanners)',
                  'Auto product lookup (barcode → details)',
                  'IMEI management',
                  'POS + receipt printing',
                  'Inventory tracking',
                  'Sales history + refunds',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link href="/signup" className="block">
                  <Button className="w-full md:w-auto">Start Free Trial</Button>
                </Link>
              </div>
            </motion.div>

            {/* Paid tiers */}
            <div className="grid gap-8 lg:grid-cols-3">
              {pricingTiers.map((tier, i) => (
                <motion.div
                  key={tier.key}
                  className={`relative overflow-hidden rounded-xl border ${
                    tier.highlight ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'
                  } bg-card p-8`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  viewport={{ once: true }}
                >
                  {tier.highlight && (
                    <div className="absolute top-0 right-0 rounded-bl-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-lg font-semibold">{tier.title}</h3>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <p className="text-sm text-muted-foreground">1 Shop</p>
                      <p className="mt-1 text-3xl font-bold">
                        €{tier.singlePrice}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          {tier.singleSuffix}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <p className="text-sm text-muted-foreground">More than 1 shop</p>
                      <p className="mt-1 text-3xl font-bold">
                        €{tier.multiPrice}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          {tier.multiSuffix}
                        </span>
                      </p>
                    </div>
                  </div>

                  <ul className="mt-7 space-y-3">
                    {[
                      'Unlimited products',
                      'Barcode scanning + lookup',
                      'IMEI tracking',
                      'POS + receipt printing',
                      'Sales reports',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link href="/signup" className="block">
                      <Button className="w-full" variant={tier.highlight ? 'default' : 'outline'}>
                        Choose {tier.title}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to transform your shop?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of mobile shop owners who trust MobileStock Pro for their daily operations.
            </p>
            <div className="mt-10">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start Your Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Smartphone className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">MobileStock Pro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 MobileStock Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
