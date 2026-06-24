import type { Database, Expense } from '~/types/database.types'

export const useExpenses = () => {
  const supabase = useSupabaseClient<Database>()
  const expenses = ref<Expense[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  async function fetchAll(from?: string, to?: string) {
    loading.value = true
    error.value   = null
    let q = supabase.from('expenses').select('*').order('date', { ascending: false })
    if (from) q = q.gte('date', from)
    if (to)   q = q.lte('date', to)
    const { data, error: err } = await q
    loading.value = false
    if (err) { error.value = err.message; return }
    expenses.value = data ?? []
  }

  async function create(payload: Database['public']['Tables']['expenses']['Insert']) {
    const { data, error: err } = await supabase.from('expenses').insert({ ...payload, user_id: useSupabaseUser().value?.id }).select().single()
    if (err) throw new Error(err.message)
    return data as Expense
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('expenses').delete().eq('id', id)
    if (err) throw new Error(err.message)
  }

  return { expenses, loading, error, fetchAll, create, remove }
}
