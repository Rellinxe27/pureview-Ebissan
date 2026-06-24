import type { Database } from '~/types/database.types'

export interface DashboardData {
  wc: number
  sr: number
  expenses: number
  totalRevenue: number
  netProfit: number
  newClients: number
  recClients: number
  jobsCompleted: number
  clientsThisWeek: number
  monthly: number[]
  trend: { labels: string[]; total: number[]; wc: number[]; sr: number[] }
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function emptyData(): DashboardData {
  return {
    wc: 0, sr: 0, expenses: 0, totalRevenue: 0, netProfit: 0,
    newClients: 0, recClients: 0, jobsCompleted: 0, clientsThisWeek: 0,
    monthly: Array(12).fill(0),
    trend: { labels: [], total: [], wc: [], sr: [] },
  }
}

function isScreen(name?: string | null) { return !!name && name.toLowerCase().includes('screen') }
function isWindow(name?: string | null) { return !!name && name.toLowerCase().includes('window') }

export const useDashboard = () => {
  const supabase = useSupabaseClient<Database>()
  const stats    = ref<DashboardData>(emptyData())
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  async function fetchDashboard(from: string, to: string, year: number) {
    loading.value = true
    error.value   = null

    const fromMs = new Date(from).getTime()
    const toMs   = new Date(to).getTime()
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const yearStart = new Date(year, 0, 1).toISOString()
    const yearEnd   = new Date(year, 11, 31, 23, 59, 59).toISOString()

    const [apptRes, expRes, clientsRes, weekClientsRes, recurRes, yearApptRes] = await Promise.all([
      supabase.from('appointments')
        .select('price, scheduled_at, services(name)')
        .eq('status', 'completed')
        .gte('scheduled_at', from).lte('scheduled_at', to),
      supabase.from('expenses').select('amount').gte('date', from.slice(0, 10)).lte('date', to.slice(0, 10)),
      supabase.from('clients').select('id').gte('created_at', from).lte('created_at', to),
      supabase.from('clients').select('id').gte('created_at', weekAgo),
      supabase.from('recurring_services').select('client_id').eq('is_active', true),
      supabase.from('appointments')
        .select('price, scheduled_at')
        .eq('status', 'completed')
        .gte('scheduled_at', yearStart).lte('scheduled_at', yearEnd),
    ])

    loading.value = false

    const firstErr = apptRes.error || expRes.error || clientsRes.error || recurRes.error || yearApptRes.error
    if (firstErr) { error.value = firstErr.message; return }

    const appts = (apptRes.data ?? []) as Array<{ price: number; scheduled_at: string; services: { name: string } | null }>

    // Revenue by service
    let wc = 0, sr = 0
    for (const a of appts) {
      if (isScreen(a.services?.name)) sr += a.price
      else if (isWindow(a.services?.name)) wc += a.price
      else wc += a.price // default uncategorised to window cleaning bucket
    }

    const expenses    = (expRes.data ?? []).reduce((s, e) => s + (e.amount ?? 0), 0)
    const totalRevenue = wc + sr
    const netProfit   = totalRevenue - expenses
    const newClients  = (clientsRes.data ?? []).length
    const clientsThisWeek = (weekClientsRes.data ?? []).length
    const jobsCompleted   = appts.length
    const recClients  = new Set((recurRes.data ?? []).map(r => r.client_id).filter(Boolean)).size

    // 5 equal-width trend buckets across [from,to]
    const buckets = 5
    const span    = Math.max(1, toMs - fromMs)
    const trendTotal = Array(buckets).fill(0)
    const trendWc    = Array(buckets).fill(0)
    const trendSr    = Array(buckets).fill(0)
    const labels: string[] = []
    for (let i = 0; i < buckets; i++) {
      const d = new Date(fromMs + (span / buckets) * i)
      labels.push(`${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`)
    }
    for (const a of appts) {
      const t = new Date(a.scheduled_at).getTime()
      let idx = Math.floor(((t - fromMs) / span) * buckets)
      if (idx < 0) idx = 0
      if (idx >= buckets) idx = buckets - 1
      trendTotal[idx] += a.price
      if (isScreen(a.services?.name)) trendSr[idx] += a.price
      else trendWc[idx] += a.price
    }

    // Monthly bar (current year)
    const monthly = Array(12).fill(0)
    for (const a of (yearApptRes.data ?? []) as Array<{ price: number; scheduled_at: string }>) {
      monthly[new Date(a.scheduled_at).getMonth()] += a.price
    }

    stats.value = {
      wc, sr, expenses, totalRevenue, netProfit,
      newClients, recClients, jobsCompleted, clientsThisWeek,
      monthly,
      trend: { labels, total: trendTotal, wc: trendWc, sr: trendSr },
    }
  }

  return { stats, loading, error, fetchDashboard }
}
