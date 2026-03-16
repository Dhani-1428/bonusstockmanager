'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getUsers, createUser, getUserByEmail, getUserShops } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, Plus, Shield, UserCog, User as UserIcon, 
  Mail, Calendar, Check, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import type { UserRole, User } from '@/lib/types'

const roleInfo = {
  admin: {
    label: 'Admin',
    description: 'Full control of the system',
    icon: Shield,
    color: 'bg-primary text-primary-foreground',
  },
  manager: {
    label: 'Manager',
    description: 'Manage products, inventory, sales, and reports',
    icon: UserCog,
    color: 'bg-blue-500/10 text-blue-500',
  },
  staff: {
    label: 'Staff',
    description: 'Scan products, create sales, print receipts',
    icon: UserIcon,
    color: 'bg-green-500/10 text-green-500',
  },
}

// Generate a secure temporary password
function generateTemporaryPassword(): string {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

export default function UsersPage() {
  const { user, currentShop } = useAuth()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Array<{
    id: string
    name: string
    email: string
    role: UserRole
    joinedAt: string
    isCurrentUser: boolean
  }>>([])
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: 'staff' as UserRole,
  })

  useEffect(() => {
    loadTeamMembers()
  }, [user, currentShop])

  const loadTeamMembers = () => {
    if (!user || !currentShop) return

    // Get all users who have access to the current shop
    const allUsers = getUsers()
    const shopUsers = allUsers.filter(u => 
      u.shopIds.includes(currentShop.id) || u.id === user.id
    )

    const members = shopUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      joinedAt: u.createdAt,
      isCurrentUser: u.id === user.id,
    }))

    setTeamMembers(members)
  }

  const handleInvite = async () => {
    if (!inviteData.email) {
      toast.error('Please enter an email address')
      return
    }

    if (!inviteData.name.trim()) {
      toast.error('Please enter a name')
      return
    }

    if (!currentShop || !user) {
      toast.error('Shop or user information is missing')
      return
    }

    // Check if user already exists
    const existingUser = getUserByEmail(inviteData.email)
    if (existingUser) {
      toast.error('A user with this email already exists')
      return
    }

    setIsSending(true)

    try {
      // Generate temporary password
      const temporaryPassword = generateTemporaryPassword()

      // Create the user
      const newUser = createUser({
        email: inviteData.email.toLowerCase(),
        password: temporaryPassword, // In production, hash this password
        name: inviteData.name.trim(),
        role: inviteData.role,
        shopIds: [currentShop.id],
      })

      // Get login URL (in production, use your actual domain)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const invitationLink = `${baseUrl}/login`

      // Send invitation email
      const response = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteData.email,
          name: inviteData.name.trim(),
          role: inviteData.role,
          shopName: currentShop.name,
          invitationLink,
          temporaryPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // If email fails, delete the user we just created
        const users = getUsers()
        const updatedUsers = users.filter(u => u.id !== newUser.id)
        localStorage.setItem('pos_users', JSON.stringify(updatedUsers))
        
        throw new Error(result.error || 'Failed to send invitation email')
      }

      toast.success(`Invitation sent to ${inviteData.email}`)
      setInviteData({ name: '', email: '', role: 'staff' })
      setIsInviteOpen(false)
      loadTeamMembers()
    } catch (error: any) {
      console.error('Error sending invitation:', error)
      toast.error(error.message || 'Failed to send invitation. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage users and their permissions
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  type="text"
                  value={inviteData.name}
                  onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={inviteData.role} 
                  onValueChange={(v: UserRole) => setInviteData({ ...inviteData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {roleInfo[inviteData.role].description}
                </p>
              </div>
              <Button 
                onClick={handleInvite} 
                className="w-full"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                An email with login credentials will be sent to the user.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Roles Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(roleInfo) as UserRole[]).map((role) => {
          const info = roleInfo[role]
          const Icon = info.icon
          const count = teamMembers.filter(m => m.role === role).length
          
          return (
            <Card key={role}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${info.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">{info.label}s</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            People with access to {currentShop?.name || 'this shop'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => {
              const info = roleInfo[member.role]
              const Icon = info.icon
              
              return (
                <div 
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        {member.isCurrentUser && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge className={info.color}>
                        <Icon className="mr-1 h-3 w-3" />
                        {info.label}
                      </Badge>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            What each role can do in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 text-left font-medium">Permission</th>
                  <th className="py-3 text-center font-medium">Admin</th>
                  <th className="py-3 text-center font-medium">Manager</th>
                  <th className="py-3 text-center font-medium">Staff</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'View Dashboard', admin: true, manager: true, staff: true },
                  { name: 'Process Sales', admin: true, manager: true, staff: true },
                  { name: 'Print Receipts', admin: true, manager: true, staff: true },
                  { name: 'View Inventory', admin: true, manager: true, staff: true },
                  { name: 'Edit Inventory', admin: true, manager: true, staff: false },
                  { name: 'View Reports', admin: true, manager: true, staff: false },
                  { name: 'Manage Suppliers', admin: true, manager: true, staff: false },
                  { name: 'Manage Users', admin: true, manager: false, staff: false },
                  { name: 'Shop Settings', admin: true, manager: false, staff: false },
                  { name: 'Add/Remove Shops', admin: true, manager: false, staff: false },
                ].map((perm) => (
                  <tr key={perm.name} className="border-b border-border">
                    <td className="py-3">{perm.name}</td>
                    <td className="py-3 text-center">
                      {perm.admin && <Check className="mx-auto h-4 w-4 text-primary" />}
                    </td>
                    <td className="py-3 text-center">
                      {perm.manager && <Check className="mx-auto h-4 w-4 text-primary" />}
                    </td>
                    <td className="py-3 text-center">
                      {perm.staff && <Check className="mx-auto h-4 w-4 text-primary" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
