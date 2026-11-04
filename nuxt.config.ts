// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    geminiApiKey: '',
    geminiModel: 'gemini-3.8-flash',
    geminiFallbackModels: 'gemini-3.5-flash-lite,gemini-3.1-flash-lite',
    supabaseUrl: '',
    supabaseServiceKey: '',
  },
  nitro: {
    devStorage: {
      blogs: { driver: 'fs', base: './.data/blogs' },
    },
  },
})
