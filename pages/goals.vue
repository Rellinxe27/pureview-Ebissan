<script setup lang="ts">
import { Menu, Plus, Save, Target, Trash2 } from '@lucide/vue'
import type { Goal } from '~/types/database.types'

const { goals, loading, fetchAll, create, update, remove } = useGoals()
const { show: showToast } = useToast()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const showForm  = ref(false)
const saving    = ref(false)
const editing   = ref<Goal | null>(null)
const form      = reactive({
  period_type: 'monthly' as const, period_start: '', period_end: '',
  revenue_target: 25000, new_clients_target: 30, jobs_target: 60, satisfaction_target: 4.8,
})

onMounted(() => fetchAll())

function startEdit(g: Goal) {
  editing.value = g
  Object.assign(form, {
    period_type: g.period_type, period_start: g.period_start, period_end: g.period_end,
    revenue_target: g.revenue_target, new_clients_target: g.new_clients_target,
    jobs_target: g.jobs_target, satisfaction_target: g.satisfaction_target,
  })
  showForm.value = true
}

function cancelForm() { showForm.value = false; editing.value = null }

async function submit() {
  if (!form.period_start || !form.period_end) { showToast('Period start and end are required.'); return }
  saving.value = true
  try {
    if (editing.value) {
      await update(editing.value.id, {
        period_type: form.period_type, period_start: form.period_start, period_end: form.period_end,
        revenue_target: form.revenue_target, new_clients_target: form.new_clients_target,
        jobs_target: form.jobs_target, satisfaction_target: form.satisfaction_target,
      })
      showToast('Goal updated!')
    } else {
      await create({
        period_type: form.period_type, period_start: form.period_start, period_end: form.period_end,
        revenue_target: form.revenue_target, new_clients_target: form.new_clients_target,
        jobs_target: form.jobs_target, satisfaction_target: form.satisfaction_target,
      })
      showToast('Goal created!')
    }
    await fetchAll()
    cancelForm()
  } catch (e: any) { showToast(e.message) } finally { saving.value = false }
}

async function del(id: string) {
  if (!confirm('Delete this goal?')) return
  try { await remove(id); await fetchAll(); showToast('Goal deleted.') } catch (e: any) { showToast(e.message) }
}
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <h1><Target style="display:inline;width:20px;height:20px;margin-right:6px;vertical-align:middle" />Goals</h1>
        <p>Set and track business performance targets.</p>
      </div>
    </div>
    <div class="header-actions">
      <button class="primary-action" type="button" @click="showForm = !showForm"><Plus /> {{ editing ? 'Edit Goal' : 'New Goal' }}</button>
    </div>
  </header>

  <section class="content">
    <div v-if="showForm" class="form-card" style="margin-bottom:24px">
      <h3 style="margin-bottom:16px">{{ editing ? 'Edit Goal' : 'New Goal' }}</h3>
      <form class="form-grid" @submit.prevent="submit">
        <div class="field">
          <label>Period Type</label>
          <select v-model="form.period_type">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div class="field">
          <label>Start Date <span class="required">*</span></label>
          <input v-model="form.period_start" type="date" required />
        </div>
        <div class="field">
          <label>End Date <span class="required">*</span></label>
          <input v-model="form.period_end" type="date" required />
        </div>
        <div class="field">
          <label>Revenue Target ($)</label>
          <input v-model.number="form.revenue_target" type="number" min="0" step="100" />
        </div>
        <div class="field">
          <label>New Clients Target</label>
          <input v-model.number="form.new_clients_target" type="number" min="0" />
        </div>
        <div class="field">
          <label>Jobs Target</label>
          <input v-model.number="form.jobs_target" type="number" min="0" />
        </div>
        <div class="field">
          <label>Satisfaction Target (1–5)</label>
          <input v-model.number="form.satisfaction_target" type="number" min="1" max="5" step="0.1" />
        </div>
        <div class="form-actions field-full">
          <button type="button" class="outline-action" @click="cancelForm">Cancel</button>
          <button type="submit" class="primary-action" :disabled="saving"><Save /> {{ saving ? 'Saving…' : 'Save Goal' }}</button>
        </div>
      </form>
    </div>

    <SkeletonTable v-if="loading" :cols="7" />
    <div v-else-if="!goals.length" class="empty-state">
      <Target style="width:48px;height:48px;opacity:.3;margin-bottom:12px" />
      <p>No goals yet. Set your first target!</p>
    </div>
    <div v-else class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Period</th><th>Type</th>
            <th>Revenue Target</th><th>New Clients</th><th>Jobs</th><th>Satisfaction</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in goals" :key="g.id">
            <td>{{ g.period_start }} – {{ g.period_end }}</td>
            <td><span class="pill">{{ g.period_type }}</span></td>
            <td>${{ g.revenue_target.toLocaleString() }}</td>
            <td>{{ g.new_clients_target }}</td>
            <td>{{ g.jobs_target }}</td>
            <td>{{ g.satisfaction_target }} / 5</td>
            <td style="display:flex;gap:6px">
              <button class="row-action" type="button" @click="startEdit(g)">Edit</button>
              <button class="icon-btn" type="button" @click="del(g.id)"><Trash2 style="width:15px;height:15px" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
