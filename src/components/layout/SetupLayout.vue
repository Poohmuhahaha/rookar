<script setup lang="ts">
import { Outlet } from '@tanstack/vue-router'
</script>

<template>
  <main class="min-h-dvh overflow-y-auto bg-white p-4 sm:p-6 lg:px-8 lg:py-5">
    <div class="mx-auto w-full max-w-6xl">
      <Outlet />
    </div>
  </main>
</template>
