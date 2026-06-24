import type { Database, Appointment } from '~/types/database.types'

export type AppointmentWithRefs = Appointment & {
  clients:  { name: string; phone: string | null } | null
  services: { name: string; color: string } | null
}

export const useAppointments = () => {
  const supabase     = useSupabaseClient<Database>()
  const appointments = ref<AppointmentWithRefs[]>([])
  const loading      = ref(false)
  const error        = ref<string | null>(null)

  async function fetchAll(from?: string, to?: string) {
    loading.value = true
    error.value   = null
    let q = supabase
      .from('appointments')
      .select('*, clients(name, phone), services(name, color)')
      .order('scheduled_at', { ascending: false })
    if (from) q = q.gte('scheduled_at', from)
    if (to)   q = q.lte('scheduled_at', to)
    const { data, error: err } = await q
    loading.value = false
    if (err) { error.value = err.message; return }
    appointments.value = (data ?? []) as AppointmentWithRefs[]
  }

  async function fetchUpcoming(limit = 10) {
    loading.value = true
    const now = new Date().toISOString()
    const { data, error: err } = await supabase
      .from('appointments')
      .select('*, clients(name, phone), services(name, color)')
      .gte('scheduled_at', now)
      .in('status', ['pending', 'confirmed'])
      .order('scheduled_at')
      .limit(limit)
    loading.value = false
    if (err) throw new Error(err.message)
    appointments.value = (data ?? []) as AppointmentWithRefs[]
    return appointments.value
  }

  async function fetchOne(id: string) {
    const { data, error: err } = await supabase
      .from('appointments')
      .select('*, clients(name, phone), services(name, color)')
      .eq('id', id)
      .single()
    if (err) throw new Error(err.message)
    return data as AppointmentWithRefs
  }

  async function create(payload: Database['public']['Tables']['appointments']['Insert']) {
    const { data, error: err } = await supabase
      .from('appointments')
      .insert({ ...payload, user_id: useSupabaseUser().value?.id })
      .select('*, clients(name, phone), services(name, color)')
      .single()
    if (err) throw new Error(err.message)
    return data as AppointmentWithRefs
  }

  async function update(id: string, payload: Database['public']['Tables']['appointments']['Update']) {
    const { data, error: err } = await supabase
      .from('appointments')
      .update(payload)
      .eq('id', id)
      .select('*, clients(name, phone), services(name, color)')
      .single()
    if (err) throw new Error(err.message)
    return data as AppointmentWithRefs
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('appointments').delete().eq('id', id)
    if (err) throw new Error(err.message)
  }

  return { appointments, loading, error, fetchAll, fetchUpcoming, fetchOne, create, update, remove }
}
