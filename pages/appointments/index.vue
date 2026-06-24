<script setup lang="ts">
import { CalendarCheck, Filter, Menu, Plus, Search } from '@lucide/vue'

const router = useRouter()
const { appointments, loading, error, fetchAll } = useAppointments()
const { show: showToast } = useToast()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const search  = ref('')
const filter  = ref<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')

onMounted(() => fetchAll())

const filtered = computed(() => {
  let list = appointments.value
  if (filter.value !== 'all') list = list.filter(a => a.status === filter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(a =>
      a.clients?.name?.toLowerCase().includes(q) ||
      a.services?.name?.toLowerCase().includes(q) ||
      a.address?.toLowerCase().includes(q),
    )
  }
  return list
})

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
const statusColors: Record<string, string> = {
  pending: 'pending', confirmed: 'confirmed', in_progress: 'pill orange', completed: 'completed', cancelled: 'cancelled',
}
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" aria-label="Toggle menu" @click="toggleSidebar()"><Menu /></button>
      <div>
        <h1><CalendarCheck style="display:inline;width:22px;height:22px;margin-right:6px;vertical-align:middle" />Appointments</h1>
        <p>Manage all your service appointments.</p>
      </div>
    </div>
    <div class="header-actions">
      <button class="primary-action" type="button" @click="router.push('/appointments/new')">
        <Plus /> New Appointment
      </button>
    </div>
  </header>

  <section class="content">
    <div class="toolbar">
      <div class="search-box">
        <Search class="search-icon" />
        <input v-model="search" type="search" placeholder="Search appointments…" aria-label="Search appointments" />
      </div>
      <div class="filter-tabs">
        <button v-for="s in ['all','pending','confirmed','in_progress','completed','cancelled']" :key="s"
          type="button" :class="{ active: filter === s }" @click="filter = s as typeof filter">
          {{ s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1) }}
        </button>
      </div>
    </div>

    <SkeletonTable v-if="loading" :cols="7" />
    <div v-else-if="error"  class="error-state">{{ error }}</div>
    <div v-else-if="!filtered.length" class="empty-state">
      <CalendarCheck style="width:48px;height:48px;opacity:.3;margin-bottom:12px" />
      <p>No appointments found.</p>
      <button class="primary-action" type="button" @click="router.push('/appointments/new')">Book First Appointment</button>
    </div>
    <div v-else class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Date &amp; Time</th><th>Client</th><th>Service</th><th>Address</th><th>Price</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="a in filtered" :key="a.id" class="clickable-row" @click="router.push(`/appointments/${a.id}`)">
            <td>{{ fmt(a.scheduled_at) }}</td>
            <td>{{ a.clients?.name ?? '—' }}</td>
            <td>{{ a.services?.name ?? '—' }}</td>
            <td>{{ a.address ?? '—' }}</td>
            <td>${{ a.price.toFixed(2) }}</td>
            <td><span class="status" :class="statusColors[a.status]">{{ a.status.replace('_', ' ') }}</span></td>
            <td><button class="row-action" type="button" @click.stop="router.push(`/appointments/${a.id}`)">View</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
