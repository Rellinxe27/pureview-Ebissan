import type { Database, Task } from '~/types/database.types'

export const useTasks = () => {
  const supabase = useSupabaseClient<Database>()
  const tasks    = ref<Task[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  async function fetchAll(includeCompleted = false) {
    loading.value = true
    error.value   = null
    let q = supabase.from('tasks').select('*').order('due_date', { nullsFirst: false }).order('created_at')
    if (!includeCompleted) q = q.is('completed_at', null)
    const { data, error: err } = await q
    loading.value = false
    if (err) { error.value = err.message; return }
    tasks.value = data ?? []
  }

  async function create(payload: Database['public']['Tables']['tasks']['Insert']) {
    const { data, error: err } = await supabase.from('tasks').insert({ ...payload, user_id: useSupabaseUser().value?.id }).select().single()
    if (err) throw new Error(err.message)
    return data as Task
  }

  async function complete(id: string) {
    const { error: err } = await supabase
      .from('tasks')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function uncomplete(id: string) {
    const { error: err } = await supabase.from('tasks').update({ completed_at: null }).eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function update(id: string, payload: Database['public']['Tables']['tasks']['Update']) {
    const { error: err } = await supabase.from('tasks').update(payload).eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('tasks').delete().eq('id', id)
    if (err) throw new Error(err.message)
  }

  return { tasks, loading, error, fetchAll, create, complete, uncomplete, update, remove }
}
