<script setup lang="ts">
const props = defineProps<{
  w?: string
  h?: string
  radius?: string
  circle?: boolean
  block?: boolean
}>()

const style = computed(() => ({
  width: props.w ?? '100%',
  height: props.h ?? '14px',
  borderRadius: props.circle ? '999px' : (props.radius ?? '6px'),
  display: props.block ? 'block' : 'inline-block',
}))
</script>

<template>
  <span class="skeleton" :style="style" aria-hidden="true" />
</template>
