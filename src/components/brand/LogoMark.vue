<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
    class?: string
  }>(),
  { size: 36 },
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    :class="class"
  >
    <rect width="40" height="40" rx="13" fill="#000000" />
    <path
      d="M11.5 29.5V10.5H21c4.2 0 7 2.4 7 6.1 0 2.7-1.5 4.8-4 5.6l4.2 7.3h-4.8l-3.6-6.5h-3.8v6.5h-4.5Zm4.5-10h4.7c2.2 0 3.5-1.1 3.5-2.9s-1.3-2.9-3.5-2.9H16v5.8Z"
      fill="#F7F0D8"
    />
    <circle cx="31.5" cy="30" r="2.8" fill="#D97706" />
  </svg>
</template>
