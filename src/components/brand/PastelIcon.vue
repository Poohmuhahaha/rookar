<script setup lang="ts">
defineProps<{
  type: 'star' | 'pencil' | 'palette'
}>()
</script>

<template>
  <div class="flex h-9 w-9 items-center justify-center">
    <!-- 3D Pastel Star -->
    <svg v-if="type === 'star'" viewBox="0 0 36 36" fill="none" class="h-8 w-8">
      <defs>
        <linearGradient id="star-grad" x1="6" y1="4" x2="30" y2="32" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFCCD5" />
          <stop offset="0.45" stop-color="#E5B8F4" />
          <stop offset="1" stop-color="#C5BAF8" />
        </linearGradient>
        <radialGradient id="star-shine" cx="14" cy="12" r="10" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFFFFF" stop-opacity="0.8" />
          <stop offset="1" stop-color="#FFFFFF" stop-opacity="0" />
        </radialGradient>
      </defs>
      <!-- Pillow Star shape -->
      <path
        d="M18 3.5C18.6 3.5 19.1 3.9 19.3 4.5L21.8 11.2C22.2 12.3 23.2 13 24.3 13.1L31.5 13.8C32.1 13.9 32.6 14.3 32.8 14.9C33 15.5 32.8 16.1 32.3 16.5L26.9 21.1C26 21.9 25.6 23.1 25.9 24.2L27.6 31.2C27.8 31.8 27.5 32.4 27 32.8C26.5 33.1 25.9 33.1 25.4 32.8L19.2 29C18.2 28.4 17 28.4 16 29L9.8 32.8C9.3 33.1 8.7 33.1 8.2 32.8C7.7 32.4 7.4 31.8 7.6 31.2L9.3 24.2C9.6 23.1 9.2 21.9 8.3 21.1L2.9 16.5C2.4 16.1 2.2 15.5 2.4 14.9C2.6 14.3 3.1 13.9 3.7 13.8L10.9 13.1C12 13 13 12.3 13.4 11.2L15.9 4.5C16.1 3.9 16.6 3.5 17.2 3.5H18Z"
        fill="url(#star-grad)"
      />
      <circle cx="14" cy="13" r="7" fill="url(#star-shine)" />
    </svg>

    <!-- 3D Pastel Pencil -->
    <svg v-else-if="type === 'pencil'" viewBox="0 0 36 36" fill="none" class="h-8 w-8">
      <defs>
        <linearGradient id="pencil-body" x1="10" y1="10" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stop-color="#EAD9FF" />
          <stop offset="0.6" stop-color="#D4C0FA" />
          <stop offset="1" stop-color="#B8A4E8" />
        </linearGradient>
        <linearGradient id="pencil-eraser" x1="24" y1="6" x2="30" y2="12" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFA8BA" />
          <stop offset="1" stop-color="#F28C9F" />
        </linearGradient>
        <linearGradient id="pencil-wood" x1="6" y1="26" x2="12" y2="32" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFE7C7" />
          <stop offset="1" stop-color="#F3CCA2" />
        </linearGradient>
      </defs>
      <!-- Eraser -->
      <path d="M24 6.5C25.5 5 28 5 29.5 6.5C31 8 31 10.5 29.5 12L27 14.5L21.5 9L24 6.5Z" fill="url(#pencil-eraser)" />
      <!-- Metal ring -->
      <path d="M21.5 9L27 14.5L25.5 16L20 10.5L21.5 9Z" fill="#FDE047" fill-opacity="0.9" />
      <!-- Body -->
      <path d="M20 10.5L25.5 16L12.5 29L7 23.5L20 10.5Z" fill="url(#pencil-body)" />
      <!-- Wood tip -->
      <path d="M7 23.5L12.5 29L5 31L7 23.5Z" fill="url(#pencil-wood)" />
      <!-- Lead tip -->
      <path d="M5 31L7 29L6.5 28.5L5 31Z" fill="#5E5274" />
      <!-- Highlights -->
      <path d="M18.5 12.5L23.5 17.5L12 29L10 27L18.5 12.5Z" fill="white" fill-opacity="0.25" />
    </svg>

    <!-- 3D Pastel Palette -->
    <svg v-else-if="type === 'palette'" viewBox="0 0 36 36" fill="none" class="h-8 w-8">
      <defs>
        <linearGradient id="palette-base" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FDF4ED" />
          <stop offset="0.5" stop-color="#F5E4D8" />
          <stop offset="1" stop-color="#E9CEBF" />
        </linearGradient>
      </defs>
      <!-- Palette body -->
      <path
        d="M18 4C9.5 4 4 10 4 18C4 24.5 9 29.5 15 30.5C16.8 30.8 18 29.3 18 27.5C18 26.2 18.8 25.2 20 25.2H21.5C26.5 25.2 31.5 21 31.5 16C31.5 9.5 25.5 4 18 4Z"
        fill="url(#palette-base)"
      />
      <!-- Paint dollops with specular dots -->
      <!-- Lavender -->
      <circle cx="11.5" cy="14" r="2.8" fill="#C5B2F4" />
      <circle cx="10.8" cy="13.2" r="0.8" fill="white" fill-opacity="0.9" />
      <!-- Rose/Peach -->
      <circle cx="16.5" cy="10" r="2.8" fill="#FFAAA6" />
      <circle cx="15.8" cy="9.2" r="0.8" fill="white" fill-opacity="0.9" />
      <!-- Mint/Teal -->
      <circle cx="23" cy="11.5" r="2.8" fill="#A7E5D9" />
      <circle cx="22.3" cy="10.7" r="0.8" fill="white" fill-opacity="0.9" />
      <!-- Gold/Amber -->
      <circle cx="26.5" cy="16.5" r="2.8" fill="#FED77A" />
      <circle cx="25.8" cy="15.7" r="0.8" fill="white" fill-opacity="0.9" />
      <!-- Thumb hole -->
      <ellipse cx="23" cy="21.5" rx="2.5" ry="2" fill="#E2C1AF" />
    </svg>
  </div>
</template>
