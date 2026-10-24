<script setup lang="ts">
import { MotionConfig } from 'motion-v'
import { RouterProvider } from '@tanstack/vue-router'
import ToastHub from '@/components/ui/ToastHub.vue'
import { router } from '@/router'
</script>

<template>
  <MotionConfig reduced-motion="user">
    <RouterProvider :router="router" />
    <ToastHub />
  </MotionConfig>
</template>
