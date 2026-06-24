<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import type { Database } from '~/types/database.types'

Chart.register(...registerables)

const supabase = useSupabaseClient<Database>()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

// ── Data sources ─────────────────────────────────────────────
const { stats, loading: dashLoading, fetchDashboard } = useDashboard()
const prev = useDashboard()                                  // previous period (for % change)
const { appointments, loading: apptLoading, fetchUpcoming, create: createAppt } = useAppointments()
const { feedback, avgRating, loading: fbLoading, fetchAll: fetchFeedback, create: createFeedback } = useFeedback()
const { clients, fetchAll: fetchClients, create: createClient } = useClients()
const { services, fetchAll: fetchServices, create: createService } = useServices()
const { fetchCurrent: fetchCurrentGoal, create: createGoal, update: updateGoal } = useGoals()
const { create: createExpense } = useExpenses()
const { create: createQuote, nextNumber: nextQuoteNumber } = useQuotes()

const currentGoal = ref<Awaited<ReturnType<typeof fetchCurrentGoal>> | null>(null)

// ── Period selection ─────────────────────────────────────────
type Period = 'This Month' | 'Last Month' | 'This Year'
const period = ref<Period>('This Month')
const now = new Date()
const thisYear = now.getFullYear()

function rangeFor(p: Period) {
  const y = now.getFullYear(); const m = now.getMonth()
  if (p === 'This Month')
    return { from: new Date(y, m, 1).toISOString(), to: new Date(y, m + 1, 0, 23, 59, 59).toISOString() }
  if (p === 'Last Month')
    return { from: new Date(y, m - 1, 1).toISOString(), to: new Date(y, m, 0, 23, 59, 59).toISOString() }
  return { from: new Date(y, 0, 1).toISOString(), to: new Date(y, 11, 31, 23, 59, 59).toISOString() }
}
function prevRangeFor(p: Period) {
  const y = now.getFullYear(); const m = now.getMonth()
  if (p === 'This Month')
    return { from: new Date(y, m - 1, 1).toISOString(), to: new Date(y, m, 0, 23, 59, 59).toISOString() }
  if (p === 'Last Month')
    return { from: new Date(y, m - 2, 1).toISOString(), to: new Date(y, m - 1, 0, 23, 59, 59).toISOString() }
  return { from: new Date(y - 1, 0, 1).toISOString(), to: new Date(y - 1, 11, 31, 23, 59, 59).toISOString() }
}

const dateRangeLabel = computed(() => {
  const { from, to } = rangeFor(period.value)
  const f = new Date(from); const t = new Date(to)
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${mo[f.getMonth()]} ${f.getDate()} – ${mo[t.getMonth()]} ${t.getDate()}, ${t.getFullYear()}`
})

// ── Derived figures ──────────────────────────────────────────
function fmt(n: number) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const tot      = computed(() => stats.value.totalRevenue)
const profit   = computed(() => stats.value.netProfit)
const margin   = computed(() => tot.value ? ((profit.value / tot.value) * 100).toFixed(1) : '0.0')
const avgJob   = computed(() => stats.value.jobsCompleted ? tot.value / stats.value.jobsCompleted : 0)
const rpc      = computed(() => (stats.value.newClients + stats.value.recClients) ? tot.value / (stats.value.newClients + stats.value.recClients) : 0)

function changeStr(curVal: number, prevVal: number) {
  if (prevVal <= 0) return curVal > 0 ? '+100%' : '0%'
  const pct = ((curVal - prevVal) / prevVal) * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
}
function isUp(curVal: number, prevVal: number) { return curVal >= prevVal }

const statCards = computed(() => [
  { key: 'total',  label: 'Total Revenue',     icon: 'fa-dollar-sign', bg: '#dbeafe', color: '#2563eb', value: fmt(tot.value),            cur: tot.value,                   prv: prev.stats.value.totalRevenue },
  { key: 'wc',     label: 'Window Cleaning',   icon: 'fa-table-cells', bg: '#cffafe', color: '#0891b2', value: fmt(stats.value.wc),       cur: stats.value.wc,              prv: prev.stats.value.wc },
  { key: 'sr',     label: 'Screen Repair',     icon: 'fa-square',      bg: '#ede9fe', color: '#7c3aed', value: fmt(stats.value.sr),       cur: stats.value.sr,              prv: prev.stats.value.sr },
  { key: 'profit', label: 'Net Profit',        icon: 'fa-chart-line',  bg: '#d1fae5', color: '#059669', value: fmt(profit.value),         cur: profit.value,                prv: prev.stats.value.netProfit },
  { key: 'nc',     label: 'New Clients',       icon: 'fa-user-plus',   bg: '#e0f2fe', color: '#0284c7', value: String(stats.value.newClients), cur: stats.value.newClients, prv: prev.stats.value.newClients },
  { key: 'rc',     label: 'Recurring Clients', icon: 'fa-rotate',      bg: '#fff7ed', color: '#ea580c', value: String(stats.value.recClients), cur: stats.value.recClients, prv: prev.stats.value.recClients },
])

const legendWc = computed(() => `Window Cleaning ${fmt(stats.value.wc)} (${tot.value ? Math.round(stats.value.wc / tot.value * 100) : 0}%)`)
const legendSr = computed(() => `Screen Repair ${fmt(stats.value.sr)} (${tot.value ? Math.round(stats.value.sr / tot.value * 100) : 0}%)`)

// ── Goal progress ────────────────────────────────────────────
const goalItems = computed(() => {
  const g = currentGoal.value
  const revTarget = g?.revenue_target || 25000
  const ncTarget  = g?.new_clients_target || 30
  const jobsTarget = g?.jobs_target || 60
  const satTarget = g?.satisfaction_target || 5
  const sat = avgRating.value || 0
  return [
    { label: 'Revenue Goal',          actual: tot.value,             target: revTarget,  disp: (v: number) => '$' + Math.round(v).toLocaleString(), color: '#2563eb' },
    { label: 'New Clients',           actual: stats.value.newClients, target: ncTarget,  disp: (v: number) => String(v),     color: '#10b981' },
    { label: 'Jobs Completed',        actual: stats.value.jobsCompleted, target: jobsTarget, disp: (v: number) => String(v),  color: '#8b5cf6' },
    { label: 'Customer Satisfaction', actual: sat,                   target: satTarget,  disp: (v: number) => `${(Math.round(v * 10) / 10)} / ${satTarget}`, color: '#f59e0b' },
  ].map(i => ({ ...i, pct: Math.min(100, Math.round((i.actual / (i.target || 1)) * 100)) }))
})

// ── Weekly customer goal ─────────────────────────────────────
// Target lives in localStorage (no schema column); "acquired" is real (clients added in the last 7 days).
const weeklyGoal = ref(20)
const weeklyAcquired = computed(() => stats.value.clientsThisWeek)
const weeklyRemaining = computed(() => Math.max(0, weeklyGoal.value - weeklyAcquired.value))
const weeklyPct = computed(() => weeklyGoal.value ? Math.round(weeklyAcquired.value / weeklyGoal.value * 100) : 0)

// ── Appointment display helpers ──────────────────────────────
const MO = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
function apptMonth(iso: string) { return MO[new Date(iso).getMonth()] }
function apptDay(iso: string)   { return String(new Date(iso).getDate()).padStart(2, '0') }
function apptDow(iso: string)   { return DOW[new Date(iso).getDay()] }
function apptTime(iso: string)  { return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }
function svcTag(name?: string | null) {
  if (!name) return 'tag-green'
  if (name.toLowerCase().includes('window')) return 'tag-blue'
  if (name.toLowerCase().includes('screen')) return 'tag-amber'
  return 'tag-green'
}

// ── Feedback display ─────────────────────────────────────────
const avatarColors = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']
function initials(name?: string | null) { return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }
function stars(n: number) { return '★'.repeat(n) + '☆'.repeat(5 - n) }
function fbDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${mo[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`
}

// ── Recent activity (built from real records) ────────────────
interface Activity { icon: string; color: string; bg: string; title: string; sub: string; time: string; ts: number }
const activity = ref<Activity[]>([])
const activityLoading = ref(false)

// ── Loading state (skeletons) ────────────────────────────────
// firstLoad → full skeletons on initial paint.
// dashLoading → stat cards / charts / financial / weekly / monthly re-skeleton on period switch
//               and after a modal save triggers a refetch.
const firstLoad     = ref(true)
const dataLoading   = computed(() => firstLoad.value || dashLoading.value)
const chartsLoading = computed(() => firstLoad.value || dashLoading.value)
const apptsLoading  = computed(() => firstLoad.value || apptLoading.value)
const feedbackLoading = computed(() => firstLoad.value || fbLoading.value)
const actLoading    = computed(() => firstLoad.value || activityLoading.value)

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d === 1 ? '' : 's'} ago`
}

async function loadActivity() {
  activityLoading.value = true
  const [appts, pays, fbs, recs] = await Promise.all([
    supabase.from('appointments').select('created_at, clients(name), services(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('payments').select('created_at, amount, clients(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('feedback').select('created_at, rating, clients(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('recurring_services').select('created_at, clients(name), services(name)').order('created_at', { ascending: false }).limit(3),
  ])
  const list: Activity[] = []
  for (const a of (appts.data ?? []) as any[])
    list.push({ icon: 'fa-calendar-plus', color: '#2563eb', bg: '#dbeafe', title: 'New appointment booked', sub: `${a.clients?.name ?? 'Client'} – ${a.services?.name ?? 'Service'}`, time: relTime(a.created_at), ts: +new Date(a.created_at) })
  for (const p of (pays.data ?? []) as any[])
    list.push({ icon: 'fa-money-bill-wave', color: '#10b981', bg: '#d1fae5', title: 'Payment received', sub: `$${(p.amount ?? 0).toFixed(2)} from ${p.clients?.name ?? 'client'}`, time: relTime(p.created_at), ts: +new Date(p.created_at) })
  for (const f of (fbs.data ?? []) as any[])
    list.push({ icon: 'fa-star', color: '#f59e0b', bg: '#fef3c7', title: `New review received ${'★'.repeat(f.rating ?? 0)}`, sub: f.clients?.name ?? '', time: relTime(f.created_at), ts: +new Date(f.created_at) })
  for (const r of (recs.data ?? []) as any[])
    list.push({ icon: 'fa-rotate', color: '#8b5cf6', bg: '#ede9fe', title: 'Recurring service created', sub: `${r.clients?.name ?? 'Client'} – ${r.services?.name ?? 'Service'}`, time: relTime(r.created_at), ts: +new Date(r.created_at) })
  activity.value = list.sort((a, b) => b.ts - a.ts).slice(0, 6)
  activityLoading.value = false
}

// ── Notifications ────────────────────────────────────────────
const showNotif = ref(false)
const notifications = computed(() => activity.value.slice(0, 3).map(a => ({ title: a.title, sub: a.sub, time: a.time })))
function toggleNotif(e: Event) { e.stopPropagation(); showNotif.value = !showNotif.value }
function closeNotif() { showNotif.value = false }

// ── Charts ───────────────────────────────────────────────────
const donutRef = ref<HTMLCanvasElement | null>(null)
const trendRef = ref<HTMLCanvasElement | null>(null)
const weeklyRef = ref<HTMLCanvasElement | null>(null)
const monthlyRef = ref<HTMLCanvasElement | null>(null)
let donutChart: Chart | null = null
let trendChart: Chart | null = null
let weeklyChart: Chart | null = null
let monthlyChart: Chart | null = null

function buildCharts() {
  donutChart?.destroy(); trendChart?.destroy(); weeklyChart?.destroy(); monthlyChart?.destroy()
  if (donutRef.value) {
    donutChart = new Chart(donutRef.value, {
      type: 'doughnut',
      data: { labels: ['Window Cleaning', 'Screen Repair'], datasets: [{ data: [stats.value.wc, stats.value.sr], backgroundColor: ['#2563eb', '#8b5cf6'], borderWidth: 0, hoverOffset: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + fmt(c.raw as number) } } } },
    })
  }
  if (trendRef.value) {
    trendChart = new Chart(trendRef.value, {
      type: 'line',
      data: {
        labels: stats.value.trend.labels,
        datasets: [
          { label: 'Total Revenue', data: stats.value.trend.total, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.06)', fill: true, tension: .4, pointRadius: 2, borderWidth: 2 },
          { label: 'Window Cleaning', data: stats.value.trend.wc, borderColor: '#06b6d4', borderDash: [4, 3], fill: false, tension: .4, pointRadius: 2, borderWidth: 1.5 },
          { label: 'Screen Repair', data: stats.value.trend.sr, borderColor: '#8b5cf6', borderDash: [4, 3], fill: false, tension: .4, pointRadius: 2, borderWidth: 1.5 },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 10 } }, grid: { display: false } }, y: { ticks: { font: { size: 10 }, callback: v => '$' + (v as number).toLocaleString() }, grid: { color: '#f1f5f9' } } } },
    })
  }
  if (weeklyRef.value) {
    weeklyChart = new Chart(weeklyRef.value, {
      type: 'doughnut',
      data: { labels: ['Acquired', 'Remaining'], datasets: [{ data: [weeklyAcquired.value, weeklyRemaining.value], backgroundColor: ['#2563eb', '#e2e8f0'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false }, tooltip: { enabled: false } } },
    })
  }
  if (monthlyRef.value) {
    monthlyChart = new Chart(monthlyRef.value, {
      type: 'bar',
      data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], datasets: [{ data: stats.value.monthly, backgroundColor: '#2563eb', borderRadius: 4, borderSkipped: false }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 10 } }, grid: { display: false } }, y: { ticks: { font: { size: 10 }, callback: v => '$' + (v as number) / 1000 + 'k' }, grid: { color: '#f1f5f9' } } } },
    })
  }
}

function refreshCharts() {
  if (donutChart) { donutChart.data.datasets[0].data = [stats.value.wc, stats.value.sr]; donutChart.update() }
  if (trendChart) {
    trendChart.data.labels = stats.value.trend.labels
    trendChart.data.datasets[0].data = stats.value.trend.total
    trendChart.data.datasets[1].data = stats.value.trend.wc
    trendChart.data.datasets[2].data = stats.value.trend.sr
    trendChart.update()
  }
  if (weeklyChart) { weeklyChart.data.datasets[0].data = [weeklyAcquired.value, weeklyRemaining.value]; weeklyChart.update() }
  if (monthlyChart) { monthlyChart.data.datasets[0].data = stats.value.monthly; monthlyChart.update() }
}

// ── Loaders ──────────────────────────────────────────────────
async function loadPeriod() {
  const r = rangeFor(period.value)
  const pr = prevRangeFor(period.value)
  await Promise.all([
    fetchDashboard(r.from, r.to, thisYear),
    prev.fetchDashboard(pr.from, pr.to, thisYear),
  ])
  refreshCharts()
}

async function refreshAll() {
  currentGoal.value = await fetchCurrentGoal().catch(() => null)
  await Promise.all([loadPeriod(), fetchUpcoming(4), fetchFeedback(), loadActivity()])
}

onMounted(async () => {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('cc_weekly_goal')
    if (saved) weeklyGoal.value = parseInt(saved) || 20
  }
  await Promise.all([fetchClients(), fetchServices()])
  await refreshAll()
  firstLoad.value = false          // reveal real content + charts
  await nextTick()
  buildCharts()
  document.addEventListener('click', closeNotif)
})

onUnmounted(() => {
  document.removeEventListener('click', closeNotif)
  donutChart?.destroy(); trendChart?.destroy(); weeklyChart?.destroy(); monthlyChart?.destroy()
})

watch(period, loadPeriod)

// ── Modals ───────────────────────────────────────────────────
const modal = ref<string | null>(null)
function openModal(id: string) { modal.value = id }
function closeModal() { modal.value = null }

const { show: showToast } = useToast()
const saving = ref(false)

// resolve a client by name, creating one if needed
async function resolveClient(name: string) {
  const trimmed = name.trim()
  const found = clients.value.find(c => c.name.toLowerCase() === trimmed.toLowerCase())
  if (found) return found.id
  const created = await createClient({ name: trimmed })
  await fetchClients()
  return created.id
}
async function resolveService(name: string) {
  const found = services.value.find(s => s.name.toLowerCase() === name.toLowerCase())
  if (found) return found
  const created = await createService({ name })
  await fetchServices()
  return created
}

// New Appointment
const apptForm = reactive({ name: '', date: '', time: '', service: 'Window Cleaning', status: 'Confirmed', addr: '' })
const apptErr = ref('')
async function addAppointment() {
  if (!apptForm.name.trim() || !apptForm.date || !apptForm.time) { apptErr.value = 'Please fill in client name, date, and time.'; return }
  apptErr.value = ''; saving.value = true
  try {
    const clientId = await resolveClient(apptForm.name)
    const svc = await resolveService(apptForm.service)
    await createAppt({
      client_id: clientId,
      service_id: svc.id,
      scheduled_at: new Date(`${apptForm.date}T${apptForm.time}`).toISOString(),
      status: apptForm.status.toLowerCase() as never,
      address: apptForm.addr || null,
      price: svc.base_price ?? 0,
    })
    showToast('Appointment saved!')
    Object.assign(apptForm, { name: '', date: '', time: '', service: 'Window Cleaning', status: 'Confirmed', addr: '' })
    closeModal()
    await refreshAll()
  } catch (e: any) { apptErr.value = e.message } finally { saving.value = false }
}

// Add Client
const clientForm = reactive({ first: '', last: '', email: '', phone: '', type: 'New', addr: '' })
const clientErr = ref('')
async function addClient() {
  if (!clientForm.first.trim() && !clientForm.last.trim()) { clientErr.value = 'Please enter a name.'; return }
  clientErr.value = ''; saving.value = true
  try {
    await createClient({
      name: `${clientForm.first} ${clientForm.last}`.trim(),
      email: clientForm.email || null,
      phone: clientForm.phone || null,
      address: clientForm.addr || null,
    })
    showToast('Client added!')
    Object.assign(clientForm, { first: '', last: '', email: '', phone: '', type: 'New', addr: '' })
    closeModal()
    await Promise.all([fetchClients(), refreshAll()])
  } catch (e: any) { clientErr.value = e.message } finally { saving.value = false }
}

// Record Expense
const expForm = reactive({ desc: '', amount: '', date: '', category: 'Supplies' })
const expErr = ref('')
const expCatMap: Record<string, string> = { Supplies: 'supplies', Equipment: 'equipment', Fuel: 'fuel', Labor: 'wages', Marketing: 'marketing', Other: 'other' }
async function recordExpense() {
  const amt = parseFloat(expForm.amount) || 0
  if (!expForm.desc.trim() || !amt) { expErr.value = 'Please enter a description and amount.'; return }
  expErr.value = ''; saving.value = true
  try {
    await createExpense({
      description: expForm.desc.trim(),
      amount: amt,
      date: expForm.date || undefined,
      category: (expCatMap[expForm.category] || 'other') as never,
    })
    showToast('Expense recorded!')
    Object.assign(expForm, { desc: '', amount: '', date: '', category: 'Supplies' })
    closeModal()
    await refreshAll()
  } catch (e: any) { expErr.value = e.message } finally { saving.value = false }
}

// Create Quote
const quoteForm = reactive({ name: '', desc: '', amount: '', valid: '' })
const quoteErr = ref('')
async function createQuoteAction() {
  if (!quoteForm.name.trim() || !quoteForm.desc.trim()) { quoteErr.value = 'Please enter a client name and description.'; return }
  quoteErr.value = ''; saving.value = true
  try {
    const clientId = await resolveClient(quoteForm.name)
    const amount = parseFloat(quoteForm.amount) || 0
    const number = await nextQuoteNumber()
    await createQuote(
      { client_id: clientId, quote_number: number, title: quoteForm.desc.trim(), status: 'draft', subtotal: amount, total_amount: amount, valid_until: quoteForm.valid || null },
      [{ description: quoteForm.desc.trim(), quantity: 1, unit_price: amount }],
    )
    showToast('Quote created!')
    Object.assign(quoteForm, { name: '', desc: '', amount: '', valid: '' })
    closeModal()
    await loadActivity()
  } catch (e: any) { quoteErr.value = e.message } finally { saving.value = false }
}

// Add Feedback
const fbForm = reactive({ name: '', rating: '5', date: '', text: '' })
const fbErr = ref('')
async function addFeedback() {
  if (!fbForm.name.trim() || !fbForm.text.trim()) { fbErr.value = 'Please fill in customer name and review.'; return }
  fbErr.value = ''; saving.value = true
  try {
    const clientId = await resolveClient(fbForm.name)
    const rating = Math.min(5, Math.max(1, parseInt(fbForm.rating) || 5))
    await createFeedback({ client_id: clientId, rating, comment: fbForm.text.trim(), date: fbForm.date || undefined })
    showToast('Review added!')
    Object.assign(fbForm, { name: '', rating: '5', date: '', text: '' })
    closeModal()
    await Promise.all([fetchFeedback(), loadActivity()])
  } catch (e: any) { fbErr.value = e.message } finally { saving.value = false }
}

// Edit Goals
const goalForm = reactive({ revTarget: '', ncTarget: '', jobsTarget: '', satTarget: '' })
const goalErr = ref('')
function openGoalModal() {
  const g = currentGoal.value
  goalForm.revTarget  = String(g?.revenue_target ?? 25000)
  goalForm.ncTarget   = String(g?.new_clients_target ?? 30)
  goalForm.jobsTarget = String(g?.jobs_target ?? 60)
  goalForm.satTarget  = String(g?.satisfaction_target ?? 5)
  openModal('goalModal')
}
async function saveGoals() {
  saving.value = true; goalErr.value = ''
  try {
    const payload = {
      revenue_target:      parseFloat(goalForm.revTarget) || 0,
      new_clients_target:  parseInt(goalForm.ncTarget) || 0,
      jobs_target:         parseInt(goalForm.jobsTarget) || 0,
      satisfaction_target: parseFloat(goalForm.satTarget) || 5,
    }
    if (currentGoal.value) {
      await updateGoal(currentGoal.value.id, payload)
    } else {
      const y = now.getFullYear(); const m = now.getMonth()
      await createGoal({
        period_type: 'monthly',
        period_start: new Date(y, m, 1).toISOString().slice(0, 10),
        period_end:   new Date(y, m + 1, 0).toISOString().slice(0, 10),
        ...payload,
      })
    }
    showToast('Goals updated!')
    closeModal()
    currentGoal.value = await fetchCurrentGoal().catch(() => null)
  } catch (e: any) { goalErr.value = e.message } finally { saving.value = false }
}

// Edit Financials — records real entries (completed appointments + an expense)
const finForm = reactive({ wc: '', sr: '', expenses: '' })
const finErr = ref('')
async function saveFinancials() {
  saving.value = true; finErr.value = ''
  try {
    const wc = parseFloat(finForm.wc) || 0
    const sr = parseFloat(finForm.sr) || 0
    const exp = parseFloat(finForm.expenses) || 0
    const nowIso = new Date().toISOString()
    if (wc > 0) {
      const svc = await resolveService('Window Cleaning')
      await createAppt({ service_id: svc.id, scheduled_at: nowIso, status: 'completed' as never, price: wc, notes: 'Financial entry' })
    }
    if (sr > 0) {
      const svc = await resolveService('Screen Repair')
      await createAppt({ service_id: svc.id, scheduled_at: nowIso, status: 'completed' as never, price: sr, notes: 'Financial entry' })
    }
    if (exp > 0) {
      await createExpense({ description: 'Financial entry', amount: exp, category: 'other' as never })
    }
    showToast('Dashboard updated!')
    Object.assign(finForm, { wc: '', sr: '', expenses: '' })
    closeModal()
    await refreshAll()
  } catch (e: any) { finErr.value = e.message } finally { saving.value = false }
}

// Edit Weekly Goal
const weeklyForm = reactive({ goal: '', acquired: '' })
function openWeeklyModal() {
  weeklyForm.goal = String(weeklyGoal.value)
  weeklyForm.acquired = String(weeklyAcquired.value)
  openModal('weeklyModal')
}
function saveWeekly() {
  weeklyGoal.value = parseInt(weeklyForm.goal) || weeklyGoal.value
  if (typeof window !== 'undefined') window.localStorage.setItem('cc_weekly_goal', String(weeklyGoal.value))
  refreshCharts()
  showToast('Weekly goal updated!')
  closeModal()
}

// Date / period picker
function pickPeriod(p: Period) { period.value = p; closeModal() }

const router = useRouter()
</script>

<template>
  <!-- TOPBAR -->
  <div class="topbar">
    <button class="hamburger" type="button" aria-label="Menu" @click="toggleSidebar()"><i class="fa-solid fa-bars"></i></button>
    <div class="topbar-welcome">
      <h1>Welcome back, PureView!</h1>
      <p>Here's what's happening with your business today.</p>
    </div>
    <button class="date-picker" type="button" @click="openModal('dateModal')">
      <i class="fa-regular fa-calendar"></i>
      <span>{{ dateRangeLabel }}</span>
      <i class="fa-solid fa-chevron-down" style="font-size:10px;color:var(--text-muted)"></i>
    </button>
    <button class="btn-primary" type="button" @click="openModal('apptModal')">
      <i class="fa-solid fa-plus"></i> New Appointment
    </button>
    <div v-if="false" class="notif-wrap" @click.stop>
      <button class="notif" type="button" aria-label="Notifications" @click="toggleNotif">
        <i class="fa-regular fa-bell" style="color:var(--text-muted)"></i>
        <span class="notif-badge">{{ notifications.length }}</span>
      </button>
      <div v-if="showNotif" class="notification-panel">
        <div class="notification-panel-header">
          <h3>Notifications</h3>
          <button type="button" @click="closeNotif">Close</button>
        </div>
        <div v-if="!notifications.length" class="empty-hint">No recent activity.</div>
        <div v-for="(n, i) in notifications" :key="i" class="notification-item">
          <div class="notification-dot"></div>
          <div class="notification-text">
            <strong>{{ n.title }}</strong>
            <span>{{ n.sub }}</span>
            <time>{{ n.time }}</time>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- CONTENT -->
  <div class="content">
    <!-- STAT CARDS -->
    <div class="stats-grid">
      <!-- skeletons -->
      <template v-if="dataLoading">
        <div v-for="n in 6" :key="n" class="stat-card" style="cursor:default">
          <div class="stat-header">
            <Skeleton w="55%" h="10px" />
            <Skeleton w="32px" h="32px" radius="8px" />
          </div>
          <Skeleton w="70%" h="20px" />
          <Skeleton w="60%" h="11px" />
        </div>
      </template>
      <!-- real -->
      <template v-else>
        <div v-for="s in statCards" :key="s.key" class="stat-card" @click="openModal('finModal')">
          <div class="stat-header">
            <span class="stat-label">{{ s.label }}</span>
            <div class="stat-icon" :style="{ background: s.bg, color: s.color }"><i class="fa-solid" :class="s.icon"></i></div>
          </div>
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-change" :class="isUp(s.cur, s.prv) ? 'up' : 'down'">
            <i class="fa-solid" :class="isUp(s.cur, s.prv) ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'" style="font-size:10px"></i>
            {{ changeStr(s.cur, s.prv) }} vs last period
          </div>
        </div>
      </template>
    </div>

    <!-- ROW 1 -->
    <div class="row row-3">
      <!-- Revenue Overview -->
      <div class="card">
        <div class="card-head">
          <span class="card-title">Revenue Overview</span>
          <select class="period-select" v-model="period">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
        </div>
        <div class="dash-charts">
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:10px">Revenue by Service</div>
            <div class="chart-wrap" style="height:140px;display:flex;align-items:center;justify-content:center">
              <canvas ref="donutRef" role="img" aria-label="Revenue by service donut chart"></canvas>
              <div v-if="chartsLoading" class="skeleton-overlay"><Skeleton w="120px" h="120px" circle /></div>
            </div>
            <div class="donut-row" style="justify-content:center;gap:12px;flex-wrap:wrap">
              <template v-if="dataLoading">
                <Skeleton w="120px" h="11px" /><Skeleton w="100px" h="11px" />
              </template>
              <template v-else>
                <div class="legend-item"><div class="legend-dot" style="background:#2563eb"></div><span>{{ legendWc }}</span></div>
                <div class="legend-item"><div class="legend-dot" style="background:#8b5cf6"></div><span>{{ legendSr }}</span></div>
              </template>
            </div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:6px">Revenue Trend</div>
            <div class="chart-wrap" style="height:180px">
              <canvas ref="trendRef" role="img" aria-label="Revenue trend line chart"></canvas>
              <div v-if="chartsLoading" class="skeleton-overlay"><Skeleton w="100%" h="160px" radius="8px" /></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="card">
        <div class="card-head">
          <span class="card-title">Financial Summary</span>
          <select class="period-select" v-model="period">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
        </div>
        <table v-if="dataLoading" class="fin-table">
          <tbody>
            <tr v-for="n in 6" :key="n"><td><Skeleton w="55%" h="12px" /></td><td style="text-align:right"><Skeleton w="40%" h="12px" /></td></tr>
          </tbody>
        </table>
        <table v-else class="fin-table">
          <tbody>
            <tr><td style="color:var(--text-muted)">Total Revenue</td><td class="pos">{{ fmt(tot) }}</td></tr>
            <tr><td style="color:var(--text-muted)">Total Expenses</td><td class="neg">-{{ fmt(stats.expenses) }}</td></tr>
            <tr><td style="color:var(--text-muted)">Net Profit</td><td class="pos">{{ fmt(profit) }}</td></tr>
            <tr><td style="color:var(--text-muted)">Profit Margin</td><td>{{ margin }}%</td></tr>
            <tr><td style="color:var(--text-muted)">Average Job Value</td><td>{{ fmt(avgJob) }}</td></tr>
            <tr><td style="color:var(--text-muted)">Revenue per Client</td><td>{{ fmt(rpc) }}</td></tr>
          </tbody>
        </table>
        <div class="fin-view">
          <button class="btn-outline" type="button" @click="openModal('finModal')"><i class="fa-solid fa-chart-line"></i> Edit Financials</button>
        </div>
      </div>

      <!-- Upcoming Appointments -->
      <div class="card">
        <div class="card-head">
          <span class="card-title">Upcoming Appointments</span>
          <span class="card-action" @click="router.push('/calendar')">View Calendar</span>
        </div>
        <div class="appt-list">
          <template v-if="apptsLoading">
            <div v-for="n in 4" :key="n" class="appt-item" style="cursor:default">
              <Skeleton w="42px" h="48px" radius="7px" />
              <div class="appt-info" style="display:flex;flex-direction:column;gap:6px">
                <Skeleton w="40%" h="11px" /><Skeleton w="65%" h="11px" /><Skeleton w="80%" h="10px" />
              </div>
              <div class="appt-meta" style="gap:6px"><Skeleton w="60px" h="14px" radius="5px" /><Skeleton w="40px" h="10px" /></div>
            </div>
          </template>
          <p v-else-if="!appointments.length" class="empty-hint">No upcoming appointments.</p>
          <div v-for="a in (apptsLoading ? [] : appointments)" :key="a.id" class="appt-item" @click="router.push(`/appointments/${a.id}`)">
            <div class="appt-date">
              <div class="appt-month">{{ apptMonth(a.scheduled_at) }}</div>
              <div class="appt-day">{{ apptDay(a.scheduled_at) }}</div>
              <div class="appt-dow">{{ apptDow(a.scheduled_at) }}</div>
            </div>
            <div class="appt-info">
              <div class="appt-time">{{ apptTime(a.scheduled_at) }}</div>
              <div class="appt-name">{{ a.clients?.name ?? 'Client' }}</div>
              <div class="appt-addr">{{ a.address ?? '' }}</div>
            </div>
            <div class="appt-meta">
              <span class="tag" :class="svcTag(a.services?.name)">{{ a.services?.name ?? 'Service' }}</span>
              <span class="status" :class="a.status === 'confirmed' ? 'status-confirmed' : 'status-pending'">{{ a.status }}</span>
            </div>
          </div>
        </div>
        <div style="text-align:center;margin-top:12px">
          <button class="btn-outline" type="button" @click="openModal('apptModal')"><i class="fa-solid fa-plus"></i> Add Appointment</button>
        </div>
      </div>
    </div>

    <!-- ROW 2 -->
    <div class="row row-3">
      <!-- Monthly Goal Progress -->
      <div class="card">
        <div class="card-head">
          <span class="card-title">Monthly Goal Progress</span>
          <select class="period-select"><option>{{ ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()] }} {{ thisYear }}</option></select>
        </div>
        <div v-if="dataLoading">
          <div v-for="n in 4" :key="n" class="goal-item">
            <div class="goal-header"><Skeleton w="40%" h="11px" /><Skeleton w="30%" h="11px" /></div>
            <Skeleton w="100%" h="7px" radius="10px" />
          </div>
        </div>
        <div v-else>
          <div v-for="i in goalItems" :key="i.label" class="goal-item">
            <div class="goal-header">
              <span class="goal-label">{{ i.label }}</span>
              <span class="goal-vals">{{ i.disp(i.actual) }} / {{ i.disp(i.target) }}</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" :style="{ width: i.pct + '%', background: i.color }"></div></div>
            <div :style="{ textAlign: 'right', fontSize: '11px', color: i.color, fontWeight: 600, marginTop: '2px' }">{{ i.pct }}%</div>
          </div>
        </div>
        <button class="btn-outline" style="width:100%;justify-content:center;margin-top:4px" type="button" @click="openGoalModal"><i class="fa-solid fa-pen"></i> Edit Goals</button>
      </div>

      <!-- Weekly Customer Goal -->
      <div class="card">
        <div class="card-head">
          <span class="card-title">Weekly Customer Goal</span>
          <select class="period-select"><option>This Week</option></select>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap">
          <div style="position:relative;width:130px;height:130px">
            <canvas ref="weeklyRef" role="img" aria-label="Weekly goal donut"></canvas>
            <div v-if="chartsLoading" class="skeleton-overlay"><Skeleton w="130px" h="130px" circle /></div>
            <div v-if="!chartsLoading" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
              <div class="weekly-pct">{{ weeklyPct }}%</div>
              <div class="weekly-sub">Goal Progress</div>
            </div>
          </div>
          <div class="weekly-detail">
            <div class="wd-row"><span style="color:var(--text-muted)">Weekly Goal</span><span>{{ weeklyGoal }}</span></div>
            <div class="wd-row"><span style="color:var(--text-muted)">Customers Acquired</span><span>{{ weeklyAcquired }}</span></div>
            <div class="wd-row"><span style="color:var(--text-muted)">Remaining</span><span>{{ weeklyRemaining }}</span></div>
          </div>
        </div>
        <div style="text-align:center;margin-top:12px">
          <button class="btn-outline" type="button" @click="openWeeklyModal"><i class="fa-solid fa-pen"></i> Edit Weekly Goal</button>
        </div>
      </div>

      <!-- Revenue by Month -->
      <div class="card">
        <div class="card-head">
          <span class="card-title">Revenue by Month (This Year)</span>
          <select class="period-select"><option>This Year</option></select>
        </div>
        <div class="chart-wrap" style="height:180px">
          <canvas ref="monthlyRef" role="img" aria-label="Revenue by month bar chart"></canvas>
          <div v-if="chartsLoading" class="skeleton-overlay"><Skeleton w="100%" h="160px" radius="8px" /></div>
        </div>
      </div>
    </div>

    <!-- ROW 3 -->
    <div class="row row-2-1">
      <div class="card">
        <div class="card-head">
          <span class="card-title">Recent Customer Feedback</span>
          <span class="card-action" @click="router.push('/feedback')">View All Reviews</span>
        </div>
        <div class="feedback-grid">
          <template v-if="feedbackLoading">
            <div v-for="n in 3" :key="n" class="fb-card">
              <div class="fb-header"><Skeleton w="32px" h="32px" circle /><div style="flex:1;display:flex;flex-direction:column;gap:5px"><Skeleton w="60%" h="11px" /><Skeleton w="40%" h="9px" /></div></div>
              <Skeleton w="50%" h="11px" />
              <div style="margin-top:6px;display:flex;flex-direction:column;gap:4px"><Skeleton w="100%" h="9px" /><Skeleton w="90%" h="9px" /></div>
            </div>
          </template>
          <p v-else-if="!feedback.length" class="empty-hint" style="grid-column:1/-1">No feedback yet.</p>
          <div v-for="(f, i) in (feedbackLoading ? [] : feedback.slice(0, 3))" :key="f.id" class="fb-card">
            <div class="fb-header">
              <div class="fb-avatar" :style="{ background: avatarColors[i % avatarColors.length] }">{{ initials(f.clients?.name) }}</div>
              <div><div class="fb-name">{{ f.clients?.name ?? 'Client' }}</div><div class="fb-date">{{ fbDate(f.date) }}</div></div>
            </div>
            <div class="fb-stars">{{ stars(f.rating ?? 0) }}</div>
            <div class="fb-text">{{ f.comment }}</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head">
          <span class="card-title">Recent Activity</span>
          <span class="card-action" @click="router.push('/reports')">View All Activity</span>
        </div>
        <div class="act-list">
          <template v-if="actLoading">
            <div v-for="n in 5" :key="n" class="act-item">
              <Skeleton w="28px" h="28px" radius="7px" />
              <div style="flex:1;display:flex;flex-direction:column;gap:5px"><Skeleton w="70%" h="11px" /><Skeleton w="45%" h="10px" /></div>
              <Skeleton w="40px" h="9px" />
            </div>
          </template>
          <p v-else-if="!activity.length" class="empty-hint">No recent activity.</p>
          <div v-for="(a, i) in (actLoading ? [] : activity)" :key="i" class="act-item">
            <div class="act-icon" :style="{ background: a.bg, color: a.color }"><i class="fa-solid" :class="a.icon"></i></div>
            <div style="flex:1">
              <div class="act-text">{{ a.title }}</div>
              <div v-if="a.sub" class="act-sub">{{ a.sub }}</div>
            </div>
            <div class="act-time">{{ a.time }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- BOTTOM BAR -->
  <div class="bottom-bar">
    <button class="bbar-btn" type="button" @click="openModal('apptModal')"><i class="fa-solid fa-plus"></i> New Appointment</button>
    <button class="bbar-btn" type="button" @click="openModal('quoteModal')"><i class="fa-solid fa-file-invoice"></i> Create Quote / Proforma</button>
    <button class="bbar-btn" type="button" @click="openModal('clientModal')"><i class="fa-solid fa-user-plus"></i> Add Client</button>
    <button class="bbar-btn" type="button" @click="openModal('expenseModal')"><i class="fa-solid fa-receipt"></i> Record Expense</button>
    <button class="bbar-btn" type="button" @click="router.push('/calendar')"><i class="fa-regular fa-calendar"></i> View Calendar</button>
    <button class="bbar-btn" type="button" @click="router.push('/invoices')"><i class="fa-solid fa-paper-plane"></i> Send Invoice</button>
  </div>

  <!-- ==================== MODALS ==================== -->

  <!-- Date / Period -->
  <div class="modal-overlay" :class="{ open: modal === 'dateModal' }" @click.self="closeModal">
    <div class="modal" style="width:360px">
      <div class="modal-title">Select Period <span class="modal-close" @click="closeModal">✕</span></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button v-for="p in (['This Month','Last Month','This Year'] as const)" :key="p" class="btn-outline" style="justify-content:flex-start" type="button" @click="pickPeriod(p)">
          <i class="fa-regular fa-calendar"></i> {{ p }}
        </button>
      </div>
    </div>
  </div>

  <!-- New Appointment -->
  <div class="modal-overlay" :class="{ open: modal === 'apptModal' }" @click.self="closeModal">
    <div class="modal">
      <div class="modal-title">New Appointment <span class="modal-close" @click="closeModal">✕</span></div>
      <div class="form-grid">
        <div class="form-group full">
          <label class="form-label">Client Name</label>
          <input class="form-input" type="text" placeholder="e.g. John Smith" v-model="apptForm.name">
        </div>
        <div class="form-group"><label class="form-label">Date</label><input class="form-input" type="date" v-model="apptForm.date"></div>
        <div class="form-group"><label class="form-label">Time</label><input class="form-input" type="time" v-model="apptForm.time"></div>
        <div class="form-group">
          <label class="form-label">Service Type</label>
          <select class="form-select form-input" v-model="apptForm.service">
            <option>Window Cleaning</option><option>Screen Repair</option><option>Gutter Cleaning</option><option>Pressure Washing</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select form-input" v-model="apptForm.status"><option>Confirmed</option><option>Pending</option></select>
        </div>
        <div class="form-group full">
          <label class="form-label">Address</label>
          <input class="form-input" type="text" placeholder="e.g. 123 Main St, Miami, FL" v-model="apptForm.addr">
        </div>
        <div v-if="apptErr" class="modal-error">{{ apptErr }}</div>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" type="button" @click="closeModal">Cancel</button>
        <button class="btn-save" type="button" :disabled="saving" @click="addAppointment">Save Appointment</button>
      </div>
    </div>
  </div>

  <!-- Financial Edit -->
  <div class="modal-overlay" :class="{ open: modal === 'finModal' }" @click.self="closeModal">
    <div class="modal">
      <div class="modal-title">Edit Financial Summary <span class="modal-close" @click="closeModal">✕</span></div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Window Cleaning Revenue ($)</label><input class="form-input" type="number" placeholder="0" v-model="finForm.wc"></div>
        <div class="form-group"><label class="form-label">Screen Repair Revenue ($)</label><input class="form-input" type="number" placeholder="0" v-model="finForm.sr"></div>
        <div class="form-group full"><label class="form-label">Total Expenses ($)</label><input class="form-input" type="number" placeholder="0" v-model="finForm.expenses"></div>
        <div v-if="finErr" class="modal-error">{{ finErr }}</div>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" type="button" @click="closeModal">Cancel</button>
        <button class="btn-save" type="button" :disabled="saving" @click="saveFinancials">Update Dashboard</button>
      </div>
    </div>
  </div>

  <!-- Goals Edit -->
  <div class="modal-overlay" :class="{ open: modal === 'goalModal' }" @click.self="closeModal">
    <div class="modal">
      <div class="modal-title">Edit Monthly Goals <span class="modal-close" @click="closeModal">✕</span></div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Revenue Goal ($)</label><input class="form-input" type="number" v-model="goalForm.revTarget"></div>
        <div class="form-group"><label class="form-label">New Clients Goal</label><input class="form-input" type="number" v-model="goalForm.ncTarget"></div>
        <div class="form-group"><label class="form-label">Jobs Goal</label><input class="form-input" type="number" v-model="goalForm.jobsTarget"></div>
        <div class="form-group"><label class="form-label">Satisfaction Goal (out of 5)</label><input class="form-input" type="number" step="0.1" v-model="goalForm.satTarget"></div>
        <div v-if="goalErr" class="modal-error">{{ goalErr }}</div>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" type="button" @click="closeModal">Cancel</button>
        <button class="btn-save" type="button" :disabled="saving" @click="saveGoals">Update Goals</button>
      </div>
    </div>
  </div>

  <!-- Weekly Goal -->
  <div class="modal-overlay" :class="{ open: modal === 'weeklyModal' }" @click.self="closeModal">
    <div class="modal">
      <div class="modal-title">Edit Weekly Customer Goal <span class="modal-close" @click="closeModal">✕</span></div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Weekly Goal</label><input class="form-input" type="number" v-model="weeklyForm.goal"></div>
        <div class="form-group"><label class="form-label">Customers Acquired</label><input class="form-input" type="number" v-model="weeklyForm.acquired" disabled></div>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" type="button" @click="closeModal">Cancel</button>
        <button class="btn-save" type="button" @click="saveWeekly">Update</button>
      </div>
    </div>
  </div>

  <!-- Add Client -->
  <div class="modal-overlay" :class="{ open: modal === 'clientModal' }" @click.self="closeModal">
    <div class="modal">
      <div class="modal-title">Add New Client <span class="modal-close" @click="closeModal">✕</span></div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">First Name</label><input class="form-input" type="text" placeholder="John" v-model="clientForm.first"></div>
        <div class="form-group"><label class="form-label">Last Name</label><input class="form-input" type="text" placeholder="Smith" v-model="clientForm.last"></div>
        <div class="form-group full"><label class="form-label">Email</label><input class="form-input" type="email" placeholder="john@example.com" v-model="clientForm.email"></div>
        <div class="form-group"><label class="form-label">Phone</label><input class="form-input" type="tel" placeholder="(305) 555-0100" v-model="clientForm.phone"></div>
        <div class="form-group"><label class="form-label">Client Type</label><select class="form-select form-input" v-model="clientForm.type"><option>New</option><option>Recurring</option></select></div>
        <div class="form-group full"><label class="form-label">Address</label><input class="form-input" type="text" placeholder="123 Main St, Miami, FL" v-model="clientForm.addr"></div>
        <div v-if="clientErr" class="modal-error">{{ clientErr }}</div>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" type="button" @click="closeModal">Cancel</button>
        <button class="btn-save" type="button" :disabled="saving" @click="addClient">Save Client</button>
      </div>
    </div>
  </div>

  <!-- Record Expense -->
  <div class="modal-overlay" :class="{ open: modal === 'expenseModal' }" @click.self="closeModal">
    <div class="modal">
      <div class="modal-title">Record Expense <span class="modal-close" @click="closeModal">✕</span></div>
      <div class="form-grid">
        <div class="form-group full"><label class="form-label">Description</label><input class="form-input" type="text" placeholder="e.g. Cleaning supplies" v-model="expForm.desc"></div>
        <div class="form-group"><label class="form-label">Amount ($)</label><input class="form-input" type="number" placeholder="0.00" v-model="expForm.amount"></div>
        <div class="form-group"><label class="form-label">Date</label><input class="form-input" type="date" v-model="expForm.date"></div>
        <div class="form-group full"><label class="form-label">Category</label>
          <select class="form-select form-input" v-model="expForm.category">
            <option>Supplies</option><option>Equipment</option><option>Fuel</option><option>Labor</option><option>Marketing</option><option>Other</option>
          </select>
        </div>
        <div v-if="expErr" class="modal-error">{{ expErr }}</div>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" type="button" @click="closeModal">Cancel</button>
        <button class="btn-save" type="button" :disabled="saving" @click="recordExpense">Record Expense</button>
      </div>
    </div>
  </div>

  <!-- Quote -->
  <div class="modal-overlay" :class="{ open: modal === 'quoteModal' }" @click.self="closeModal">
    <div class="modal">
      <div class="modal-title">Create Quote / Proforma <span class="modal-close" @click="closeModal">✕</span></div>
      <div class="form-grid">
        <div class="form-group full"><label class="form-label">Client Name</label><input class="form-input" type="text" placeholder="Client Name" v-model="quoteForm.name"></div>
        <div class="form-group full"><label class="form-label">Service Description</label><input class="form-input" type="text" placeholder="e.g. Full window cleaning – 2 story home" v-model="quoteForm.desc"></div>
        <div class="form-group"><label class="form-label">Quote Amount ($)</label><input class="form-input" type="number" placeholder="0.00" v-model="quoteForm.amount"></div>
        <div class="form-group"><label class="form-label">Valid Until</label><input class="form-input" type="date" v-model="quoteForm.valid"></div>
        <div v-if="quoteErr" class="modal-error">{{ quoteErr }}</div>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" type="button" @click="closeModal">Cancel</button>
        <button class="btn-save" type="button" :disabled="saving" @click="createQuoteAction">Create Quote</button>
      </div>
    </div>
  </div>

  <!-- Add Feedback -->
  <div class="modal-overlay" :class="{ open: modal === 'feedbackModal' }" @click.self="closeModal">
    <div class="modal">
      <div class="modal-title">Add Customer Review <span class="modal-close" @click="closeModal">✕</span></div>
      <div class="form-grid">
        <div class="form-group full"><label class="form-label">Customer Name</label><input class="form-input" type="text" placeholder="e.g. Jane Doe" v-model="fbForm.name"></div>
        <div class="form-group"><label class="form-label">Rating (1–5)</label><input class="form-input" type="number" min="1" max="5" placeholder="5" v-model="fbForm.rating"></div>
        <div class="form-group"><label class="form-label">Date</label><input class="form-input" type="date" v-model="fbForm.date"></div>
        <div class="form-group full"><label class="form-label">Review</label><textarea class="form-input" rows="3" placeholder="Write the customer's review here..." v-model="fbForm.text" style="resize:vertical"></textarea></div>
        <div v-if="fbErr" class="modal-error">{{ fbErr }}</div>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" type="button" @click="closeModal">Cancel</button>
        <button class="btn-save" type="button" :disabled="saving" @click="addFeedback">Add Review</button>
      </div>
    </div>
  </div>
</template>
