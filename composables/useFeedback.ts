import type { Database, Feedback } from '~/types/database.types'

export type FeedbackWithClient = Feedback & {
  clients: { name: string } | null
}

export const useFeedback = () => {
  const supabase  = useSupabaseClient<Database>()
  const feedback  = ref<FeedbackWithClient[]>([])
  const loading   = ref(false)
  const error     = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value   = null
    const { data, error: err } = await supabase
      .from('feedback')
      .select('*, clients(name)')
      .order('date', { ascending: false })
    loading.value = false
    if (err) { error.value = err.message; return }
    feedback.value = (data ?? []) as FeedbackWithClient[]
  }

  async function create(payload: Database['public']['Tables']['feedback']['Insert']) {
    const { data, error: err } = await supabase.from('feedback').insert({ ...payload, user_id: useSupabaseUser().value?.id }).select('*, clients(name)').single()
    if (err) throw new Error(err.message)
    return data as FeedbackWithClient
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('feedback').delete().eq('id', id)
    if (err) throw new Error(err.message)
  }

  const avgRating = computed(() =>
    feedback.value.length
      ? feedback.value.reduce((s, f) => s + (f.rating ?? 0), 0) / feedback.value.length
      : 0,
  )

  return { feedback, loading, error, avgRating, fetchAll, create, remove }
}
