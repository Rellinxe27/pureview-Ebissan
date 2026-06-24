<script setup lang="ts">
withDefaults(defineProps<{ fields?: number }>(), { fields: 6 })
</script>

<template>
  <div class="form-card" role="status" aria-label="Loading…">
    <div class="form-grid">
      <div v-for="n in fields" :key="n" class="field">
        <Skeleton w="40%" h="11px" />
        <Skeleton w="100%" h="42px" radius="8px" />
      </div>
    </div>
  </div>
</template>
