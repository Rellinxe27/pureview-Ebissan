<script setup lang="ts">
import { CreditCard, Menu, Plus, Search } from '@lucide/vue'

const router = useRouter()
const { payments, loading, error, fetchAll, create } = usePayments()
const { clients, fetchAll: fetchClients } = useClients()
const { invoices, fetchAll: fetchInvoices } = useInvoices()
const { show: showToast } = useToast()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const search    = ref('')
const showForm  = ref(false)
const saving    = ref(false)
const formError = ref('')
const form      = reactive({
  client_id: '', invoice_id: '', amount: 0,
  payment_method: 'cash' as const, reference: '', notes: '', paid_at: '',
})

onMounted(() => Promise.all([fetchAll(), fetchClients(), fetchInvoices()]))

const filtered = computed(() => {
  if (!search.value.trim()) return payments.value
  const q = search.value.toLowerCase()
  return payments.value.filter(p =>
    p.clients?.name?.toLowerCase().includes(q) ||
    p.invoices?.invoice_number?.toLowerCase().includes(q),
  )
})

const totalReceived = computed(() => payments.value.reduce((s, p) => s + p.amount, 0))

async function submitPayment() {
  if (!form.amount || form.amount <= 0) { formError.value = 'Amount must be greater than 0.'; return }
  formError.value = ''
  saving.value    = true
  try {
    await create({
      client_id:      form.client_id  || null,
      invoice_id:     form.invoice_id || null,
      amount:         form.amount,
      payment_method: form.payment_method,
      reference:      form.reference  || null,
      notes:          form.notes      || null,
      paid_at:        form.paid_at ? new Date(form.paid_at).toISOString() : undefined,
    })
    showToast('Payment recorded!')
    showForm.value = false
    Object.assign(form, { client_id: '', invoice_id: '', amount: 0, payment_method: 'cash', reference: '', notes: '', paid_at: '' })
    await fetchAll()
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
        <h1><CreditCard style="display:inline;width:20px;height:20px;margin-right:6px;vertical-align:middle" />Payments</h1>
        <p>Total received: <strong>${{ totalReceived.toFixed(2) }}</strong></p>
      </div>
    </div>
    <div class="header-actions">
      <button class="primary-action" type="button" @click="showForm = !showForm"><Plus /> Record Payment</button>
    </div>
  </header>

  <section class="content">
    <!-- Quick record form -->
    <div v-if="showForm" class="form-card" style="margin-bottom:24px">
      <h3 style="margin-bottom:16px">Record New Payment</h3>
      <form class="form-grid" @submit.prevent="submitPayment">
        <div class="field">
          <label>Client</label>
          <select v-model="form.client_id">
            <option value="">— Select client —</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="field">
          <label>Invoice (optional)</label>
          <select v-model="form.invoice_id">
            <option value="">— None —</option>
            <option v-for="i in invoices" :key="i.id" :value="i.id">{{ i.invoice_number }} — {{ i.clients?.name }}</option>
          </select>
        </div>
        <div class="field">
          <label>Amount ($) <span class="required">*</span></label>
          <input v-model.number="form.amount" type="number" min="0.01" step="0.01" required />
        </div>
        <div class="field">
          <label>Method</label>
          <select v-model="form.payment_method">
            <option v-for="m in ['cash','card','bank_transfer','check','other']" :key="m" :value="m">
              {{ m.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()) }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>Reference</label>
          <input v-model="form.reference" type="text" placeholder="Check #, transaction ID…" />
        </div>
        <div class="field">
          <label>Date Paid</label>
          <input v-model="form.paid_at" type="datetime-local" />
        </div>
        <div class="field field-full">
          <label>Notes</label>
          <textarea v-model="form.notes" rows="2"></textarea>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="form-actions">
          <button type="button" class="outline-action" @click="showForm = false">Cancel</button>
          <button type="submit" class="primary-action" :disabled="saving">{{ saving ? 'Saving…' : 'Record Payment' }}</button>
        </div>
      </form>
    </div>

    <div class="toolbar">
      <div class="search-box"><Search class="search-icon" /><input v-model="search" type="search" placeholder="Search payments…" /></div>
    </div>

    <SkeletonTable v-if="loading" :cols="6" />
    <div v-else-if="!filtered.length" class="empty-state">
      <CreditCard style="width:48px;height:48px;opacity:.3;margin-bottom:12px" />
      <p>No payments recorded yet.</p>
    </div>
    <div v-else class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Date</th><th>Client</th><th>Invoice</th><th>Method</th><th>Amount</th><th>Reference</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.id">
            <td>{{ new Date(p.paid_at).toLocaleDateString() }}</td>
            <td>{{ p.clients?.name ?? '—' }}</td>
            <td>{{ p.invoices?.invoice_number ?? '—' }}</td>
            <td>{{ p.payment_method.replace('_', ' ') }}</td>
            <td><strong>${{ p.amount.toFixed(2) }}</strong></td>
            <td>{{ p.reference ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
