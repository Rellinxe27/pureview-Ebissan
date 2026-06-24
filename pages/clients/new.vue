<script setup lang="ts">
import { ArrowLeft, Menu, Save } from '@lucide/vue'

const router = useRouter()
const { show: showToast } = useToast()
const { create } = useClients()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const form = reactive({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', notes: '' })
const saving = ref(false)
const formError = ref('')

async function submit() {
  if (!form.name.trim()) { formError.value = 'Name is required.'; return }
  formError.value = ''
  saving.value    = true
  try {
    await create({
      name:    form.name.trim(),
      email:   form.email   || null,
      phone:   form.phone   || null,
      address: form.address || null,
      city:    form.city    || null,
      state:   form.state   || null,
      zip:     form.zip     || null,
      notes:   form.notes   || null,
    })
    showToast('Client added!')
    router.push('/clients')
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
        <button class="back-link" type="button" @click="router.push('/clients')"><ArrowLeft /> Clients</button>
        <h1>New Client</h1>
      </div>
    </div>
  </header>

  <section class="content">
    <div class="form-card">
      <form class="form-grid" @submit.prevent="submit">
        <div class="field field-full">
          <label>Full Name <span class="required">*</span></label>
          <input v-model="form.name" type="text" placeholder="Jane Smith" required />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="form.email" type="email" placeholder="jane@example.com" />
        </div>
        <div class="field">
          <label>Phone</label>
          <input v-model="form.phone" type="tel" placeholder="(555) 000-0000" />
        </div>
        <div class="field field-full">
          <label>Address</label>
          <input v-model="form.address" type="text" placeholder="123 Main St" />
        </div>
        <div class="field">
          <label>City</label>
          <input v-model="form.city" type="text" />
        </div>
        <div class="field">
          <label>State</label>
          <input v-model="form.state" type="text" maxlength="2" placeholder="FL" />
        </div>
        <div class="field">
          <label>ZIP</label>
          <input v-model="form.zip" type="text" maxlength="10" />
        </div>
        <div class="field field-full">
          <label>Notes</label>
          <textarea v-model="form.notes" rows="3" placeholder="Anything to remember about this client…"></textarea>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="form-actions">
          <button type="button" class="outline-action" @click="router.push('/clients')">Cancel</button>
          <button type="submit" class="primary-action" :disabled="saving">
            <Save /> {{ saving ? 'Saving…' : 'Add Client' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
