import type { Database, Recurring } from '~/types/database.types'

export type RecurringWithRefs = Recurring & {
  clients:  { name: string } | null
  services: { name: string; color: string } | null
}

export const useRecurring = () => {
  const supabase  = useSupabaseClient<Database>()
  const recurring = ref<RecurringWithRefs[]>([])
  const loading   = ref(false)
  const error     = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value   = null
    const { data, error: err } = await supabase
      .from('recurring_services')
      .select('*, clients(name), services(name, color)')
      .order('next_scheduled_at')
    loading.value = false
    if (err) { error.value = err.message; return }
    recurring.value = (data ?? []) as RecurringWithRefs[]
  }

  async function create(payload: Database['public']['Tables']['recurring_services']['Insert']) {
    const { data, error: err } = await supabase
      .from('recurring_services')
      .insert({ ...payload, user_id: useSupabaseUser().value?.id })
      .select('*, clients(name), services(name, color)')
      .single()
    if (err) throw new Error(err.message)
    return data as RecurringWithRefs
  }

  async function update(id: string, payload: Database['public']['Tables']['recurring_services']['Update']) {
    const { error: err } = await supabase.from('recurring_services').update(payload).eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('recurring_services').delete().eq('id', id)
    if (err) throw new Error(err.message)
  }

  return { recurring, loading, error, fetchAll, create, update, remove }
}
