<script setup lang="ts">
import { Menu, MessageSquare, Plus, Star, Trash2 } from '@lucide/vue'

const { feedback, loading, avgRating, fetchAll, create, remove } = useFeedback()
const { clients, fetchAll: fetchClients } = useClients()
const { show: showToast } = useToast()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})

const showForm  = ref(false)
const saving    = ref(false)
const formError = ref('')
const form = reactive({ client_id: '', rating: 5, comment: '', date: '' })

onMounted(() => Promise.all([fetchAll(), fetchClients()]))

async function submit() {
  if (!form.client_id) { formError.value = 'Please select a client.'; return }
  formError.value = ''
  saving.value    = true
  try {
    await create({
      client_id: form.client_id || null,
      rating:    form.rating,
      comment:   form.comment   || null,
      date:      form.date      || undefined,
    })
    showToast('Feedback recorded!')
    showForm.value = false
    Object.assign(form, { client_id: '', rating: 5, comment: '', date: '' })
    await fetchAll()
  } catch (e: any) { formError.value = e.message } finally { saving.value = false }
}

async function del(id: string) {
  if (!confirm('Delete this feedback?')) return
  try { await remove(id); await fetchAll() } catch (e: any) { showToast(e.message) }
}
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <h1><MessageSquare style="display:inline;width:20px;height:20px;margin-right:6px;vertical-align:middle" />Customer Feedback</h1>
        <p>Avg rating: <strong>{{ avgRating.toFixed(1) }} / 5</strong> &nbsp;({{ feedback.length }} reviews)</p>
      </div>
    </div>
    <div class="header-actions">
      <button class="primary-action" type="button" @click="showForm = !showForm"><Plus /> Add Review</button>
    </div>
  </header>

  <section class="content">
    <div v-if="showForm" class="form-card" style="margin-bottom:24px">
      <h3 style="margin-bottom:16px">Add Feedback</h3>
      <form class="form-grid" @submit.prevent="submit">
        <div class="field">
          <label>Client <span class="required">*</span></label>
          <select v-model="form.client_id" required>
            <option value="">— Select client —</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="field">
          <label>Rating</label>
          <select v-model.number="form.rating">
            <option v-for="n in [5,4,3,2,1]" :key="n" :value="n">{{ n }} star{{ n !== 1 ? 's' : '' }}</option>
          </select>
        </div>
        <div class="field">
          <label>Date</label>
          <input v-model="form.date" type="date" />
        </div>
        <div class="field field-full">
          <label>Comment</label>
          <textarea v-model="form.comment" rows="3" placeholder="What did the client say?"></textarea>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="form-actions">
          <button type="button" class="outline-action" @click="showForm = false">Cancel</button>
          <button type="submit" class="primary-action" :disabled="saving">{{ saving ? 'Saving…' : 'Save Feedback' }}</button>
        </div>
      </form>
    </div>

    <div v-if="loading" class="review-grid">
      <div v-for="n in 4" :key="n" class="review-full">
        <div class="review-head"><Skeleton w="36px" h="36px" circle /><Skeleton w="130px" h="12px" /><Skeleton w="80px" h="11px" /></div>
        <Skeleton w="100%" h="11px" />
      </div>
    </div>
    <div v-else-if="!feedback.length" class="empty-state">
      <MessageSquare style="width:48px;height:48px;opacity:.3;margin-bottom:12px" />
      <p>No feedback yet. Start collecting reviews!</p>
    </div>
    <div v-else class="review-grid">
      <article v-for="f in feedback" :key="f.id" class="review review-full">
        <div class="review-head">
          <span class="avatar blue">{{ f.clients?.name?.[0]?.toUpperCase() ?? '?' }}</span>
          <strong>{{ f.clients?.name ?? 'Client' }}</strong>
          <span class="stars" :aria-label="`${f.rating} star rating`">
            <Star v-for="s in (f.rating ?? 0)" :key="s" style="width:14px;height:14px;fill:currentColor;color:#f59e0b" />
            <Star v-for="s in (5 - (f.rating ?? 0))" :key="`e${s}`" style="width:14px;height:14px;color:var(--border-color,#e2e8f0)" />
          </span>
          <time>{{ f.date }}</time>
          <button class="icon-btn" style="margin-left:auto" type="button" @click="del(f.id)"><Trash2 style="width:14px;height:14px" /></button>
        </div>
        <p v-if="f.comment">{{ f.comment }}</p>
      </article>
    </div>
  </section>
</template>
