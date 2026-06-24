<script setup lang="ts">
import { ArrowLeft, Menu, Minus, Plus, Save } from '@lucide/vue'

const router = useRouter()
const { show: showToast } = useToast()
const { clients, fetchAll: fetchClients } = useClients()
const { create, nextNumber } = useQuotes()
const { settings, fetch: fetchSettings } = useSettings()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

interface LineItem { description: string; quantity: number; unit_price: number }

const form = reactive({
  client_id:    '',
  quote_number: '',
  title:        '',
  status:       'draft' as const,
  valid_until:  '',
  tax_rate:     0,
  notes:        '',
})
const items     = ref<LineItem[]>([{ description: '', quantity: 1, unit_price: 0 }])
const saving    = ref(false)
const formError = ref('')

onMounted(async () => {
  await Promise.all([fetchClients(), fetchSettings()])
  form.quote_number = await nextNumber()
  form.tax_rate     = settings.value?.tax_rate ?? 0
})

const subtotal  = computed(() => items.value.reduce((s, i) => s + i.quantity * i.unit_price, 0))
const taxAmount = computed(() => subtotal.value * (form.tax_rate / 100))
const total     = computed(() => subtotal.value + taxAmount.value)

function addItem()         { items.value.push({ description: '', quantity: 1, unit_price: 0 }) }
function removeItem(i: number) { if (items.value.length > 1) items.value.splice(i, 1) }

async function submit() {
  if (!form.client_id) { formError.value = 'Please select a client.'; return }
  if (!form.title.trim())    { formError.value = 'Title is required.';       return }
  formError.value = ''
  saving.value    = true
  try {
    const q = await create(
      {
        client_id:    form.client_id || null,
        quote_number: form.quote_number,
        title:        form.title.trim(),
        status:       form.status,
        valid_until:  form.valid_until || null,
        tax_rate:     form.tax_rate,
        tax_amount:   taxAmount.value,
        subtotal:     subtotal.value,
        total_amount: total.value,
        notes:        form.notes || null,
      },
      items.value.map(i => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price })),
    )
    showToast('Quote created!')
    router.push('/quotes')
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
        <button class="back-link" type="button" @click="router.push('/quotes')"><ArrowLeft /> Quotes</button>
        <h1>New Quote</h1>
      </div>
    </div>
  </header>

  <section class="content">
    <div class="form-card invoice-form">
      <form @submit.prevent="submit">
        <div class="form-grid">
          <div class="field">
            <label>Client <span class="required">*</span></label>
            <select v-model="form.client_id" required>
              <option value="">— Select client —</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="field">
            <label>Quote #</label>
            <input v-model="form.quote_number" type="text" />
          </div>
          <div class="field field-full">
            <label>Title / Description <span class="required">*</span></label>
            <input v-model="form.title" type="text" placeholder="Window cleaning + screen repair for 2-story home" required />
          </div>
          <div class="field">
            <label>Valid Until</label>
            <input v-model="form.valid_until" type="date" />
          </div>
          <div class="field">
            <label>Status</label>
            <select v-model="form.status">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
            </select>
          </div>
        </div>

        <div class="line-items">
          <h3>Line Items</h3>
          <div class="line-item-head">
            <span>Description</span><span>Qty</span><span>Price</span><span>Total</span><span></span>
          </div>
          <div v-for="(item, i) in items" :key="i" class="line-item-row">
            <input v-model="item.description" type="text" placeholder="Service…" />
            <input v-model.number="item.quantity"   type="number" min="1" />
            <input v-model.number="item.unit_price" type="number" min="0" step="0.01" />
            <span>${{ (item.quantity * item.unit_price).toFixed(2) }}</span>
            <button type="button" class="icon-btn" :disabled="items.length === 1" @click="removeItem(i)"><Minus /></button>
          </div>
          <button type="button" class="outline-action small" @click="addItem"><Plus /> Add Line</button>
        </div>

        <div class="invoice-totals">
          <div><span>Subtotal</span><strong>${{ subtotal.toFixed(2) }}</strong></div>
          <div>
            <span>Tax <input v-model.number="form.tax_rate" type="number" min="0" max="100" step="0.1" class="tax-input" />%</span>
            <strong>${{ taxAmount.toFixed(2) }}</strong>
          </div>
          <div class="total-row"><span>Total</span><strong>${{ total.toFixed(2) }}</strong></div>
        </div>

        <div class="field" style="margin-top:16px">
          <label>Notes</label>
          <textarea v-model="form.notes" rows="2"></textarea>
        </div>

        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="form-actions">
          <button type="button" class="outline-action" @click="router.push('/quotes')">Cancel</button>
          <button type="submit" class="primary-action" :disabled="saving">
            <Save /> {{ saving ? 'Saving…' : 'Create Quote' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
