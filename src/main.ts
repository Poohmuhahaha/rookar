import { createApp } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/prompt/300.css'
import '@fontsource/prompt/400.css'
import '@fontsource/prompt/500.css'
import '@fontsource/prompt/600.css'
import './styles/main.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createApp(App).use(VueQueryPlugin, { queryClient }).mount('#app')
