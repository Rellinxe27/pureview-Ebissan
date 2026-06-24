import type { Database, Service } from '~/types/database.types'

export const useServices = () => {
  const supabase  = useSupabaseClient<Database>()
  const services  = ref<Service[]>([])
  const loading   = ref(false)

  async function fetchAll() {
    loading.value = true
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name')
    loading.value = false
    if (error) throw new Error(error.message)
    services.value = data ?? []
  }

  async function create(payload: Database['public']['Tables']['services']['Insert']) {
    const { data, error } = await supabase.from('services').insert({ ...payload, user_id: useSupabaseUser().value?.id }).select().single()
    if (error) throw new Error(error.message)
    return data as Service
  }

  async function update(id: string, payload: Database['public']['Tables']['services']['Update']) {
    const { data, error } = await supabase.from('services').update(payload).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data as Service
  }

  async function remove(id: string) {
    const { error } = await supabase.from('services').update({ is_active: false }).eq('id', id)
    if (error) throw new Error(error.message)
  }

  return { services, loading, fetchAll, create, update, remove }
}
