<script setup lang="ts">
import { Menu, Plus, RefreshCcw, Search, Trash2 } from '@lucide/vue'

const { recurring, loading, error, fetchAll, create, remove } = useRecurring()
const { clients, fetchAll: fetchClients } = useClients()
const { services, fetchAll: fetchServices } = useServices()
const { show: showToast } = useToast()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const search   = ref('')
const showForm = ref(false)
const saving   = ref(false)
const formError = ref('')
const form = reactive({
  client_id: '', service_id: '', frequency: 'monthly' as const,
  next_scheduled_at: '', price: 0, notes: '',
})

onMounted(() => Promise.all([fetchAll(), fetchClients(), fetchServices()]))

const filtered = computed(() => {
  if (!search.value.trim()) return recurring.value
  const q = search.value.toLowerCase()
  return recurring.value.filter(r => r.clients?.name?.toLowerCase().includes(q) || r.services?.name?.toLowerCase().includes(q))
})

async function submitForm() {
  formError.value = ''
  saving.value    = true
  try {
    await create({
      client_id:        form.client_id  || null,
      service_id:       form.service_id || null,
      frequency:        form.frequency,
      next_scheduled_at:form.next_scheduled_at || null,
      price:            form.price,
      notes:            form.notes || null,
    })
    showToast('Recurring service added!')
    showForm.value = false
    Object.assign(form, { client_id: '', service_id: '', frequency: 'monthly', next_scheduled_at: '', price: 0, notes: '' })
    await fetchAll()
  } catch (e: any) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function del(id: string) {
  if (!confirm('Remove this recurring service?')) return
  try { await remove(id); await fetchAll(); showToast('Removed.') } catch (e: any) { showToast(e.message) }
}
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <h1><RefreshCcw style="display:inline;width:20px;height:20px;margin-right:6px;vertical-align:middle" />Recurring Services</h1>
        <p>Manage repeating service agreements.</p>
      </div>
    </div>
    <div class="header-actions">
      <button class="primary-action" type="button" @click="showForm = !showForm"><Plus /> Add Recurring</button>
    </div>
  </header>

  <section class="content">
    <div v-if="showForm" class="form-card" style="margin-bottom:24px">
      <h3 style="margin-bottom:16px">New Recurring Service</h3>
      <form class="form-grid" @submit.prevent="submitForm">
        <div class="field">
          <label>Client</label>
          <select v-model="form.client_id">
            <option value="">— Select client —</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="field">
          <label>Service</label>
          <select v-model="form.service_id">
            <option value="">— Select service —</option>
            <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="field">
          <label>Frequency</label>
          <select v-model="form.frequency">
            <option v-for="f in ['weekly','biweekly','monthly','quarterly','yearly']" :key="f" :value="f">
              {{ f.charAt(0).toUpperCase() + f.slice(1) }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>Next Scheduled</label>
          <input v-model="form.next_scheduled_at" type="date" />
        </div>
        <div class="field">
          <label>Price ($)</label>
          <input v-model.number="form.price" type="number" min="0" step="0.01" />
        </div>
        <div class="field field-full">
          <label>Notes</label>
          <textarea v-model="form.notes" rows="2"></textarea>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="form-actions">
          <button type="button" class="outline-action" @click="showForm = false">Cancel</button>
          <button type="submit" class="primary-action" :disabled="saving">{{ saving ? 'Saving…' : 'Add Service' }}</button>
        </div>
      </form>
    </div>

    <div class="toolbar">
      <div class="search-box"><Search class="search-icon" /><input v-model="search" type="search" placeholder="Search recurring services…" /></div>
    </div>

    <SkeletonTable v-if="loading" :cols="6" />
    <div v-else-if="!filtered.length" class="empty-state">
      <RefreshCcw style="width:48px;height:48px;opacity:.3;margin-bottom:12px" />
      <p>No recurring services yet.</p>
    </div>
    <div v-else class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Client</th><th>Service</th><th>Frequency</th><th>Next Date</th><th>Price</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id">
            <td>{{ r.clients?.name ?? '—' }}</td>
            <td><span class="pill" :style="{ background: r.services?.color }">{{ r.services?.name ?? '—' }}</span></td>
            <td>{{ r.frequency }}</td>
            <td>{{ r.next_scheduled_at ?? '—' }}</td>
            <td>${{ r.price.toFixed(2) }}</td>
            <td><button class="icon-btn" type="button" @click="del(r.id)"><Trash2 style="width:16px;height:16px" /></button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
