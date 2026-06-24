<script setup lang="ts">
import { BarChart3, ChevronDown, Coins, DollarSign, Menu, Plus, TrendingDown, TrendingUp, Trash2 } from '@lucide/vue'

const { stats, loading: statsLoading, fetchDashboard } = useDashboard()
const { expenses, loading: expLoading, fetchAll: fetchExpenses, create: createExpense, remove: removeExpense } = useExpenses()
const { show: showToast } = useToast()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const period = ref<'month' | 'quarter' | 'year'>('month')
const showForm = ref(false)
const saving   = ref(false)
const form     = reactive({ category: 'supplies' as const, description: '', amount: 0, date: '', notes: '' })

const range = computed(() => {
  const now   = new Date()
  const y     = now.getFullYear()
  const m     = now.getMonth()
  if (period.value === 'month') {
    return { from: new Date(y, m, 1).toISOString(), to: new Date(y, m + 1, 0, 23, 59, 59).toISOString() }
  }
  if (period.value === 'quarter') {
    const q = Math.floor(m / 3)
    return { from: new Date(y, q * 3, 1).toISOString(), to: new Date(y, q * 3 + 3, 0, 23, 59, 59).toISOString() }
  }
  return { from: new Date(y, 0, 1).toISOString(), to: new Date(y, 11, 31, 23, 59, 59).toISOString() }
})

const dateFrom = computed(() => range.value.from.slice(0, 10))
const dateTo   = computed(() => range.value.to.slice(0, 10))

onMounted(loadData)
watch(period, loadData)

async function loadData() {
  await Promise.all([
    fetchDashboard(range.value.from, range.value.to, new Date().getFullYear()),
    fetchExpenses(dateFrom.value, dateTo.value),
  ])
}

async function submitExpense() {
  if (!form.description.trim() || !form.amount) { showToast('Description and amount are required.'); return }
  saving.value = true
  try {
    await createExpense({
      category:    form.category,
      description: form.description.trim(),
      amount:      form.amount,
      date:        form.date || undefined,
      notes:       form.notes || null,
    })
    showToast('Expense recorded!')
    showForm.value = false
    Object.assign(form, { category: 'supplies', description: '', amount: 0, date: '', notes: '' })
    await fetchExpenses(dateFrom.value, dateTo.value)
  } catch (e: any) { showToast(e.message) } finally { saving.value = false }
}

async function del(id: string) {
  if (!confirm('Delete this expense?')) return
  try { await removeExpense(id); await fetchExpenses(dateFrom.value, dateTo.value) } catch (e: any) { showToast(e.message) }
}

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const periodLabel = computed(() => ({ month: 'This Month', quarter: 'This Quarter', year: 'This Year' })[period.value])
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <h1><BarChart3 style="display:inline;width:20px;height:20px;margin-right:6px;vertical-align:middle" />Financials</h1>
        <p>Revenue, expenses &amp; profitability at a glance.</p>
      </div>
    </div>
    <div class="header-actions">
      <div class="filter-tabs">
        <button v-for="p in ['month','quarter','year'] as const" :key="p" type="button" :class="{ active: period === p }" @click="period = p">
          {{ p === 'month' ? 'Month' : p === 'quarter' ? 'Quarter' : 'Year' }}
        </button>
      </div>
      <button class="primary-action" type="button" @click="showForm = !showForm"><Plus /> Log Expense</button>
    </div>
  </header>

  <section class="content">
    <!-- Summary cards -->
    <div class="stats-grid" style="margin-bottom:24px">
      <article class="stat-card">
        <div>
          <p>Total Revenue</p>
          <strong>{{ statsLoading ? '…' : fmt(stats?.totalRevenue ?? 0) }}</strong>
          <span>{{ periodLabel }}</span>
        </div>
        <div class="stat-icon tint-blue"><DollarSign /></div>
      </article>
      <article class="stat-card">
        <div>
          <p>Total Expenses</p>
          <strong>{{ statsLoading ? '…' : fmt(stats?.expenses ?? 0) }}</strong>
          <span>{{ periodLabel }}</span>
        </div>
        <div class="stat-icon tint-orange"><TrendingDown /></div>
      </article>
      <article class="stat-card">
        <div>
          <p>Net Profit</p>
          <strong>{{ statsLoading ? '…' : fmt(stats?.netProfit ?? 0) }}</strong>
          <span>{{ periodLabel }}</span>
        </div>
        <div class="stat-icon tint-green"><TrendingUp /></div>
      </article>
      <article class="stat-card">
        <div>
          <p>Profit Margin</p>
          <strong>
            {{ (stats && stats.totalRevenue) ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1) + '%' : '—' }}
          </strong>
          <span>{{ periodLabel }}</span>
        </div>
        <div class="stat-icon tint-green"><BarChart3 /></div>
      </article>
    </div>

    <!-- Expense form -->
    <div v-if="showForm" class="form-card" style="margin-bottom:24px">
      <h3 style="margin-bottom:16px">Log Expense</h3>
      <form class="form-grid" @submit.prevent="submitExpense">
        <div class="field">
          <label>Category</label>
          <select v-model="form.category">
            <option v-for="c in ['supplies','fuel','equipment','marketing','insurance','wages','other']" :key="c" :value="c">
              {{ c.charAt(0).toUpperCase() + c.slice(1) }}
            </option>
          </select>
        </div>
        <div class="field field-full">
          <label>Description <span class="required">*</span></label>
          <input v-model="form.description" type="text" required />
        </div>
        <div class="field">
          <label>Amount ($) <span class="required">*</span></label>
          <input v-model.number="form.amount" type="number" min="0.01" step="0.01" required />
        </div>
        <div class="field">
          <label>Date</label>
          <input v-model="form.date" type="date" />
        </div>
        <div class="field field-full">
          <label>Notes</label>
          <textarea v-model="form.notes" rows="2"></textarea>
        </div>
        <div class="form-actions field-full">
          <button type="button" class="outline-action" @click="showForm = false">Cancel</button>
          <button type="submit" class="primary-action" :disabled="saving">{{ saving ? 'Saving…' : 'Log Expense' }}</button>
        </div>
      </form>
    </div>

    <!-- Expenses table -->
    <div class="card" style="padding:20px">
      <div class="card-header" style="margin-bottom:16px">
        <h2>Expenses — {{ periodLabel }}</h2>
      </div>
      <SkeletonTable v-if="expLoading" :cols="5" />
      <div v-else-if="!expenses.length" class="empty-state" style="padding:32px 0">
        <Coins style="width:36px;height:36px;opacity:.3;margin-bottom:8px" />
        <p>No expenses for this period.</p>
      </div>
      <div v-else class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="e in expenses" :key="e.id">
              <td>{{ e.date }}</td>
              <td><span class="pill">{{ e.category }}</span></td>
              <td>{{ e.description }}</td>
              <td><strong>${{ e.amount.toFixed(2) }}</strong></td>
              <td><button class="icon-btn" type="button" @click="del(e.id)"><Trash2 style="width:15px;height:15px" /></button></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3"><strong>Total</strong></td>
              <td><strong>${{ expenses.reduce((s, e) => s + e.amount, 0).toFixed(2) }}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </section>
</template>
