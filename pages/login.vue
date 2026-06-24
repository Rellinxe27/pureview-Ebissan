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
    <div class="login-card">
      <div class="login-brand">
        <img class="login-logo" src="/pureview-logo.png" alt="PureView Window Cleaning" />
      </div>

      <h1 class="login-title">Welcome back</h1>
      <p class="login-sub">Sign in to access your business dashboard</p>

      <form class="login-form" @submit.prevent="signIn" novalidate>
        <div class="field">
          <label for="email">Email address</label>
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

        <div class="field">
          <label for="password">Password</label>
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

        <div v-if="errorMsg" id="login-error" class="login-error" role="alert" aria-live="assertive">
          {{ errorMsg }}
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="login-spinner" aria-hidden="true"></span>
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>
