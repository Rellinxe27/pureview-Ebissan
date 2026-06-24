<script setup lang="ts">
import { ArrowLeft, Menu, Save } from '@lucide/vue'

const router = useRouter()
const { show: showToast } = useToast()
const { clients, fetchAll: fetchClients } = useClients()
const { services, fetchAll: fetchServices } = useServices()
const { create } = useAppointments()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const form = reactive({
  client_id:        '',
  service_id:       '',
  scheduled_at:     '',
  duration_minutes: 60,
  address:          '',
  price:            0,
  status:           'pending' as const,
  notes:            '',
})
const saving = ref(false)
const formError = ref('')

onMounted(() => Promise.all([fetchClients(), fetchServices()]))

async function submit() {
  if (!form.scheduled_at) { formError.value = 'Scheduled date & time is required.'; return }
  formError.value = ''
  saving.value    = true
  try {
    await create({
      client_id:        form.client_id   || null,
      service_id:       form.service_id  || null,
      scheduled_at:     new Date(form.scheduled_at).toISOString(),
      duration_minutes: form.duration_minutes,
      address:          form.address     || null,
      price:            form.price,
      status:           form.status,
      notes:            form.notes       || null,
    })
    showToast('Appointment booked!')
    router.push('/appointments')
  } catch (e: any) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <button class="back-link" type="button" @click="router.back()"><ArrowLeft /> Back</button>
        <h1>New Appointment</h1>
      </div>
    </div>
  </header>

  <section class="content">
    <div class="form-card">
      <form class="form-grid" @submit.prevent="submit">
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
          <label>Date &amp; Time <span class="required">*</span></label>
          <input v-model="form.scheduled_at" type="datetime-local" required />
        </div>
        <div class="field">
          <label>Duration (minutes)</label>
          <input v-model.number="form.duration_minutes" type="number" min="15" step="15" />
        </div>
        <div class="field field-full">
          <label>Service Address</label>
          <input v-model="form.address" type="text" placeholder="123 Main St, City, State" />
        </div>
        <div class="field">
          <label>Price ($)</label>
          <input v-model.number="form.price" type="number" min="0" step="0.01" />
        </div>
        <div class="field">
          <label>Status</label>
          <select v-model="form.status">
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
        <div class="field field-full">
          <label>Notes</label>
          <textarea v-model="form.notes" rows="3" placeholder="Special instructions…"></textarea>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="form-actions">
          <button type="button" class="outline-action" @click="router.back()">Cancel</button>
          <button type="submit" class="primary-action" :disabled="saving">
            <Save /> {{ saving ? 'Saving…' : 'Book Appointment' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
