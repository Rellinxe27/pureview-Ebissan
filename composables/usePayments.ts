import type { Database, Payment } from '~/types/database.types'

export type PaymentWithRefs = Payment & {
  clients:  { name: string } | null
  invoices: { invoice_number: string } | null
}

export const usePayments = () => {
  const supabase  = useSupabaseClient<Database>()
  const payments  = ref<PaymentWithRefs[]>([])
  const loading   = ref(false)
  const error     = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value   = null
    const { data, error: err } = await supabase
      .from('payments')
      .select('*, clients(name), invoices(invoice_number)')
      .order('paid_at', { ascending: false })
    loading.value = false
    if (err) { error.value = err.message; return }
    payments.value = (data ?? []) as PaymentWithRefs[]
  }

  async function create(payload: Database['public']['Tables']['payments']['Insert']) {
    const { data, error: err } = await supabase
      .from('payments')
      .insert({ ...payload, user_id: useSupabaseUser().value?.id })
      .select('*, clients(name), invoices(invoice_number)')
      .single()
    if (err) throw new Error(err.message)
    return data as PaymentWithRefs
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('payments').delete().eq('id', id)
    if (err) throw new Error(err.message)
  }

  return { payments, loading, error, fetchAll, create, remove }
}
