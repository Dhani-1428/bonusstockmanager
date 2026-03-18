'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Smartphone, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getUserByEmail } from '@/lib/store'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setIsLoading(true)
    
    // Simulate checking if user exists
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const user = getUserByEmail(email)
    if (!user) {
      setIsLoading(false)
      toast.error('No account found with this email')
      return
    }

    setIsLoading(false)
    setIsSubmitted(true)
    toast.success('Password reset instructions sent!')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Smartphone className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">Bonus Stock Manager</span>
        </Link>

        {isSubmitted ? (
          <div className="mt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;ve sent password reset instructions to {email}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Note: In this demo, password reset is simulated. Your password remains unchanged.
            </p>
            <Link href="/login" className="mt-6 block">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h2 className="mt-8 text-center text-2xl font-bold tracking-tight">
              Forgot your password?
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you reset instructions.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send reset instructions'
                )}
              </Button>

              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
