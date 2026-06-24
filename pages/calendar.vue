<script setup lang="ts">
import { CalendarDays, ChevronLeft, ChevronRight, Menu, Plus } from '@lucide/vue'
import type { AppointmentWithRefs } from '~/composables/useAppointments'

const router = useRouter()
const { appointments, fetchAll } = useAppointments()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const today  = new Date()
const year   = ref(today.getFullYear())
const month  = ref(today.getMonth())

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

const firstDay  = computed(() => new Date(year.value, month.value, 1).getDay())
const daysInMonth = computed(() => new Date(year.value, month.value + 1, 0).getDate())

function prev() { if (month.value === 0) { month.value = 11; year.value-- } else month.value-- }
function next() { if (month.value === 11) { month.value = 0; year.value++ } else month.value++ }

watch([year, month], loadMonth, { immediate: true })

function loadMonth() {
  const from = new Date(year.value, month.value, 1).toISOString()
  const to   = new Date(year.value, month.value + 1, 0, 23, 59, 59).toISOString()
  fetchAll(from, to)
}

function apptsByDay(day: number) {
  const d = String(day).padStart(2, '0')
  const m = String(month.value + 1).padStart(2, '0')
  const prefix = `${year.value}-${m}-${d}`
  return appointments.value.filter(a => a.scheduled_at.startsWith(prefix))
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function isToday(day: number) {
  return day === today.getDate() && month.value === today.getMonth() && year.value === today.getFullYear()
}

const statusColor: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#4167e8', completed: '#22c55e', cancelled: '#ef4444', in_progress: '#8b5cf6',
}
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <h1><CalendarDays style="display:inline;width:20px;height:20px;margin-right:6px;vertical-align:middle" />Calendar</h1>
        <p>{{ monthNames[month] }} {{ year }}</p>
      </div>
    </div>
    <div class="header-actions">
      <button class="outline-action" type="button" @click="prev"><ChevronLeft /></button>
      <button class="outline-action" type="button" @click="next"><ChevronRight /></button>
      <button class="primary-action" type="button" @click="router.push('/appointments/new')"><Plus /> New Appointment</button>
    </div>
  </header>

  <section class="content">
    <div class="calendar-grid">
      <div class="cal-header">
        <span v-for="d in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" :key="d">{{ d }}</span>
      </div>
      <div class="cal-body">
        <!-- Empty cells before first day -->
        <div v-for="n in firstDay" :key="`e${n}`" class="cal-cell empty"></div>
        <!-- Day cells -->
        <div
          v-for="day in daysInMonth"
          :key="day"
          class="cal-cell"
          :class="{ today: isToday(day) }"
        >
          <span class="cal-day-num">{{ day }}</span>
          <div class="cal-events">
            <button
              v-for="a in apptsByDay(day)"
              :key="a.id"
              type="button"
              class="cal-event"
              :style="{ borderLeftColor: statusColor[a.status] ?? '#4167e8' }"
              @click="router.push(`/appointments/${a.id}`)"
            >
              <strong>{{ timeOf(a.scheduled_at) }}</strong>
              <span>{{ a.clients?.name ?? 'Client' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
