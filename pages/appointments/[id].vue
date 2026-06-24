<script setup lang="ts">
import { ArrowLeft, Menu, Save, Trash2 } from '@lucide/vue'
import type { AppointmentWithRefs } from '~/composables/useAppointments'

const route  = useRoute()
const router = useRouter()
const { show: showToast } = useToast()
const { fetchOne, update, remove } = useAppointments()
const { clients, fetchAll: fetchClients } = useClients()
const { services, fetchAll: fetchServices } = useServices()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const appt    = ref<AppointmentWithRefs | null>(null)
const loading = ref(true)
const saving  = ref(false)
const deleting = ref(false)
const formError = ref('')

const form = reactive({
  client_id:        '',
  service_id:       '',
  scheduled_at:     '',
  duration_minutes: 60,
  address:          '',
  price:            0,
  status:           'pending' as string,
  notes:            '',
})

onMounted(async () => {
  const [a] = await Promise.all([fetchOne(route.params.id as string), fetchClients(), fetchServices()])
  appt.value = a
  form.client_id        = a.client_id ?? ''
  form.service_id       = a.service_id ?? ''
  form.scheduled_at     = a.scheduled_at.slice(0, 16)
  form.duration_minutes = a.duration_minutes
  form.address          = a.address ?? ''
  form.price            = a.price
  form.status           = a.status
  form.notes            = a.notes ?? ''
  loading.value         = false
})

async function save() {
  formError.value = ''
  saving.value    = true
  try {
    await update(route.params.id as string, {
      client_id:        form.client_id   || null,
      service_id:       form.service_id  || null,
      scheduled_at:     new Date(form.scheduled_at).toISOString(),
      duration_minutes: form.duration_minutes,
      address:          form.address     || null,
      price:            form.price,
      status:           form.status as never,
      notes:            form.notes       || null,
    })
    showToast('Appointment updated!')
    router.push('/appointments')
  } catch (e: any) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function destroy() {
  if (!confirm('Delete this appointment?')) return
  deleting.value = true
  try {
    await remove(route.params.id as string)
    showToast('Appointment deleted.')
    router.push('/appointments')
  } catch (e: any) {
    showToast(e.message)
    deleting.value = false
  }
}
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <button class="back-link" type="button" @click="router.push('/appointments')"><ArrowLeft /> Appointments</button>
        <h1>Appointment Details</h1>
      </div>
    </div>
    <div class="header-actions">
      <button class="danger-action" type="button" :disabled="deleting" @click="destroy">
        <Trash2 /> {{ deleting ? 'Deleting…' : 'Delete' }}
      </button>
    </div>
  </header>

  <section class="content">
    <SkeletonForm v-if="loading" :fields="8" />
    <div v-else class="form-card">
      <form class="form-grid" @submit.prevent="save">
        <div class="field">
          <label>Client</label>
          <select v-model="form.client_id">
            <option value="">— None —</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="field">
          <label>Service</label>
          <select v-model="form.service_id">
            <option value="">— None —</option>
            <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="field">
          <label>Date &amp; Time</label>
          <input v-model="form.scheduled_at" type="datetime-local" />
        </div>
        <div class="field">
          <label>Duration (min)</label>
          <input v-model.number="form.duration_minutes" type="number" min="15" step="15" />
        </div>
        <div class="field field-full">
          <label>Address</label>
          <input v-model="form.address" type="text" />
        </div>
        <div class="field">
          <label>Price ($)</label>
          <input v-model.number="form.price" type="number" min="0" step="0.01" />
        </div>
        <div class="field">
          <label>Status</label>
          <select v-model="form.status">
            <option v-for="s in ['pending','confirmed','in_progress','completed','cancelled']" :key="s" :value="s">
              {{ s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()) }}
            </option>
          </select>
        </div>
        <div class="field field-full">
          <label>Notes</label>
          <textarea v-model="form.notes" rows="3"></textarea>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="form-actions">
          <button type="button" class="outline-action" @click="router.push('/appointments')">Cancel</button>
          <button type="submit" class="primary-action" :disabled="saving">
            <Save /> {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
