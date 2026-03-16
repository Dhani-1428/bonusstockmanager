'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { 
  getUserSubscription, createUserSubscription, getSubscriptions,
  checkTrialStatus, getUserShops
} from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Zap, Store } from 'lucide-react'
import { toast } from 'sonner'
import type { Subscription, UserSubscription } from '@/lib/types'

const subscriptionPlans = [
  {
    billingCycle: 'monthly' as const,
    singleShop: { price: 20, name: '1 Month - Single Shop' },
    multipleShops: { price: 40, name: '1 Month - Multiple Shops' },
  },
  {
    billingCycle: '6months' as const,
    singleShop: { price: 150, name: '6 Months - Single Shop' },
    multipleShops: { price: 190, name: '6 Months - Multiple Shops' },
  },
  {
    billingCycle: 'yearly' as const,
    singleShop: { price: 210, name: '12 Months - Single Shop' },
    multipleShops: { price: 250, name: '12 Months - Multiple Shops' },
  },
]

export default function SubscriptionPage() {
  const { user } = useAuth()
  const [userSub, setUserSub] = useState<UserSubscription | null>(null)
  const [trialStatus, setTrialStatus] = useState<{ isTrial: boolean; daysRemaining: number }>({ isTrial: false, daysRemaining: 0 })
  const [userShops, setUserShops] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<{ billingCycle: 'monthly' | '6months' | 'yearly'; shopType: 'single' | 'multiple' } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (user) {
      const subscription = getUserSubscription(user.id)
      setUserSub(subscription)
      const trial = checkTrialStatus(user.id)
      setTrialStatus(trial)
      const shops = getUserShops(user.id)
      setUserShops(shops.length)
    }
  }, [user])

  const handleSubscribe = async (billingCycle: 'monthly' | '6months' | 'yearly', shopType: 'single' | 'multiple') => {
    if (!user) {
      toast.error('Please log in to subscribe')
      return
    }

    setIsProcessing(true)
    try {
      // Check if user already has an active subscription
      const existingSub = getUserSubscription(user.id)
      if (existingSub && (existingSub.status === 'active' || existingSub.status === 'trial')) {
        toast.error('You already have an active subscription')
        setIsProcessing(false)
        return
      }

      // Find or create subscription plan
      const subscriptions = getSubscriptions()
      let subscription = subscriptions.find(
        s => s.billingCycle === billingCycle && s.shopType === shopType
      )

      if (!subscription) {
        // Create subscription plan if it doesn't exist
        const plan = subscriptionPlans.find(p => p.billingCycle === billingCycle)
        if (!plan) {
          toast.error('Invalid subscription plan')
          setIsProcessing(false)
          return
        }

        const price = shopType === 'single' ? plan.singleShop.price : plan.multipleShops.price
        subscription = createSubscription({
          name: shopType === 'single' ? plan.singleShop.name : plan.multipleShops.name,
          price,
          billingCycle,
          shopType,
          features: [
            'Unlimited Products',
            'Barcode Scanning',
            'IMEI Tracking',
            'POS System',
            'Sales Reports',
            'Receipt Printing',
            shopType === 'multiple' ? 'Multiple Shop Locations' : 'Single Shop Location',
          ],
          maxShops: shopType === 'single' ? 1 : 999,
          maxProducts: 999999,
          maxUsers: 999,
          isActive: true,
        })
      }

      // If upgrading from trial, don't start new trial
      const isNewUser = !existingSub || existingSub.status === 'expired'
      const newSubscription = createUserSubscription(user.id, subscription.id, isNewUser && !isUpgradingFromTrial)

      setUserSub(newSubscription)
      const trial = checkTrialStatus(user.id)
      setTrialStatus(trial)

      if (isNewUser) {
        toast.success(`Free trial started! You have ${trial.daysRemaining} days remaining.`)
      } else {
        toast.success('Subscription activated successfully!')
      }
    } catch (error: any) {
      console.error('Subscription error:', error)
      toast.error(error.message || 'Failed to process subscription')
    } finally {
      setIsProcessing(false)
    }
  }

  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'monthly': return '1 Month'
      case '6months': return '6 Months'
      case 'yearly': return '12 Months'
      default: return cycle
    }
  }

  const getSavings = (cycle: 'monthly' | '6months' | 'yearly', shopType: 'single' | 'multiple') => {
    const monthly = shopType === 'single' ? 20 : 40
    if (cycle === '6months') {
      const total = shopType === 'single' ? 150 : 190
      const monthlyTotal = monthly * 6
      return monthlyTotal - total
    } else if (cycle === 'yearly') {
      const total = shopType === 'single' ? 210 : 250
      const monthlyTotal = monthly * 12
      return monthlyTotal - total
    }
    return 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
        <p className="text-muted-foreground">
          Choose the perfect plan for your business needs
        </p>
      </div>

      {/* Current Subscription Status */}
      {userSub && (
        <Card className={userSub.status === 'trial' ? 'border-primary bg-primary/5' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {userSub.status === 'trial' ? (
                <>
                  <Zap className="h-5 w-5 text-primary" />
                  Free Trial Active
                </>
              ) : (
                <>
                  <Crown className="h-5 w-5 text-primary" />
                  Active Subscription
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={userSub.status === 'trial' ? 'default' : 'default'}>
                  {userSub.status === 'trial' ? 'Trial' : 'Active'}
                </Badge>
              </div>
              {userSub.status === 'trial' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Remaining:</span>
                  <span className="font-bold text-primary">{trialStatus.daysRemaining} days</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date:</span>
                <span>{new Date(userSub.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <div className="space-y-8">
        {subscriptionPlans.map((plan) => {
          const savingsSingle = getSavings(plan.billingCycle, 'single')
          const savingsMultiple = getSavings(plan.billingCycle, 'multiple')
          
          return (
            <div key={plan.billingCycle} className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{getBillingCycleLabel(plan.billingCycle)}</h2>
                {savingsSingle > 0 && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    Save €{savingsSingle} (Single) / €{savingsMultiple} (Multiple)
                  </Badge>
                )}
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Single Shop Plan */}
                <Card className={`relative ${selectedPlan?.billingCycle === plan.billingCycle && selectedPlan?.shopType === 'single' ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Single Shop
                      </CardTitle>
                      {userShops === 1 && (
                        <Badge variant="outline">Current</Badge>
                      )}
                    </div>
                    <CardDescription>Perfect for single location businesses</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold">€{plan.singleShop.price}</div>
                      <div className="text-sm text-muted-foreground">
                        {plan.billingCycle === 'monthly' && '/month'}
                        {plan.billingCycle === '6months' && '/6 months'}
                        {plan.billingCycle === 'yearly' && '/year'}
                      </div>
                    </div>
                    
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>1 Shop Location</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Unlimited Products</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Full POS System</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Barcode Scanning</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>IMEI Tracking</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Sales Reports</span>
                      </li>
                    </ul>

                    <Button
                      className="w-full"
                      variant={selectedPlan?.billingCycle === plan.billingCycle && selectedPlan?.shopType === 'single' ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedPlan({ billingCycle: plan.billingCycle, shopType: 'single' })
                        handleSubscribe(plan.billingCycle, 'single')
                      }}
                      disabled={isProcessing || (userSub?.status === 'active' && userShops <= 1)}
                    >
                      {isProcessing && selectedPlan?.billingCycle === plan.billingCycle && selectedPlan?.shopType === 'single' 
                        ? 'Processing...' 
                        : userSub?.status === 'active' && userShops <= 1
                        ? 'Current Plan'
                        : 'Subscribe'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Multiple Shops Plan */}
                <Card className={`relative ${selectedPlan?.billingCycle === plan.billingCycle && selectedPlan?.shopType === 'multiple' ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Multiple Shops
                      </CardTitle>
                      {userShops > 1 && (
                        <Badge variant="outline">Current</Badge>
                      )}
                      <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                    </div>
                    <CardDescription>For businesses with multiple locations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold">€{plan.multipleShops.price}</div>
                      <div className="text-sm text-muted-foreground">
                        {plan.billingCycle === 'monthly' && '/month'}
                        {plan.billingCycle === '6months' && '/6 months'}
                        {plan.billingCycle === 'yearly' && '/year'}
                      </div>
                    </div>
                    
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Unlimited Shop Locations</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Unlimited Products</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Full POS System</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Barcode Scanning</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>IMEI Tracking</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Advanced Analytics</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Stock Transfers</span>
                      </li>
                    </ul>

                    <Button
                      className="w-full"
                      variant={selectedPlan?.billingCycle === plan.billingCycle && selectedPlan?.shopType === 'multiple' ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedPlan({ billingCycle: plan.billingCycle, shopType: 'multiple' })
                        handleSubscribe(plan.billingCycle, 'multiple')
                      }}
                      disabled={isProcessing || (userSub?.status === 'active' && userShops > 1)}
                    >
                      {isProcessing && selectedPlan?.billingCycle === plan.billingCycle && selectedPlan?.shopType === 'multiple' 
                        ? 'Processing...' 
                        : userSub?.status === 'active' && userShops > 1
                        ? 'Current Plan'
                        : 'Subscribe'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        })}
      </div>

      {/* Free Trial Info */}
      {(!userSub || userSub.status === 'expired') && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Start Your Free Trial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              All new users get a <strong>15-day free trial</strong> with full access to all features. 
              No credit card required. Choose any plan above to start your trial.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
