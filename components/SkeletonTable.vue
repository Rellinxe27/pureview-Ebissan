<script setup lang="ts">
withDefaults(defineProps<{ rows?: number; cols?: number }>(), { rows: 6, cols: 5 })
</script>

<template>
  <div class="data-table-wrap" role="status" aria-label="Loading…">
    <table class="data-table">
      <thead>
        <tr><th v-for="c in cols" :key="c"><Skeleton w="55%" h="9px" /></th></tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r">
          <td v-for="c in cols" :key="c"><Skeleton :w="c === 1 ? '75%' : '50%'" h="12px" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
