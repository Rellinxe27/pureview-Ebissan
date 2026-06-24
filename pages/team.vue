<script setup lang="ts">
import { Menu, Plus, Save, Trash2, Users } from '@lucide/vue'
import type { TeamMember } from '~/types/database.types'

const { members, loading, fetchAll, create, toggle, remove } = useTeam()
const { show: showToast } = useToast()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const showForm  = ref(false)
const saving    = ref(false)
const formError = ref('')
const form      = reactive({ name: '', email: '', phone: '', role: 'technician' })

onMounted(() => fetchAll())

async function submit() {
  if (!form.name.trim()) { formError.value = 'Name is required.'; return }
  formError.value = ''
  saving.value    = true
  try {
    await create({ name: form.name.trim(), email: form.email || null, phone: form.phone || null, role: form.role })
    showToast('Team member added!')
    showForm.value = false
    Object.assign(form, { name: '', email: '', phone: '', role: 'technician' })
    await fetchAll()
  } catch (e: any) { formError.value = e.message } finally { saving.value = false }
}

async function del(id: string) {
  if (!confirm('Remove this team member?')) return
  try { await remove(id); await fetchAll(); showToast('Removed.') } catch (e: any) { showToast(e.message) }
}

async function toggleActive(m: TeamMember) {
  try { await toggle(m.id, !m.is_active); await fetchAll() } catch (e: any) { showToast(e.message) }
}
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <h1><Users style="display:inline;width:20px;height:20px;margin-right:6px;vertical-align:middle" />Team</h1>
        <p>{{ members.filter(m => m.is_active).length }} active team member{{ members.filter(m => m.is_active).length !== 1 ? 's' : '' }}</p>
      </div>
    </div>
    <div class="header-actions">
      <button class="primary-action" type="button" @click="showForm = !showForm"><Plus /> Add Member</button>
    </div>
  </header>

  <section class="content">
    <div v-if="showForm" class="form-card" style="margin-bottom:24px">
      <h3 style="margin-bottom:16px">Add Team Member</h3>
      <form class="form-grid" @submit.prevent="submit">
        <div class="field field-full">
          <label>Name <span class="required">*</span></label>
          <input v-model="form.name" type="text" required />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="form.email" type="email" />
        </div>
        <div class="field">
          <label>Phone</label>
          <input v-model="form.phone" type="tel" />
        </div>
        <div class="field">
          <label>Role</label>
          <input v-model="form.role" type="text" placeholder="Technician, Manager…" />
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="form-actions">
          <button type="button" class="outline-action" @click="showForm = false">Cancel</button>
          <button type="submit" class="primary-action" :disabled="saving"><Save /> {{ saving ? 'Saving…' : 'Add Member' }}</button>
        </div>
      </form>
    </div>

    <SkeletonCards v-if="loading" />
    <div v-else-if="!members.length" class="empty-state">
      <Users style="width:48px;height:48px;opacity:.3;margin-bottom:12px" />
      <p>No team members yet.</p>
    </div>
    <div v-else class="client-grid">
      <article v-for="m in members" :key="m.id" class="client-card" :class="{ 'inactive-card': !m.is_active }">
        <div class="client-avatar" :style="{ background: m.is_active ? '' : '#94a3b8' }">{{ m.name[0].toUpperCase() }}</div>
        <div class="client-info">
          <strong>{{ m.name }}</strong>
          <span class="pill">{{ m.role }}</span>
          <span v-if="m.email">{{ m.email }}</span>
          <span v-if="m.phone">{{ m.phone }}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-left:auto">
          <button class="row-action" type="button" @click="toggleActive(m)">{{ m.is_active ? 'Deactivate' : 'Activate' }}</button>
          <button class="icon-btn" type="button" @click="del(m.id)"><Trash2 style="width:15px;height:15px" /></button>
        </div>
      </article>
    </div>
  </section>
</template>
