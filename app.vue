<script setup lang="ts">
const { message, visible } = useToast()
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Teleport to="body">
    <div class="toast" :class="{ 'toast-visible': visible }" role="status" aria-live="polite">
      {{ message }}
    </div>
  </Teleport>
</template>
