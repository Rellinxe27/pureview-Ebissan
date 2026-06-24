import type { Database, Invoice, InvoiceItem } from '~/types/database.types'

export type InvoiceWithClient = Invoice & {
  clients: { name: string; email: string | null } | null
}

export const useInvoices = () => {
  const supabase = useSupabaseClient<Database>()
  const invoices = ref<InvoiceWithClient[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  async function fetchAll(status?: string) {
    loading.value = true
    error.value   = null
    let q = supabase
      .from('invoices')
      .select('*, clients(name, email)')
      .order('created_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data, error: err } = await q
    loading.value = false
    if (err) { error.value = err.message; return }
    invoices.value = (data ?? []) as InvoiceWithClient[]
  }

  async function fetchOne(id: string) {
    const { data, error: err } = await supabase
      .from('invoices')
      .select('*, clients(name, email, address, city, state, zip), invoice_items(*)')
      .eq('id', id)
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  async function nextNumber() {
    const { data } = await supabase
      .from('settings')
      .select('invoice_prefix, next_invoice_number')
      .single()
    const prefix = data?.invoice_prefix ?? 'INV'
    const num    = data?.next_invoice_number ?? 1001
    return `${prefix}-${num}`
  }

  async function create(
    payload: Database['public']['Tables']['invoices']['Insert'],
    items:   Database['public']['Tables']['invoice_items']['Insert'][],
  ) {
    const { data: inv, error: err } = await supabase
      .from('invoices')
      .insert({ ...payload, user_id: useSupabaseUser().value?.id })
      .select()
      .single()
    if (err) throw new Error(err.message)

    if (items.length) {
      const lineItems = items.map(i => ({ ...i, invoice_id: inv!.id }))
      const { error: ie } = await supabase.from('invoice_items').insert(lineItems)
      if (ie) throw new Error(ie.message)
    }

    // Bump counter
    await supabase.rpc('increment_invoice_number' as never)
    return inv as Invoice
  }

  async function updateStatus(id: string, status: Invoice['status'], paid_at?: string) {
    const { error: err } = await supabase
      .from('invoices')
      .update({ status, ...(paid_at ? { paid_at } : {}) })
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('invoices').delete().eq('id', id)
    if (err) throw new Error(err.message)
  }

  return { invoices, loading, error, fetchAll, fetchOne, nextNumber, create, updateStatus, remove }
}
