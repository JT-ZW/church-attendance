'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Eye, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getMembers, deleteMember } from '@/lib/actions/members'
import { getBranches } from '@/lib/actions/branches'
import type { Member, Branch } from '@/lib/types/database.types'
import { calculateAge, formatDate } from '@/lib/utils/helpers'
import { exportMembersPDF } from '@/lib/utils/pdf-export'
import MemberForm from '@/components/admin/MemberForm'
import { useAdminContext } from '@/components/admin/AdminProvider'

export default function MembersTable() {
  const { branchId, isBranchAdmin } = useAdminContext()
  const [members, setMembers] = useState<Member[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId ?? 'all')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)

  useEffect(() => {
    loadData()
  }, [branchId])

  useEffect(() => {
    filterMembers()
  }, [members, searchTerm, selectedBranch])

  async function loadData() {
    try {
      const [membersData, branchesData] = await Promise.all([
        getMembers(branchId ?? undefined),
        getBranches(),
      ])
      setMembers(membersData)
      setBranches(branchesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterMembers() {
    let filtered = members

    if (selectedBranch !== 'all') {
      filtered = filtered.filter((m) => m.branch_id === selectedBranch)
    }

    if (searchTerm) {
      filtered = filtered.filter((m) =>
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.phone_number ?? '').includes(searchTerm)
      )
    }

    setFilteredMembers(filtered)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this member?')) return

    const result = await deleteMember(id)
    if (!result.error) {
      await loadData()
    } else {
      alert(result.error)
    }
  }

  function handleEdit(member: Member) {
    setEditingMember(member)
    setDialogOpen(true)
  }

  function handleAdd() {
    setEditingMember(null)
    setDialogOpen(true)
  }

  function handleDialogClose(success: boolean) {
    setDialogOpen(false)
    setEditingMember(null)
    if (success) {
      loadData()
    }
  }

  function handlePDFExport() {
    const branchLabel = selectedBranch === 'all'
      ? 'All Branches'
      : branches.find(b => b.id === selectedBranch)?.name || 'Unknown'
    const filterLabel = searchTerm ? `${branchLabel} · Search: "${searchTerm}"` : branchLabel
    exportMembersPDF(filteredMembers, branches, filterLabel)
  }

  if (loading) {
    return <div>Loading members...</div>
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          {/* Branch filter — only visible to super admins */}
          {!isBranchAdmin && (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePDFExport}
            disabled={filteredMembers.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </DialogTitle>
              <DialogDescription>
                {editingMember
                  ? 'Update member information below'
                  : 'Fill in the member details below'}
              </DialogDescription>
            </DialogHeader>
            <MemberForm
              member={editingMember}
              branches={branches}
              onSuccess={() => handleDialogClose(true)}
              onCancel={() => handleDialogClose(false)}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Members</p>
          <p className="text-2xl font-bold">{filteredMembers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Male</p>
          <p className="text-2xl font-bold">
            {filteredMembers.filter((m) => m.gender === 'Male').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Female</p>
          <p className="text-2xl font-bold">
            {filteredMembers.filter((m) => m.gender === 'Female').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No members found
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.full_name}</TableCell>
                  <TableCell>{member.gender}</TableCell>
                  <TableCell>{calculateAge(member.date_of_birth)}</TableCell>
                  <TableCell>{member.phone_number}</TableCell>
                  <TableCell>
                    {branches.find((b) => b.id === member.branch_id)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.registration_source === 'admin'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {member.registration_source === 'admin' ? 'Admin' : 'Self'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(member.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/members/${member.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          title="View Details"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(member)}
                        title="Edit"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(member.id)}
                        title="Delete"
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
    </div>
  )
}
