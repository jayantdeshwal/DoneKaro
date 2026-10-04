import { useTranslation } from 'react-i18next'
import { Card, Badge, Button, Avatar } from '@kaamgar/ui'
import { Users, RefreshCw, Search, Eye, Trash2 } from 'lucide-react'
import type { AdminCustomerRow, ProfileToDelete } from '../../types'
import { displayMetric } from '../../constants'

interface AdminCustomersTabProps {
  customers: AdminCustomerRow[]
  filteredCustomers: AdminCustomerRow[]
  isLoadingCustomers: boolean
  customerSearch: string
  setCustomerSearch: (val: string) => void
  loadCustomersData: () => Promise<void>
  setInspectCustomer: (customer: AdminCustomerRow | null) => void
  setProfileToDelete: (profile: ProfileToDelete | null) => void
}

export function AdminCustomersTab({
  customers,
  filteredCustomers,
  isLoadingCustomers,
  customerSearch,
  setCustomerSearch,
  loadCustomersData,
  setInspectCustomer,
  setProfileToDelete,
}: AdminCustomersTabProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      {/* Dedicated Mobile Customers Header */}
      <div className="md:hidden p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {t('admin.allCustomers', 'Customers Directory')}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white">
              {customers.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
            Manage registered customers across Muzaffarnagar
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadCustomersData}
          disabled={isLoadingCustomers}
          className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingCustomers ? 'animate-spin text-amber-500' : ''}`} />
        </Button>
      </div>

      <Card className="p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200/90 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/80 dark:bg-zinc-850/60">
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase">
            All Registered Customers ({customers.length})
          </span>
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search customer by name or phone..."
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-1.5 text-xs placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100/90 dark:bg-zinc-800/90 border-b border-slate-200/90 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Total Bookings
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-semantic-border-light">
              {isLoadingCustomers ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-semantic-text-secondary">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-semantic-text-secondary">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-surface-200/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={customer.name} src={customer.avatar_url || undefined} size="sm" />
                        <p className="font-medium text-semantic-text-primary">{customer.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-semantic-text-primary">{customer.phone}</td>
                    <td className="px-6 py-4 text-sm text-semantic-text-primary">
                      <Badge variant="outline">{displayMetric(customer.total_bookings)} bookings</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-400 font-medium">
                      {displayMetric(customer.completed_bookings)}
                    </td>
                    <td className="px-6 py-4 text-sm text-semantic-text-secondary">
                      {new Date(customer.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectCustomer(customer)}
                          title="View Bookings"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setProfileToDelete({
                              id: customer.id,
                              name: customer.name,
                              phone: customer.phone,
                              role: 'customer',
                              statsHint: `${displayMetric(customer.total_bookings)} bookings (${displayMetric(customer.completed_bookings)} completed)`,
                            })
                          }
                          title="Permanently Delete Customer"
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
