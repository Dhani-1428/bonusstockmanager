'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Smartphone, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    const result = await login(email, password)
    setIsLoading(false)

    if (result.success) {
      toast.success('Welcome back!')
      router.push('/dashboard')
    } else {
      toast.error(result.error || 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Smartphone className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">Bonus Stock Manager</span>
            </Link>

            <h2 className="mt-8 text-2xl font-bold tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="relative hidden flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-lg text-center">
            <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Smartphone className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Manage your shop with ease</h3>
            <p className="mt-4 text-muted-foreground">
              Track inventory, process sales, and analyze your business performance all in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
