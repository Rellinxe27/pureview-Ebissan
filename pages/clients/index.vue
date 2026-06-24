<script setup lang="ts">
import { Menu, Plus, Search, Users } from '@lucide/vue'

const router = useRouter()
const { clients, loading, error, fetchAll } = useClients()
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})
const search = ref('')

onMounted(() => fetchAll())

const filtered = computed(() => {
  if (!search.value.trim()) return clients.value
  const q = search.value.toLowerCase()
  return clients.value.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    c.phone?.includes(q) ||
    c.city?.toLowerCase().includes(q),
  )
})
</script>

<template>
  <header class="topbar">
    <div class="title-row">
      <button class="hamburger" type="button" @click="toggleSidebar()"><Menu /></button>
      <div>
        <h1><Users style="display:inline;width:20px;height:20px;margin-right:6px;vertical-align:middle" />Clients</h1>
        <p>{{ clients.length }} active client{{ clients.length !== 1 ? 's' : '' }}</p>
      </div>
    </div>
    <div class="header-actions">
      <button class="primary-action" type="button" @click="router.push('/clients/new')"><Plus /> Add Client</button>
    </div>
  </header>

  <section class="content">
    <div class="toolbar">
      <div class="search-box">
        <Search class="search-icon" />
        <input v-model="search" type="search" placeholder="Search clients…" aria-label="Search clients" />
      </div>
    </div>

    <SkeletonCards v-if="loading" />
    <div v-else-if="error"  class="error-state">{{ error }}</div>
    <div v-else-if="!filtered.length" class="empty-state">
      <Users style="width:48px;height:48px;opacity:.3;margin-bottom:12px" />
      <p>{{ search ? 'No clients match your search.' : 'No clients yet.' }}</p>
      <button class="primary-action" type="button" @click="router.push('/clients/new')">Add First Client</button>
    </div>
    <div v-else class="client-grid">
      <article v-for="c in filtered" :key="c.id" class="client-card" @click="router.push(`/clients/${c.id}`)">
        <div class="client-avatar">{{ c.name[0].toUpperCase() }}</div>
        <div class="client-info">
          <strong>{{ c.name }}</strong>
          <span v-if="c.email">{{ c.email }}</span>
          <span v-if="c.phone">{{ c.phone }}</span>
          <span v-if="c.city">{{ c.city }}<span v-if="c.state">, {{ c.state }}</span></span>
        </div>
      </article>
    </div>
  </section>
</template>
