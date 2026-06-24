<script setup lang="ts">
import { Menu, Plus, Receipt, Search } from '@lucide/vue'

const router = useRouter()
const { quotes, loading, error, fetchAll, updateStatus } = useQuotes()
const { show: showToast } = useToast()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})
const search = ref('')
const filter = ref('all')

onMounted(() => fetchAll())

const filtered = computed(() => {
  let list = quotes.value
  if (filter.value !== 'all') list = list.filter(q => q.status === filter.value)
  if (search.value.trim()) {
    const s = search.value.toLowerCase()
    list = list.filter(q => q.quote_number.toLowerCase().includes(s) || q.clients?.name?.toLowerCase().includes(s) || q.title.toLowerCase().includes(s))
  }
  return list
})

const statusColors: Record<string, string> = {
  draft: 'pending', sent: 'confirmed', accepted: 'completed', declined: 'cancelled', expired: 'cancelled',
}

async function changeStatus(id: string, status: 'accepted' | 'declined', e: Event) {
  e.stopPropagation()
  try {
    await updateStatus(id, status)
    await fetchAll()
    showToast(`Quote ${status}.`)
  } catch (err: any) { showToast(err.message) }
}
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <h1><Receipt style="display:inline;width:20px;height:20px;margin-right:6px;vertical-align:middle" />Quotes</h1>
        <p>Send proposals and track their status.</p>
      </div>
    </div>
    <div class="header-actions">
      <button class="primary-action" type="button" @click="router.push('/quotes/new')"><Plus /> New Quote</button>
    </div>
  </header>

  <section class="content">
    <div class="toolbar">
      <div class="search-box"><Search class="search-icon" /><input v-model="search" type="search" placeholder="Search quotes…" /></div>
      <div class="filter-tabs">
        <button v-for="s in ['all','draft','sent','accepted','declined','expired']" :key="s"
          type="button" :class="{ active: filter === s }" @click="filter = s">
          {{ s.charAt(0).toUpperCase() + s.slice(1) }}
        </button>
      </div>
    </div>

    <SkeletonTable v-if="loading" :cols="7" />
    <div v-else-if="error"  class="error-state">{{ error }}</div>
    <div v-else-if="!filtered.length" class="empty-state">
      <Receipt style="width:48px;height:48px;opacity:.3;margin-bottom:12px" />
      <p>No quotes found.</p>
      <button class="primary-action" type="button" @click="router.push('/quotes/new')">Create Quote</button>
    </div>
    <div v-else class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>#</th><th>Client</th><th>Title</th><th>Total</th><th>Valid Until</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="q in filtered" :key="q.id" class="clickable-row">
            <td>{{ q.quote_number }}</td>
            <td>{{ q.clients?.name ?? '—' }}</td>
            <td>{{ q.title }}</td>
            <td>${{ q.total_amount.toFixed(2) }}</td>
            <td>{{ q.valid_until ?? '—' }}</td>
            <td><span class="status" :class="statusColors[q.status]">{{ q.status }}</span></td>
            <td style="display:flex;gap:6px">
              <button v-if="q.status === 'sent'" class="row-action" type="button" @click.stop="changeStatus(q.id, 'accepted', $event)">Accept</button>
              <button v-if="q.status === 'sent'" class="row-action danger" type="button" @click.stop="changeStatus(q.id, 'declined', $event)">Decline</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
