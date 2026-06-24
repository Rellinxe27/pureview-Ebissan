export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const userEmail = computed(() => user.value?.email ?? '')
  const userInitial = computed(() => user.value?.email?.[0]?.toUpperCase() ?? 'U')

  async function logout() {
    await supabase.auth.signOut()
    await navigateTo('/login')
  }

  return { user, userEmail, userInitial, logout }
}
