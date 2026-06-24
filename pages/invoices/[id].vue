<script setup lang="ts">
import { ArrowLeft, Download, Menu, Send, Trash2 } from '@lucide/vue'

const route  = useRoute()
const router = useRouter()
const { show: showToast } = useToast()
const { fetchOne, updateStatus, remove } = useInvoices()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const inv     = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  inv.value = await fetchOne(route.params.id as string)
  loading.value = false
})

async function markPaid() {
  try {
    await updateStatus(route.params.id as string, 'paid', new Date().toISOString())
    inv.value.status  = 'paid'
    inv.value.paid_at = new Date().toISOString()
    showToast('Invoice marked as paid.')
  } catch (e: any) { showToast(e.message) }
}

async function markSent() {
  try {
    await updateStatus(route.params.id as string, 'sent')
    inv.value.status = 'sent'
    showToast('Invoice marked as sent.')
  } catch (e: any) { showToast(e.message) }
}

async function destroy() {
  if (!confirm('Delete this invoice?')) return
  try {
    await remove(route.params.id as string)
    showToast('Invoice deleted.')
    router.push('/invoices')
  } catch (e: any) { showToast(e.message) }
}

const statusColors: Record<string, string> = {
  draft: 'pending', sent: 'confirmed', paid: 'completed', overdue: 'cancelled', cancelled: 'cancelled',
}
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <button class="back-link" type="button" @click="router.push('/invoices')"><ArrowLeft /> Invoices</button>
        <h1>Invoice {{ inv?.invoice_number }}</h1>
      </div>
    </div>
    <div class="header-actions">
      <button v-if="inv?.status === 'draft'" class="outline-action" type="button" @click="markSent"><Send /> Mark Sent</button>
      <button v-if="inv?.status !== 'paid' && inv?.status !== 'cancelled'" class="primary-action" type="button" @click="markPaid">Mark Paid</button>
      <button class="danger-action" type="button" @click="destroy"><Trash2 /></button>
    </div>
  </header>

  <section class="content">
    <SkeletonForm v-if="loading" :fields="4" />
    <div v-else-if="inv" class="invoice-view">
      <!-- Header info -->
      <div class="invoice-header-block">
        <div>
          <h2>{{ inv.clients?.name ?? 'Client' }}</h2>
          <p>{{ inv.clients?.email }}</p>
          <p>{{ inv.clients?.address }}, {{ inv.clients?.city }} {{ inv.clients?.state }} {{ inv.clients?.zip }}</p>
        </div>
        <div class="invoice-meta">
          <div><span>Status</span><span class="status" :class="statusColors[inv.status]">{{ inv.status }}</span></div>
          <div><span>Due</span><strong>{{ inv.due_date ?? '—' }}</strong></div>
          <div v-if="inv.paid_at"><span>Paid</span><strong>{{ inv.paid_at.slice(0,10) }}</strong></div>
        </div>
      </div>

      <!-- Line items table -->
      <div class="data-table-wrap" style="margin-top:24px">
        <table class="data-table">
          <thead>
            <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in inv.invoice_items" :key="item.id">
              <td>{{ item.description }}</td>
              <td>{{ item.quantity }}</td>
              <td>${{ item.unit_price.toFixed(2) }}</td>
              <td><strong>${{ item.total.toFixed(2) }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="invoice-totals" style="margin-top:16px">
        <div><span>Subtotal</span><strong>${{ inv.subtotal.toFixed(2) }}</strong></div>
        <div><span>Tax ({{ inv.tax_rate }}%)</span><strong>${{ inv.tax_amount.toFixed(2) }}</strong></div>
        <div class="total-row"><span>Total</span><strong>${{ inv.total_amount.toFixed(2) }}</strong></div>
      </div>

      <p v-if="inv.notes" class="invoice-notes">{{ inv.notes }}</p>
    </div>
  </section>
</template>
