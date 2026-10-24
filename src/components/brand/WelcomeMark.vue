<template>
  <svg viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="welcome-star" x1="18" y1="6" x2="78" y2="90" gradientUnits="userSpaceOnUse">
        <stop stop-color="#D8CBFF" />
        <stop offset="0.38" stop-color="#B8A6F0" />
        <stop offset="0.66" stop-color="#F0B3CC" />
        <stop offset="1" stop-color="#F5C7A4" />
      </linearGradient>
      <radialGradient id="welcome-glow" cx="0" cy="0" r="1" gradientTransform="translate(48 48) rotate(90) scale(36)">
        <stop stop-color="#F6D9F0" stop-opacity="0.9" />
        <stop offset="1" stop-color="#F6D9F0" stop-opacity="0" />
      </radialGradient>
      <filter id="welcome-blur" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
    </defs>

    <circle cx="48" cy="48" r="34" fill="url(#welcome-glow)" filter="url(#welcome-blur)" />
    <path
      d="M48 7C51.4 30.2 65.8 44.6 89 48C65.8 51.4 51.4 65.8 48 89C44.6 65.8 30.2 51.4 7 48C30.2 44.6 44.6 30.2 48 7Z"
      fill="url(#welcome-star)"
    />
    <path
      d="M48 23C50.1 38.8 57.2 45.9 73 48C57.2 50.1 50.1 57.2 48 73C45.9 57.2 38.8 50.1 23 48C38.8 45.9 45.9 38.8 48 23Z"
      fill="white"
      fill-opacity="0.22"
    />
    <circle cx="48" cy="48" r="4.5" fill="white" fill-opacity="0.8" />
  </svg>
</template>
