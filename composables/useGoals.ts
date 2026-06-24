import type { Database, Goal } from '~/types/database.types'

export const useGoals = () => {
  const supabase = useSupabaseClient<Database>()
  const goals    = ref<Goal[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value   = null
    const { data, error: err } = await supabase
      .from('goals')
      .select('*')
      .order('period_start', { ascending: false })
    loading.value = false
    if (err) { error.value = err.message; return }
    goals.value = data ?? []
  }

  async function fetchCurrent() {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error: err } = await supabase
      .from('goals')
      .select('*')
      .lte('period_start', today)
      .gte('period_end', today)
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (err) throw new Error(err.message)
    return data as Goal | null
  }

  async function create(payload: Database['public']['Tables']['goals']['Insert']) {
    const { data, error: err } = await supabase.from('goals').insert({ ...payload, user_id: useSupabaseUser().value?.id }).select().single()
    if (err) throw new Error(err.message)
    return data as Goal
  }

  async function update(id: string, payload: Database['public']['Tables']['goals']['Update']) {
    const { error: err } = await supabase.from('goals').update(payload).eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('goals').delete().eq('id', id)
    if (err) throw new Error(err.message)
  }

  return { goals, loading, error, fetchAll, fetchCurrent, create, update, remove }
}
