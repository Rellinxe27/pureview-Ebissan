export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          notes?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          base_price: number
          color: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          description?: string | null
          base_price?: number
          color?: string
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          base_price?: number
          color?: string
          is_active?: boolean
        }
      }
      appointments: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          service_id: string | null
          scheduled_at: string
          duration_minutes: number
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          address: string | null
          notes: string | null
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          client_id?: string | null
          service_id?: string | null
          scheduled_at: string
          duration_minutes?: number
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          address?: string | null
          notes?: string | null
          price?: number
        }
        Update: {
          client_id?: string | null
          service_id?: string | null
          scheduled_at?: string
          duration_minutes?: number
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          address?: string | null
          notes?: string | null
          price?: number
          updated_at?: string
        }
      }
      recurring_services: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          service_id: string | null
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
          next_scheduled_at: string | null
          price: number
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          client_id?: string | null
          service_id?: string | null
          frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
          next_scheduled_at?: string | null
          price?: number
          is_active?: boolean
          notes?: string | null
        }
        Update: {
          client_id?: string | null
          service_id?: string | null
          frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
          next_scheduled_at?: string | null
          price?: number
          is_active?: boolean
          notes?: string | null
        }
      }
      quotes: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          quote_number: string
          title: string
          status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'
          subtotal: number
          tax_rate: number
          tax_amount: number
          total_amount: number
          valid_until: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          client_id?: string | null
          quote_number: string
          title: string
          status?: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          valid_until?: string | null
          notes?: string | null
        }
        Update: {
          client_id?: string | null
          title?: string
          status?: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          valid_until?: string | null
          notes?: string | null
        }
      }
      quote_items: {
        Row: {
          id: string
          quote_id: string
          description: string
          quantity: number
          unit_price: number
          total: number
        }
        Insert: {
          id?: string
          quote_id: string
          description: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          description?: string
          quantity?: number
          unit_price?: number
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          appointment_id: string | null
          invoice_number: string
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          subtotal: number
          tax_rate: number
          tax_amount: number
          total_amount: number
          due_date: string | null
          paid_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          client_id?: string | null
          appointment_id?: string | null
          invoice_number: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          due_date?: string | null
          paid_at?: string | null
          notes?: string | null
        }
        Update: {
          client_id?: string | null
          appointment_id?: string | null
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          due_date?: string | null
          paid_at?: string | null
          notes?: string | null
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          total: number
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          description?: string
          quantity?: number
          unit_price?: number
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          invoice_id: string | null
          client_id: string | null
          amount: number
          payment_method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'other'
          reference: string | null
          paid_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          invoice_id?: string | null
          client_id?: string | null
          amount: number
          payment_method?: 'cash' | 'card' | 'bank_transfer' | 'check' | 'other'
          reference?: string | null
          paid_at?: string
          notes?: string | null
        }
        Update: {
          amount?: number
          payment_method?: 'cash' | 'card' | 'bank_transfer' | 'check' | 'other'
          reference?: string | null
          paid_at?: string
          notes?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          category: 'supplies' | 'fuel' | 'equipment' | 'marketing' | 'insurance' | 'wages' | 'other'
          description: string
          amount: number
          date: string
          receipt_url: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          category?: 'supplies' | 'fuel' | 'equipment' | 'marketing' | 'insurance' | 'wages' | 'other'
          description: string
          amount: number
          date?: string
          receipt_url?: string | null
          notes?: string | null
        }
        Update: {
          category?: 'supplies' | 'fuel' | 'equipment' | 'marketing' | 'insurance' | 'wages' | 'other'
          description?: string
          amount?: number
          date?: string
          receipt_url?: string | null
          notes?: string | null
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          period_type: 'monthly' | 'quarterly' | 'yearly'
          period_start: string
          period_end: string
          revenue_target: number
          new_clients_target: number
          jobs_target: number
          satisfaction_target: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          period_type?: 'monthly' | 'quarterly' | 'yearly'
          period_start: string
          period_end: string
          revenue_target?: number
          new_clients_target?: number
          jobs_target?: number
          satisfaction_target?: number
        }
        Update: {
          period_type?: 'monthly' | 'quarterly' | 'yearly'
          period_start?: string
          period_end?: string
          revenue_target?: number
          new_clients_target?: number
          jobs_target?: number
          satisfaction_target?: number
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          due_date: string | null
          priority: 'low' | 'medium' | 'high'
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          description?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          completed_at?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          completed_at?: string | null
        }
      }
      feedback: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          appointment_id: string | null
          rating: number | null
          comment: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          client_id?: string | null
          appointment_id?: string | null
          rating?: number | null
          comment?: string | null
          date?: string
        }
        Update: {
          client_id?: string | null
          appointment_id?: string | null
          rating?: number | null
          comment?: string | null
          date?: string
        }
      }
      team_members: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          email?: string | null
          phone?: string | null
          role?: string
          is_active?: boolean
        }
        Update: {
          name?: string
          email?: string | null
          phone?: string | null
          role?: string
          is_active?: boolean
        }
      }
      settings: {
        Row: {
          id: string
          user_id: string
          business_name: string
          owner_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          logo_url: string | null
          invoice_prefix: string
          next_invoice_number: number
          quote_prefix: string
          next_quote_number: number
          tax_rate: number
          currency: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          business_name?: string
          owner_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          logo_url?: string | null
          invoice_prefix?: string
          next_invoice_number?: number
          quote_prefix?: string
          next_quote_number?: number
          tax_rate?: number
          currency?: string
          timezone?: string
        }
        Update: {
          business_name?: string
          owner_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          logo_url?: string | null
          invoice_prefix?: string
          next_invoice_number?: number
          quote_prefix?: string
          next_quote_number?: number
          tax_rate?: number
          currency?: string
          timezone?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience row types
export type Client        = Database['public']['Tables']['clients']['Row']
export type Service       = Database['public']['Tables']['services']['Row']
export type Appointment   = Database['public']['Tables']['appointments']['Row']
export type Recurring     = Database['public']['Tables']['recurring_services']['Row']
export type Quote         = Database['public']['Tables']['quotes']['Row']
export type QuoteItem     = Database['public']['Tables']['quote_items']['Row']
export type Invoice       = Database['public']['Tables']['invoices']['Row']
export type InvoiceItem   = Database['public']['Tables']['invoice_items']['Row']
export type Payment       = Database['public']['Tables']['payments']['Row']
export type Expense       = Database['public']['Tables']['expenses']['Row']
export type Goal          = Database['public']['Tables']['goals']['Row']
export type Task          = Database['public']['Tables']['tasks']['Row']
export type Feedback      = Database['public']['Tables']['feedback']['Row']
export type TeamMember    = Database['public']['Tables']['team_members']['Row']
export type Settings      = Database['public']['Tables']['settings']['Row']
