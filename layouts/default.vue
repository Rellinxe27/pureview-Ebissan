<script setup lang="ts">
const { userEmail, logout } = useAuth()
const { members, fetchAll: fetchTeam } = useTeam()
const route  = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)

const navItems = [
  { label: 'Dashboard',          icon: 'fa-chart-pie',      route: '/' },
  { label: 'Calendar',           icon: 'fa-regular fa-calendar', route: '/calendar', regular: true },
  { label: 'Appointments',       icon: 'fa-clipboard-list', route: '/appointments' },
  { label: 'Clients',            icon: 'fa-users',          route: '/clients' },
  { label: 'Recurring Services', icon: 'fa-rotate',         route: '/recurring' },
  { label: 'Proposals / Quotes', icon: 'fa-file-invoice',   route: '/quotes' },
  { label: 'Invoices',           icon: 'fa-file-lines',     route: '/invoices' },
  { label: 'Payments',           icon: 'fa-credit-card',    route: '/payments' },
  { label: 'Financials',         icon: 'fa-chart-line',     route: '/financials' },
  { label: 'Goals',              icon: 'fa-bullseye',       route: '/goals' },
  { label: 'Tasks',              icon: 'fa-check-square',    route: '/tasks' },
  { label: 'Customer Feedback',  icon: 'fa-star',           route: '/feedback' },
  { label: 'Reports',            icon: 'fa-chart-bar',      route: '/reports' },
  { label: 'Team',               icon: 'fa-people-group',   route: '/team' },
  { label: 'Settings',           icon: 'fa-gear',           route: '/settings' },
]

const memberCount = computed(() => members.value.filter(m => m.is_active).length)

onMounted(() => fetchTeam())

function isActive(item: typeof navItems[0]) {
  if (item.route === '/') return route.path === '/'
  return route.path.startsWith(item.route)
}

function handleNav(item: typeof navItems[0]) {
  router.push(item.route)
  if (typeof window !== 'undefined' && window.innerWidth < 980) sidebarOpen.value = false
}

function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }
function toggleCollapse() { sidebarCollapsed.value = !sidebarCollapsed.value }
provide('toggleSidebar', toggleSidebar)
provide('sidebarCollapsed', sidebarCollapsed)
</script>

<template>
  <div class="app-shell" :class="{ 'sidebar-open': sidebarOpen, 'sidebar-collapsed': sidebarCollapsed }">
    <div class="sidebar-backdrop" @click="sidebarOpen = false"></div>

    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="logo-area">
        <div class="logo-row">
          <img class="logo-img" src="/pureview-logo-light.png" alt="PureView" />
          <button class="sidebar-toggle" type="button" :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'" @click="toggleCollapse">
            <i :class="sidebarCollapsed ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left'"></i>
          </button>
        </div>
        <div class="logo-sub">Window Cleaning</div>
      </div>
      <nav class="nav">
        <button
          v-for="item in navItems"
          :key="item.label"
          type="button"
          class="nav-item"
          :class="{ active: isActive(item) }"
          :title="item.label"
          @click="handleNav(item)"
        >
          <i :class="item.regular ? item.icon : `fa-solid ${item.icon}`"></i>
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </nav>
      <div class="sidebar-bottom">
        <div class="user-chip" :title="`${userEmail} — click to sign out`" @click="logout">
          <div class="avatar">PV</div>
          <div class="user-info">
            <div class="user-name">PureView Team</div>
            <div class="user-sub">{{ memberCount }} Member{{ memberCount === 1 ? '' : 's' }}</div>
          </div>
          <button class="user-logout" type="button" aria-label="Sign out" @click.stop="logout">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </aside>

    <!-- MAIN -->
    <div class="main">
      <slot />
    </div>
  </div>
</template>
