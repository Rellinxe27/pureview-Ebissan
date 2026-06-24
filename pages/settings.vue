<script setup lang="ts">
import { Menu, Save, Settings } from '@lucide/vue'

const { settings, loading, fetch, save } = useSettings()
const { show: showToast } = useToast()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const saving    = ref(false)
const formError = ref('')
const form      = reactive({
  business_name: '', owner_name: '', email: '', phone: '',
  address: '', city: '', state: '', zip: '',
  invoice_prefix: 'INV', next_invoice_number: 1001,
  quote_prefix: 'QUO', next_quote_number: 1001,
  tax_rate: 0, currency: 'USD', timezone: 'America/New_York',
})

onMounted(async () => {
  await fetch()
  if (settings.value) {
    Object.assign(form, {
      business_name:       settings.value.business_name,
      owner_name:          settings.value.owner_name         ?? '',
      email:               settings.value.email              ?? '',
      phone:               settings.value.phone              ?? '',
      address:             settings.value.address            ?? '',
      city:                settings.value.city               ?? '',
      state:               settings.value.state              ?? '',
      zip:                 settings.value.zip                ?? '',
      invoice_prefix:      settings.value.invoice_prefix,
      next_invoice_number: settings.value.next_invoice_number,
      quote_prefix:        settings.value.quote_prefix,
      next_quote_number:   settings.value.next_quote_number,
      tax_rate:            settings.value.tax_rate,
      currency:            settings.value.currency,
      timezone:            settings.value.timezone,
    })
  }
})

async function submit() {
  formError.value = ''
  saving.value    = true
  try {
    await save({
      business_name:       form.business_name,
      owner_name:          form.owner_name          || null,
      email:               form.email               || null,
      phone:               form.phone               || null,
      address:             form.address             || null,
      city:                form.city                || null,
      state:               form.state               || null,
      zip:                 form.zip                 || null,
      invoice_prefix:      form.invoice_prefix,
      next_invoice_number: form.next_invoice_number,
      quote_prefix:        form.quote_prefix,
      next_quote_number:   form.next_quote_number,
      tax_rate:            form.tax_rate,
      currency:            form.currency,
      timezone:            form.timezone,
    })
    showToast('Settings saved!')
  } catch (e: any) { formError.value = e.message } finally { saving.value = false }
}
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <h1><Settings style="display:inline;width:20px;height:20px;margin-right:6px;vertical-align:middle" />Settings</h1>
        <p>Configure your business details and preferences.</p>
      </div>
    </div>
    <div class="header-actions">
      <button class="primary-action" type="button" :disabled="saving" @click="submit">
        <Save /> {{ saving ? 'Saving…' : 'Save Settings' }}
      </button>
    </div>
  </header>

  <section class="content">
    <SkeletonForm v-if="loading" :fields="8" />
    <div v-else class="form-card">
      <form @submit.prevent="submit">
        <h3 class="section-heading">Business Information</h3>
        <div class="form-grid">
          <div class="field field-full">
            <label>Business Name</label>
            <input v-model="form.business_name" type="text" />
          </div>
          <div class="field">
            <label>Owner Name</label>
            <input v-model="form.owner_name" type="text" />
          </div>
          <div class="field">
            <label>Business Email</label>
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
            <input v-model="form.zip" type="text" />
          </div>
        </div>

        <h3 class="section-heading" style="margin-top:32px">Invoicing &amp; Quotes</h3>
        <div class="form-grid">
          <div class="field">
            <label>Invoice Prefix</label>
            <input v-model="form.invoice_prefix" type="text" maxlength="10" />
          </div>
          <div class="field">
            <label>Next Invoice #</label>
            <input v-model.number="form.next_invoice_number" type="number" min="1" />
          </div>
          <div class="field">
            <label>Quote Prefix</label>
            <input v-model="form.quote_prefix" type="text" maxlength="10" />
          </div>
          <div class="field">
            <label>Next Quote #</label>
            <input v-model.number="form.next_quote_number" type="number" min="1" />
          </div>
          <div class="field">
            <label>Default Tax Rate (%)</label>
            <input v-model.number="form.tax_rate" type="number" min="0" max="100" step="0.1" />
          </div>
          <div class="field">
            <label>Currency</label>
            <select v-model="form.currency">
              <option value="USD">USD — US Dollar</option>
              <option value="CAD">CAD — Canadian Dollar</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <div class="field">
            <label>Timezone</label>
            <select v-model="form.timezone">
              <option value="America/New_York">Eastern (ET)</option>
              <option value="America/Chicago">Central (CT)</option>
              <option value="America/Denver">Mountain (MT)</option>
              <option value="America/Los_Angeles">Pacific (PT)</option>
            </select>
          </div>
        </div>

        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="form-actions" style="margin-top:24px">
          <button type="submit" class="primary-action" :disabled="saving"><Save /> {{ saving ? 'Saving…' : 'Save Settings' }}</button>
        </div>
      </form>
    </div>
  </section>
</template>
