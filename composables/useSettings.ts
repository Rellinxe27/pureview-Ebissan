import type { Database, Settings } from '~/types/database.types'

export const useSettings = () => {
  const supabase  = useSupabaseClient<Database>()
  const settings  = ref<Settings | null>(null)
  const loading   = ref(false)
  const error     = ref<string | null>(null)

  async function fetch() {
    loading.value = true
    error.value   = null
    const { data, error: err } = await supabase.from('settings').select('*').single()
    loading.value = false
    if (err && err.code !== 'PGRST116') { error.value = err.message; return }
    settings.value = data as Settings | null
  }

  async function save(payload: Database['public']['Tables']['settings']['Update']) {
    if (!settings.value) return
    const { data, error: err } = await supabase
      .from('settings')
      .update(payload)
      .eq('id', settings.value.id)
      .select()
      .single()
    if (err) throw new Error(err.message)
    settings.value = data as Settings
    return data as Settings
  }

  return { settings, loading, error, fetch, save }
}
