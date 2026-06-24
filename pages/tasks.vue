<script setup lang="ts">
import { CheckCircle, Circle, CircleCheck, Menu, Plus, Trash2 } from '@lucide/vue'
import type { Task } from '~/types/database.types'

const { tasks, loading, error, fetchAll, create, complete, uncomplete, remove } = useTasks()
const { show: showToast } = useToast()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const showCompleted = ref(false)
const showForm = ref(false)
const saving   = ref(false)
const form = reactive({ title: '', description: '', due_date: '', priority: 'medium' as const })

onMounted(() => fetchAll(false))

watch(showCompleted, (v) => fetchAll(v))

const priorityOrder = { high: 0, medium: 1, low: 2 }
const sorted = computed(() =>
  [...tasks.value].sort((a, b) =>
    (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1),
  ),
)

async function submitTask() {
  if (!form.title.trim()) return
  saving.value = true
  try {
    await create({ title: form.title.trim(), description: form.description || null, due_date: form.due_date || null, priority: form.priority })
    showToast('Task added!')
    showForm.value = false
    Object.assign(form, { title: '', description: '', due_date: '', priority: 'medium' })
    await fetchAll(showCompleted.value)
  } catch (e: any) { showToast(e.message) } finally { saving.value = false }
}

async function toggleTask(t: Task) {
  try {
    if (t.completed_at) await uncomplete(t.id)
    else                await complete(t.id)
    await fetchAll(showCompleted.value)
  } catch (e: any) { showToast(e.message) }
}

async function del(id: string) {
  try { await remove(id); await fetchAll(showCompleted.value) } catch (e: any) { showToast(e.message) }
}

const priorityClass = { high: 'pill orange', medium: 'pill purple', low: 'pill' }
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <h1><CircleCheck style="display:inline;width:20px;height:20px;margin-right:6px;vertical-align:middle" />Tasks</h1>
        <p>{{ tasks.filter(t => !t.completed_at).length }} open task{{ tasks.filter(t => !t.completed_at).length !== 1 ? 's' : '' }}</p>
      </div>
    </div>
    <div class="header-actions">
      <label class="toggle-label">
        <input v-model="showCompleted" type="checkbox" /> Show completed
      </label>
      <button class="primary-action" type="button" @click="showForm = !showForm"><Plus /> Add Task</button>
    </div>
  </header>

  <section class="content">
    <div v-if="showForm" class="form-card" style="margin-bottom:24px">
      <form class="form-grid" @submit.prevent="submitTask">
        <div class="field field-full">
          <label>Title <span class="required">*</span></label>
          <input v-model="form.title" type="text" placeholder="What needs to be done?" required />
        </div>
        <div class="field">
          <label>Due Date</label>
          <input v-model="form.due_date" type="date" />
        </div>
        <div class="field">
          <label>Priority</label>
          <select v-model="form.priority">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div class="field field-full">
          <label>Notes</label>
          <textarea v-model="form.description" rows="2"></textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="outline-action" @click="showForm = false">Cancel</button>
          <button type="submit" class="primary-action" :disabled="saving">{{ saving ? 'Adding…' : 'Add Task' }}</button>
        </div>
      </form>
    </div>

    <div v-if="loading" class="task-list">
      <div v-for="n in 5" :key="n" class="task-item">
        <Skeleton w="22px" h="22px" circle />
        <div class="task-body" style="display:flex;flex-direction:column;gap:6px"><Skeleton w="45%" h="13px" /><Skeleton w="28%" h="10px" /></div>
        <Skeleton w="52px" h="20px" radius="99px" />
      </div>
    </div>
    <div v-else-if="!sorted.length" class="empty-state">
      <CircleCheck style="width:48px;height:48px;opacity:.3;margin-bottom:12px" />
      <p>No tasks — you're all caught up!</p>
    </div>
    <div v-else class="task-list">
      <div v-for="t in sorted" :key="t.id" class="task-item" :class="{ done: t.completed_at }">
        <button class="task-check" type="button" :aria-label="t.completed_at ? 'Mark incomplete' : 'Mark complete'" @click="toggleTask(t)">
          <CheckCircle v-if="t.completed_at" style="color:var(--green,#22c55e)" />
          <Circle v-else />
        </button>
        <div class="task-body">
          <strong>{{ t.title }}</strong>
          <span v-if="t.description">{{ t.description }}</span>
          <span v-if="t.due_date" class="task-due">Due {{ t.due_date }}</span>
        </div>
        <span class="pill" :class="priorityClass[t.priority]">{{ t.priority }}</span>
        <button class="icon-btn" type="button" @click="del(t.id)"><Trash2 style="width:15px;height:15px" /></button>
      </div>
    </div>
  </section>
</template>
