<script setup lang="ts">
import { ClipboardList, Menu, Plus, Search } from '@lucide/vue'

const router = useRouter()
const { invoices, loading, error, fetchAll, updateStatus } = useInvoices()
const { show: showToast } = useToast()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})
const search = ref('')
const filter = ref('all')

onMounted(() => fetchAll())

const filtered = computed(() => {
  let list = invoices.value
  if (filter.value !== 'all') list = list.filter(i => i.status === filter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(i =>
      i.invoice_number.toLowerCase().includes(q) ||
      i.clients?.name?.toLowerCase().includes(q),
    )
  }
  return list
})

const statusColors: Record<string, string> = {
  draft: 'pending', sent: 'confirmed', paid: 'completed', overdue: 'cancelled', cancelled: 'cancelled',
}

async function markPaid(id: string, e: Event) {
  e.stopPropagation()
  try {
    await updateStatus(id, 'paid', new Date().toISOString())
    await fetchAll()
    showToast('Invoice marked as paid.')
  } catch (err: any) {
    showToast(err.message)
  }
}
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <h1><ClipboardList style="display:inline;width:20px;height:20px;margin-right:6px;vertical-align:middle" />Invoices</h1>
        <p>Manage and track all invoices.</p>
      </div>
    </div>
    <div class="header-actions">
      <button class="primary-action" type="button" @click="router.push('/invoices/new')"><Plus /> New Invoice</button>
    </div>
  </header>

  <section class="content">
    <div class="toolbar">
      <div class="search-box">
        <Search class="search-icon" />
        <input v-model="search" type="search" placeholder="Search invoices…" />
      </div>
      <div class="filter-tabs">
        <button v-for="s in ['all','draft','sent','paid','overdue','cancelled']" :key="s"
          type="button" :class="{ active: filter === s }" @click="filter = s">
          {{ s.charAt(0).toUpperCase() + s.slice(1) }}
        </button>
      </div>
    </div>

    <SkeletonTable v-if="loading" :cols="6" />
    <div v-else-if="error"  class="error-state">{{ error }}</div>
    <div v-else-if="!filtered.length" class="empty-state">
      <ClipboardList style="width:48px;height:48px;opacity:.3;margin-bottom:12px" />
      <p>No invoices found.</p>
      <button class="primary-action" type="button" @click="router.push('/invoices/new')">Create Invoice</button>
    </div>
    <div v-else class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>#</th><th>Client</th><th>Total</th><th>Due</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="inv in filtered" :key="inv.id" class="clickable-row" @click="router.push(`/invoices/${inv.id}`)">
            <td><strong>{{ inv.invoice_number }}</strong></td>
            <td>{{ inv.clients?.name ?? '—' }}</td>
            <td><strong>${{ inv.total_amount.toFixed(2) }}</strong></td>
            <td>{{ inv.due_date ?? '—' }}</td>
            <td><span class="status" :class="statusColors[inv.status]">{{ inv.status }}</span></td>
            <td>
              <button v-if="inv.status !== 'paid'" class="row-action" type="button" @click.stop="markPaid(inv.id, $event)">Mark Paid</button>
              <button v-else class="row-action" type="button" @click.stop="router.push(`/invoices/${inv.id}`)">View</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
