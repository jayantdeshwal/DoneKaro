import { Card, Badge, Button, Avatar } from '@kaamgar/ui'
import {
  Shield,
  RefreshCw,
  UserPlus,
  Phone,
  Calendar,
} from 'lucide-react'
import type { AdminTeamMember } from '../../types'

interface AdminTeamTabProps {
  adminTeam: AdminTeamMember[]
  isLoadingAdminTeam: boolean
  adminTeamError: string
  loadAdminTeamData: () => Promise<void>
  isSuperAdmin: boolean
  currentUser: { id?: string } | null
  setShowAddAdminModal: (show: boolean) => void
  setAddAdminError: (err: string) => void
  setAddAdminSuccess: (msg: string) => void
  handleDemoteAdmin: (member: AdminTeamMember) => Promise<void>
  isDemotingAdmin: boolean
}

export function AdminTeamTab({
  adminTeam,
  isLoadingAdminTeam,
  adminTeamError,
  loadAdminTeamData,
  isSuperAdmin,
  currentUser,
  setShowAddAdminModal,
  setAddAdminError,
  setAddAdminSuccess,
  handleDemoteAdmin,
  isDemotingAdmin,
}: AdminTeamTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Dedicated Mobile Administrators Header */}
      <div className="md:hidden p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Administrators
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
              {adminTeam.length} Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
            Manage administrator console privileges & security
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAdminTeamData}
          disabled={isLoadingAdminTeam}
          className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingAdminTeam ? 'animate-spin text-amber-500' : ''}`} />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Platform Administrator Directory
          </h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Only existing platform administrators can create and manage platform administrator privileges.
          </p>
        </div>
        {isSuperAdmin && (
          <Button
            variant="primary"
            onClick={() => {
              setAddAdminError('')
              setAddAdminSuccess('')
              setShowAddAdminModal(true)
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 self-start sm:self-auto shadow-md shadow-amber-500/20"
          >
            <UserPlus className="w-4 h-4" />
            Add Sub Administrator
          </Button>
        )}
      </div>

      {/* Security Notice Card */}
      <div className="p-4 bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-2xl flex items-start gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-500">
          <Shield className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
          <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
            Administrative Access Control & Security
          </span>
          Public signup for administrator accounts is completely closed. New administrator accounts can only be provisioned by an existing administrator through this portal. Every administrator must complete MSG91 two-factor SMS OTP verification upon signing in.
        </div>
      </div>

      {adminTeamError && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          {adminTeamError}
        </div>
      )}

      <Card className="p-6 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/90 dark:border-zinc-800">
          <h4 className="font-bold text-slate-900 dark:text-white">
            Active Administrators ({adminTeam.length})
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAdminTeamData}
            className="text-xs text-semantic-text-secondary hover:text-semantic-text-primary"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh List
          </Button>
        </div>

        {isLoadingAdminTeam ? (
          <div className="py-12 text-center text-semantic-text-secondary">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-brand-400 mb-3" />
            <p className="text-sm">Loading administrator team...</p>
          </div>
        ) : adminTeam.length === 0 ? (
          <div className="py-12 text-center text-semantic-text-secondary">
            <Shield className="w-8 h-8 mx-auto text-semantic-text-tertiary mb-2" />
            <p className="text-sm">No administrators found.</p>
          </div>
        ) : (
          <div className="divide-y divide-semantic-border-light/60">
            {adminTeam.map(admin => {
              const isCurrentUser = admin.id === currentUser?.id
              return (
                <div
                  key={admin.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      name={admin.full_name || 'Admin'}
                      src={admin.avatar_url || undefined}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-semantic-text-primary text-sm">
                          {admin.full_name || 'Unnamed Administrator'}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="primary" size="sm" className="text-[10px]">
                            You
                          </Badge>
                        )}
                        {admin.role === 'super_admin' ? (
                          <Badge variant="primary" size="sm" className="text-[10px] bg-purple-500/20 text-purple-400 border-purple-500/30">
                            Super Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" size="sm" className="text-[10px] border-amber-500/30 text-amber-400">
                            Sub Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-semantic-text-tertiary mt-0.5">
                        {admin.email || 'No email set'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-200/80 border border-semantic-border-light text-semantic-text-secondary">
                      <Phone className="w-3.5 h-3.5 text-brand-400" />
                      <span>+91 {admin.phone}</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" title="2FA Enabled" />
                    </div>

                    <div className="text-semantic-text-tertiary flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Joined {new Date(admin.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    {isSuperAdmin && !isCurrentUser && admin.role === 'sub_admin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDemoteAdmin(admin)}
                        disabled={isDemotingAdmin}
                        className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 h-auto"
                      >
                        Demote to Customer
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
