<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 6 })
</script>

<template>
  <div class="client-grid" role="status" aria-label="Loading…">
    <div v-for="n in count" :key="n" class="client-card" style="cursor:default">
      <Skeleton w="48px" h="48px" circle />
      <div class="client-info" style="flex:1;gap:8px">
        <Skeleton w="55%" h="14px" />
        <Skeleton w="80%" h="11px" />
        <Skeleton w="45%" h="11px" />
      </div>
    </div>
  </div>
</template>
