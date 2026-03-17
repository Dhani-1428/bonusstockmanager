'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Package,
  ScanBarcode,
  Smartphone,
  Receipt,
  BarChart3,
  Store,
  Users,
  Shield,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

const featureCards = [
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Add, edit, and track products with stock levels and low-stock alerts.',
  },
  {
    icon: ScanBarcode,
    title: 'Barcode Scanning (Mobile + Scanner)',
    description: 'Scan using your phone camera (mobile) or USB/Bluetooth scanners (keyboard input).',
  },
  {
    icon: Smartphone,
    title: 'IMEI Tracking',
    description: 'Track individual devices by IMEI and manage availability during sales.',
  },
  {
    icon: Receipt,
    title: 'POS + Receipts',
    description: 'Fast checkout, payment methods, and printable receipts.',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Sales history, performance insights, and operational reporting.',
  },
  {
    icon: Store,
    title: 'Shops & Multi-Location',
    description: 'Manage one or multiple shops with separate inventories.',
  },
]

const featureList = [
  { title: 'Point of Sale (POS)', icon: CheckCircle2 },
  { title: 'Inventory / Stock management', icon: CheckCircle2 },
  { title: 'Barcode scanning (camera + USB/Bluetooth scanners)', icon: CheckCircle2 },
  { title: 'Auto product lookup after scan (barcode → details)', icon: CheckCircle2 },
  { title: 'IMEI management for phones', icon: CheckCircle2 },
  { title: 'Sales history + refunds', icon: CheckCircle2 },
  { title: 'Receipt printing', icon: CheckCircle2 },
  { title: 'Customers', icon: CheckCircle2 },
  { title: 'Suppliers', icon: CheckCircle2 },
  { title: 'Categories', icon: CheckCircle2 },
  { title: 'Users & roles + email invitations', icon: CheckCircle2 },
  { title: 'Shops / locations', icon: CheckCircle2 },
  { title: 'Subscription plans + 15-day free trial', icon: CheckCircle2 },
  { title: 'Secure & reliable', icon: Shield },
  { title: 'Team ready', icon: Users },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>

      <main>
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="mx-auto max-w-3xl text-center"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
                All features — built for mobile shops
              </h1>
              <p className="mt-4 text-pretty text-lg text-muted-foreground">
                Everything you need to manage products, sell faster, and track devices with barcode & IMEI support.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/#pricing">
                  <Button size="lg" variant="outline">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </motion.div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-6"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  viewport={{ once: true }}
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-lg font-semibold">{f.title}</h2>
                  <p className="mt-2 text-muted-foreground">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Feature checklist
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Included in the platform (trial and paid plans).
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {featureList.map((item) => (
                    <li key={item.title} className="flex items-center gap-2 text-sm">
                      <item.icon className="h-4 w-4 text-primary" />
                      <span>{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

