'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ShieldCheck, Mail, KeyRound, ToggleRight, ToggleLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  listAdminUsers,
  createAdminUserWithPassword,
  inviteAdminUser,
  sendPasswordReset,
  updateAdminUser,
  deleteAdminUser,
} from '@/lib/actions/users'
import { getBranches } from '@/lib/actions/branches'
import type { AdminUser, AdminRole, Branch } from '@/lib/types/database.types'

type CreateMode = 'password' | 'invite'

interface EditState {
  profileId: string
  userId: string
  email: string
  role: AdminRole
  branchId: string | null
  isActive: boolean
}

export default function UsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createMode, setCreateMode] = useState<CreateMode>('password')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createConfirm, setCreateConfirm] = useState('')
  const [createRole, setCreateRole] = useState<AdminRole>('branch_admin')
  const [createBranchId, setCreateBranchId] = useState<string>('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [showCreateConfirm, setShowCreateConfirm] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [usersData, branchesData] = await Promise.all([listAdminUsers(), getBranches()])
      setUsers(usersData)
      setBranches(branchesData)
    } catch (err: any) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  // ---- Create ----
  function openCreate() {
    setCreateEmail('')
    setCreatePassword('')
    setCreateConfirm('')
    setCreateRole('branch_admin')
    setCreateBranchId('')
    setCreateError(null)
    setCreateMode('password')
    setShowCreatePassword(false)
    setShowCreateConfirm(false)
    setCreateOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)

    if (createMode === 'password') {
      if (createPassword !== createConfirm) {
        setCreateError('Passwords do not match')
        return
      }
      if (createPassword.length < 8) {
        setCreateError('Password must be at least 8 characters')
        return
      }
    }

    if (createRole === 'branch_admin' && !createBranchId) {
      setCreateError('A branch must be selected for Branch Admins')
      return
    }

    setCreateLoading(true)
    let result: { error: string | null }

    if (createMode === 'invite') {
      result = await inviteAdminUser(
        createEmail,
        createRole,
        createRole === 'branch_admin' ? createBranchId : null
      )
    } else {
      result = await createAdminUserWithPassword(
        createEmail,
        createPassword,
        createRole,
        createRole === 'branch_admin' ? createBranchId : null
      )
    }

    setCreateLoading(false)

    if (result.error) {
      setCreateError(result.error)
    } else {
      setCreateOpen(false)
      await loadData()
    }
  }

  // ---- Edit ----
  function openEdit(user: AdminUser) {
    setEditState({
      profileId: user.id,
      userId: user.user_id,
      email: user.email,
      role: user.role,
      branchId: user.branch_id,
      isActive: user.is_active,
    })
    setEditError(null)
    setEditOpen(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editState) return
    setEditError(null)

    if (editState.role === 'branch_admin' && !editState.branchId) {
      setEditError('A branch must be selected for Branch Admins')
      return
    }

    setEditLoading(true)
    const result = await updateAdminUser(editState.profileId, {
      role: editState.role,
      branchId: editState.role === 'branch_admin' ? editState.branchId : null,
    })
    setEditLoading(false)

    if (result.error) {
      setEditError(result.error)
    } else {
      setEditOpen(false)
      await loadData()
    }
  }

  // ---- Password Reset ----
  async function handlePasswordReset(email: string) {
    const result = await sendPasswordReset(email)
    if (result.error) {
      alert(`Failed to send reset email: ${result.error}`)
    } else {
      alert(`Password reset email sent to ${email}`)
    }
  }

  // ---- Toggle Active ----
  async function handleToggleActive(user: AdminUser) {
    const action = user.is_active ? 'deactivate' : 'activate'
    if (!confirm(`Are you sure you want to ${action} ${user.email}?`)) return

    const result = await updateAdminUser(user.id, { isActive: !user.is_active })
    if (result.error) {
      alert(result.error)
    } else {
      await loadData()
    }
  }

  // ---- Delete ----
  async function handleDelete(user: AdminUser) {
    if (!confirm(`Permanently delete ${user.email}? This cannot be undone.`)) return

    const result = await deleteAdminUser(user.user_id)
    if (result.error) {
      alert(result.error)
    } else {
      await loadData()
    }
  }

  if (loading) return <div>Loading users…</div>

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{users.length} admin user{users.length !== 1 ? 's' : ''}</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Admin User
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No admin users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                      {user.role === 'super_admin' ? 'Super Admin' : 'Branch Admin'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.branch_name ?? <span className="text-gray-400">All Branches</span>}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'outline'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(user)}
                        title="Edit role / branch"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePasswordReset(user.email)}
                        title="Send password reset email"
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(user)}
                        title={user.is_active ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.is_active ? (
                          <ToggleRight className="h-3 w-3 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-3 w-3 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(user)}
                        title="Delete user permanently"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ---- Create Dialog ---- */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>
              Create a new admin user with a temporary password or send them an invite email.
            </DialogDescription>
          </DialogHeader>

          {/* Mode toggle */}
          <div className="flex rounded-lg border overflow-hidden mb-2">
            <button
              type="button"
              onClick={() => setCreateMode('password')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                createMode === 'password' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5 inline mr-1.5" />
              Temp Password
            </button>
            <button
              type="button"
              onClick={() => setCreateMode('invite')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                createMode === 'invite' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Mail className="h-3.5 w-3.5 inline mr-1.5" />
              Send Invite Email
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">Email Address</Label>
              <Input
                id="create-email"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={createLoading}
              />
            </div>

            {createMode === 'password' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="create-password">Temporary Password</Label>
                  <div className="relative">
                    <Input
                      id="create-password"
                      type={showCreatePassword ? 'text' : 'password'}
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      disabled={createLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-confirm">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="create-confirm"
                      type={showCreateConfirm ? 'text' : 'password'}
                      value={createConfirm}
                      onChange={(e) => setCreateConfirm(e.target.value)}
                      placeholder="Repeat password"
                      required
                      disabled={createLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreateConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showCreateConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {createMode === 'invite' && (
              <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
                Supabase will send a sign-up link to this email. The user sets their own password when they follow the link.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={createRole}
                onValueChange={(v) => setCreateRole(v as AdminRole)}
                disabled={createLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="branch_admin">Branch Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {createRole === 'branch_admin' && (
              <div className="space-y-2">
                <Label htmlFor="create-branch">
                  Branch <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={createBranchId}
                  onValueChange={setCreateBranchId}
                  disabled={createLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {createError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{createError}</p>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={createLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading
                  ? 'Creating…'
                  : createMode === 'invite'
                  ? 'Send Invite'
                  : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---- Edit Dialog ---- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
            <DialogDescription>{editState?.email}</DialogDescription>
          </DialogHeader>
          {editState && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editState.role}
                  onValueChange={(v) => setEditState({ ...editState, role: v as AdminRole, branchId: null })}
                  disabled={editLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch_admin">Branch Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editState.role === 'branch_admin' && (
                <div className="space-y-2">
                  <Label>
                    Branch <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editState.branchId ?? ''}
                    onValueChange={(v) => setEditState({ ...editState, branchId: v })}
                    disabled={editLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editError && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{editError}</p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={editLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
