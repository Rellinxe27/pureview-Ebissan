import type { Database, Client } from '~/types/database.types'

export const useClients = () => {
  const supabase = useSupabaseClient<Database>()
  const clients  = ref<Client[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value   = null
    const { data, error: err } = await supabase
      .from('clients')
      .select('*')
      .eq('is_active', true)
      .order('name')
    loading.value = false
    if (err) { error.value = err.message; return }
    clients.value = data ?? []
  }

  async function fetchOne(id: string) {
    const { data, error: err } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    if (err) throw new Error(err.message)
    return data as Client
  }

  async function create(payload: Database['public']['Tables']['clients']['Insert']) {
    const { data, error: err } = await supabase
      .from('clients')
      .insert({ ...payload, user_id: useSupabaseUser().value?.id })
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data as Client
  }

  async function update(id: string, payload: Database['public']['Tables']['clients']['Update']) {
    const { data, error: err } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data as Client
  }

  async function archive(id: string) {
    const { error: err } = await supabase
      .from('clients')
      .update({ is_active: false })
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  return { clients, loading, error, fetchAll, fetchOne, create, update, archive }
}
