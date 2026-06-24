<script setup lang="ts">
import { ArrowLeft, Menu, Save, Trash2 } from '@lucide/vue'
import type { Client } from '~/types/database.types'

const route  = useRoute()
const router = useRouter()
const { show: showToast } = useToast()
const { fetchOne, update, archive } = useClients()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const client = ref<Client | null>(null)
const loading = ref(true)
const saving  = ref(false)
const formError = ref('')

const form = reactive({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', notes: '' })

onMounted(async () => {
  const c = await fetchOne(route.params.id as string)
  client.value   = c
  form.name    = c.name
  form.email   = c.email   ?? ''
  form.phone   = c.phone   ?? ''
  form.address = c.address ?? ''
  form.city    = c.city    ?? ''
  form.state   = c.state   ?? ''
  form.zip     = c.zip     ?? ''
  form.notes   = c.notes   ?? ''
  loading.value = false
})

async function save() {
  if (!form.name.trim()) { formError.value = 'Name is required.'; return }
  formError.value = ''
  saving.value    = true
  try {
    await update(route.params.id as string, {
      name:    form.name.trim(),
      email:   form.email   || null,
      phone:   form.phone   || null,
      address: form.address || null,
      city:    form.city    || null,
      state:   form.state   || null,
      zip:     form.zip     || null,
      notes:   form.notes   || null,
    })
    showToast('Client updated!')
    router.push('/clients')
  } catch (e: any) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function destroy() {
  if (!confirm('Archive this client? They will be hidden from all views.')) return
  try {
    await archive(route.params.id as string)
    showToast('Client archived.')
    router.push('/clients')
  } catch (e: any) {
    showToast(e.message)
  }
}
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <button class="back-link" type="button" @click="router.push('/clients')"><ArrowLeft /> Clients</button>
        <h1>{{ client?.name ?? 'Client Details' }}</h1>
      </div>
    </div>
    <div class="header-actions">
      <button class="danger-action" type="button" @click="destroy"><Trash2 /> Archive</button>
    </div>
  </header>

  <section class="content">
    <SkeletonForm v-if="loading" :fields="8" />
    <div v-else class="form-card">
      <form class="form-grid" @submit.prevent="save">
        <div class="field field-full">
          <label>Full Name <span class="required">*</span></label>
          <input v-model="form.name" type="text" required />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="form.email" type="email" />
        </div>
        <div class="field">
          <label>Phone</label>
          <input v-model="form.phone" type="tel" />
        </div>
        <div class="field field-full">
          <label>Address</label>
          <input v-model="form.address" type="text" />
        </div>
        <div class="field">
          <label>City</label>
          <input v-model="form.city" type="text" />
        </div>
        <div class="field">
          <label>State</label>
          <input v-model="form.state" type="text" maxlength="2" />
        </div>
        <div class="field">
          <label>ZIP</label>
          <input v-model="form.zip" type="text" maxlength="10" />
        </div>
        <div class="field field-full">
          <label>Notes</label>
          <textarea v-model="form.notes" rows="3"></textarea>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="form-actions">
          <button type="button" class="outline-action" @click="router.push('/clients')">Cancel</button>
          <button type="submit" class="primary-action" :disabled="saving">
            <Save /> {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
