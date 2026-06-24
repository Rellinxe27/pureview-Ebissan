import type { Database, Quote } from '~/types/database.types'

export type QuoteWithClient = Quote & {
  clients: { name: string; email: string | null } | null
}

export const useQuotes = () => {
  const supabase = useSupabaseClient<Database>()
  const quotes   = ref<QuoteWithClient[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  async function fetchAll(status?: string) {
    loading.value = true
    error.value   = null
    let q = supabase
      .from('quotes')
      .select('*, clients(name, email)')
      .order('created_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data, error: err } = await q
    loading.value = false
    if (err) { error.value = err.message; return }
    quotes.value = (data ?? []) as QuoteWithClient[]
  }

  async function fetchOne(id: string) {
    const { data, error: err } = await supabase
      .from('quotes')
      .select('*, clients(name, email, address, city, state, zip), quote_items(*)')
      .eq('id', id)
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  async function nextNumber() {
    const { data } = await supabase
      .from('settings')
      .select('quote_prefix, next_quote_number')
      .single()
    const prefix = data?.quote_prefix ?? 'QUO'
    const num    = data?.next_quote_number ?? 1001
    return `${prefix}-${num}`
  }

  async function create(
    payload: Database['public']['Tables']['quotes']['Insert'],
    items:   Database['public']['Tables']['quote_items']['Insert'][],
  ) {
    const { data: q, error: err } = await supabase
      .from('quotes')
      .insert({ ...payload, user_id: useSupabaseUser().value?.id })
      .select()
      .single()
    if (err) throw new Error(err.message)
    if (items.length) {
      const lineItems = items.map(i => ({ ...i, quote_id: q!.id }))
      const { error: ie } = await supabase.from('quote_items').insert(lineItems)
      if (ie) throw new Error(ie.message)
    }
    return q as Quote
  }

  async function updateStatus(id: string, status: Quote['status']) {
    const { error: err } = await supabase.from('quotes').update({ status }).eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('quotes').delete().eq('id', id)
    if (err) throw new Error(err.message)
  }

  return { quotes, loading, error, fetchAll, fetchOne, nextNumber, create, updateStatus, remove }
}
