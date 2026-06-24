import type { Database, TeamMember } from '~/types/database.types'

export const useTeam = () => {
  const supabase = useSupabaseClient<Database>()
  const members  = ref<TeamMember[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value   = null
    const { data, error: err } = await supabase
      .from('team_members')
      .select('*')
      .order('name')
    loading.value = false
    if (err) { error.value = err.message; return }
    members.value = data ?? []
  }

  async function create(payload: Database['public']['Tables']['team_members']['Insert']) {
    const { data, error: err } = await supabase.from('team_members').insert({ ...payload, user_id: useSupabaseUser().value?.id }).select().single()
    if (err) throw new Error(err.message)
    return data as TeamMember
  }

  async function update(id: string, payload: Database['public']['Tables']['team_members']['Update']) {
    const { error: err } = await supabase.from('team_members').update(payload).eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function toggle(id: string, is_active: boolean) {
    const { error: err } = await supabase.from('team_members').update({ is_active }).eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('team_members').delete().eq('id', id)
    if (err) throw new Error(err.message)
  }

  return { members, loading, error, fetchAll, create, update, toggle, remove }
}
