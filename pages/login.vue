<script setup lang="ts">
import { validateLoginForm } from '~/utils/auth'

definePageMeta({
  layout: false,
  middleware: defineNuxtRouteMiddleware(() => {
    const user = useSupabaseUser()
    if (user.value) return navigateTo('/')
  }),
})

const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function signIn() {
  const validationError = validateLoginForm(email.value, password.value)
  if (validationError) {
    errorMsg.value = validationError
    return
  }

  loading.value = true
  errorMsg.value = ''

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  })

  loading.value = false

  if (error) {
    errorMsg.value = error.message === 'Invalid login credentials'
      ? 'Incorrect email or password. Please try again.'
      : error.message
  } else {
    await navigateTo('/')
  }
}
</script>

<template>
  <div class="login-shell">

    <!-- Left branding panel -->
    <div class="login-panel-left">
      <div class="lpanel-content">
        <img class="lpanel-logo" src="/pureview-logo-light.png" alt="PureView" />
        <h2 class="lpanel-heading">Run your window cleaning business smarter.</h2>
        <ul class="lpanel-features">
          <li>
            <span class="lpf-icon"><i class="fa-solid fa-chart-line"></i></span>
            <span>Revenue &amp; expense tracking</span>
          </li>
          <li>
            <span class="lpf-icon"><i class="fa-solid fa-calendar-check"></i></span>
            <span>Appointment scheduling</span>
          </li>
          <li>
            <span class="lpf-icon"><i class="fa-solid fa-users"></i></span>
            <span>Client &amp; team management</span>
          </li>
          <li>
            <span class="lpf-icon"><i class="fa-solid fa-file-invoice-dollar"></i></span>
            <span>Invoices &amp; payment tracking</span>
          </li>
        </ul>
      </div>
      <div class="lpanel-deco-1"></div>
      <div class="lpanel-deco-2"></div>
      <div class="lpanel-deco-3"></div>
    </div>

    <!-- Right form panel -->
    <div class="login-panel-right">
      <div class="login-form-wrap">

        <div class="lform-header">
          <h1>Welcome back</h1>
          <p>Sign in to access your business dashboard</p>
        </div>

        <form class="login-form" @submit.prevent="signIn" novalidate>
          <div class="field">
            <label for="email">Email address</label>
            <div class="input-icon-wrap">
              <i class="fa-regular fa-envelope input-icon"></i>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="you@example.com"
                autocomplete="email"
                :disabled="loading"
                :aria-describedby="errorMsg ? 'login-error' : undefined"
                aria-required="true"
              />
            </div>
          </div>

          <div class="field">
            <label for="password">Password</label>
            <div class="input-icon-wrap">
              <i class="fa-solid fa-lock input-icon"></i>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                autocomplete="current-password"
                :disabled="loading"
                aria-required="true"
              />
            </div>
          </div>

          <div v-if="errorMsg" id="login-error" class="login-error" role="alert" aria-live="assertive">
            <i class="fa-solid fa-circle-exclamation" style="margin-right:6px"></i>{{ errorMsg }}
          </div>

          <button type="submit" class="login-btn" :disabled="loading">
            <span v-if="loading" class="login-spinner" aria-hidden="true"></span>
            <template v-else><i class="fa-solid fa-arrow-right-to-bracket"></i></template>
            {{ loading ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>

        <p class="lform-footer">PureView Window Cleaning &amp; Screen Repair</p>
      </div>
    </div>

  </div>
</template>
