<script setup lang="ts">
import { Menu, Printer } from '@lucide/vue'

useHead({ title: 'Business Report — PureView' })

const toggleSidebar = inject<() => void>('toggleSidebar', () => {})
const { stats, loading: statsLoading, fetchDashboard } = useDashboard()
const { settings, fetch: fetchSettings } = useSettings()
const { expenses, fetchAll: fetchExpenses } = useExpenses()
const { avgRating, fetchAll: fetchFeedback } = useFeedback()

const now = new Date()
const year = now.getFullYear()
const fromIso = new Date(year, 0, 1).toISOString()
const toIso   = new Date(year, 11, 31, 23, 59, 59).toISOString()
const fromDate = `${year}-01-01`
const toDate   = `${year}-12-31`

const loading = ref(true)

onMounted(async () => {
  await Promise.all([
    fetchDashboard(fromIso, toIso, year),
    fetchSettings(),
    fetchExpenses(fromDate, toDate),
    fetchFeedback(),
  ])
  loading.value = false
})

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtK = (n: number) => '$' + (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toFixed(0))
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const margin = computed(() => stats.value.totalRevenue ? ((stats.value.netProfit / stats.value.totalRevenue) * 100).toFixed(1) : '0.0')
const maxMonthly = computed(() => Math.max(1, ...stats.value.monthly))
const svcTotal = computed(() => stats.value.wc + stats.value.sr)
const wcPct = computed(() => svcTotal.value ? Math.round(stats.value.wc / svcTotal.value * 100) : 0)
const srPct = computed(() => svcTotal.value ? Math.round(stats.value.sr / svcTotal.value * 100) : 0)

const expenseCats = computed(() => {
  const map: Record<string, number> = {}
  for (const e of expenses.value) map[e.category] = (map[e.category] ?? 0) + e.amount
  const total = Object.values(map).reduce((s, v) => s + v, 0)
  return Object.entries(map)
    .map(([cat, amt]) => ({ cat, amt, pct: total ? Math.round(amt / total * 100) : 0 }))
    .sort((a, b) => b.amt - a.amt)
})

const businessName = computed(() => settings.value?.business_name || 'PureView Window Cleaning')
const contactLine = computed(() => {
  const s = settings.value
  if (!s) return 'Miami, FL'
  return [s.address, [s.city, s.state].filter(Boolean).join(', '), s.zip].filter(Boolean).join(' · ') || 'Window Cleaning & Screen Repair'
})
const generatedOn = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

function exportPdf() { window.print() }
</script>

<template>
  <div class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <h1><i class="fa-solid fa-chart-bar" style="margin-right:8px;color:var(--blue)"></i>Reports</h1>
        <p>Year-to-date business performance for {{ year }}.</p>
      </div>
    </div>
    <div class="header-actions report-actions">
      <button class="btn-primary" type="button" @click="exportPdf"><Printer style="width:16px;height:16px" /> Export PDF</button>
    </div>
  </div>

  <div class="content">
    <div class="report">
      <!-- Letterhead -->
      <div class="report-letterhead">
        <div class="report-brand">
          <img class="report-logo-img" src="/favicon.png" alt="PureView" />
          <div>
            <h2>{{ businessName }}</h2>
            <p>{{ contactLine }}</p>
            <p v-if="settings?.phone || settings?.email">
              <span v-if="settings?.phone">{{ settings.phone }}</span>
              <span v-if="settings?.phone && settings?.email"> · </span>
              <span v-if="settings?.email">{{ settings.email }}</span>
            </p>
          </div>
        </div>
        <div class="report-meta">
          <div class="report-doc-title">Business Report</div>
          <p>Period: Jan 1 – Dec 31, {{ year }}</p>
          <p>Generated {{ generatedOn }}</p>
        </div>
      </div>

      <template v-if="loading">
        <div class="report-kpis" style="margin-top:24px">
          <div v-for="n in 6" :key="n" class="report-kpi"><Skeleton w="50%" h="10px" /><div style="margin-top:8px"><Skeleton w="70%" h="22px" /></div></div>
        </div>
        <div class="report-section"><Skeleton w="40%" h="14px" /><div style="margin-top:14px"><Skeleton w="100%" h="120px" radius="8px" /></div></div>
      </template>

      <template v-else>
        <!-- KPI grid -->
        <div class="report-kpis">
          <div class="report-kpi accent">
            <div class="k-label">Total Revenue</div>
            <div class="k-value">{{ fmt(stats.totalRevenue) }}</div>
            <div class="k-sub">{{ stats.jobsCompleted }} jobs completed</div>
          </div>
          <div class="report-kpi">
            <div class="k-label">Total Expenses</div>
            <div class="k-value">{{ fmt(stats.expenses) }}</div>
            <div class="k-sub">across {{ expenseCats.length }} categories</div>
          </div>
          <div class="report-kpi">
            <div class="k-label">Net Profit</div>
            <div class="k-value">{{ fmt(stats.netProfit) }}</div>
            <div class="k-sub">{{ margin }}% profit margin</div>
          </div>
          <div class="report-kpi">
            <div class="k-label">New Clients</div>
            <div class="k-value">{{ stats.newClients }}</div>
            <div class="k-sub">{{ stats.recClients }} recurring</div>
          </div>
          <div class="report-kpi">
            <div class="k-label">Avg. Job Value</div>
            <div class="k-value">{{ fmt(stats.jobsCompleted ? stats.totalRevenue / stats.jobsCompleted : 0) }}</div>
            <div class="k-sub">per completed job</div>
          </div>
          <div class="report-kpi">
            <div class="k-label">Customer Rating</div>
            <div class="k-value">{{ avgRating ? avgRating.toFixed(1) : '—' }} <span style="font-size:13px;color:var(--amber)">★</span></div>
            <div class="k-sub">average satisfaction</div>
          </div>
        </div>

        <!-- Revenue by service -->
        <div class="report-section">
          <h3><i class="fa-solid fa-chart-pie"></i> Revenue by Service</h3>
          <div class="report-split">
            <div class="rs-card">
              <div class="rs-dot" style="background:#2563eb"><i class="fa-solid fa-table-cells"></i></div>
              <div><div class="rs-value">{{ fmt(stats.wc) }}</div><div class="rs-label">Window Cleaning · {{ wcPct }}%</div></div>
            </div>
            <div class="rs-card">
              <div class="rs-dot" style="background:#8b5cf6"><i class="fa-solid fa-border-all"></i></div>
              <div><div class="rs-value">{{ fmt(stats.sr) }}</div><div class="rs-label">Screen Repair · {{ srPct }}%</div></div>
            </div>
          </div>
        </div>

        <!-- Revenue by month -->
        <div class="report-section">
          <h3><i class="fa-solid fa-chart-line"></i> Revenue by Month</h3>
          <div class="report-bars">
            <div v-for="(amt, i) in stats.monthly" :key="i" class="report-bar-row">
              <span class="rb-label">{{ MONTHS[i] }}</span>
              <span class="rb-track"><span class="rb-fill" :style="{ width: (amt / maxMonthly * 100) + '%', background: 'linear-gradient(90deg,#2563eb,#3b82f6)' }"></span></span>
              <span class="rb-value">{{ fmtK(amt) }}</span>
            </div>
          </div>
        </div>

        <!-- Expenses by category -->
        <div v-if="expenseCats.length" class="report-section">
          <h3><i class="fa-solid fa-receipt"></i> Expenses by Category</h3>
          <div class="report-bars">
            <div v-for="e in expenseCats" :key="e.cat" class="report-bar-row">
              <span class="rb-label" style="text-transform:capitalize">{{ e.cat }}</span>
              <span class="rb-track"><span class="rb-fill" :style="{ width: e.pct + '%', background: '#f97316' }"></span></span>
              <span class="rb-value">{{ fmt(e.amt) }}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="report-footer">
          <span>{{ businessName }} — Confidential business report</span>
          <span>Generated {{ generatedOn }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
