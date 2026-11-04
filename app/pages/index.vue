<script setup lang="ts">
useSeoMeta({
  title: 'CSV to SEO Blog Generator',
  description: 'Upload a company dataset as a CSV and generate an SEO-optimised blog page with statistics and a ranking table.',
})

const file = ref<File | null>(null)
const name = ref('')
const loading = ref(false)
const error = ref('')

function onFileChange(e: Event) {
  file.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function submit() {
  if (!file.value) {
    error.value = 'Choose a CSV file first.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const body = new FormData()
    body.append('file', file.value)
    if (name.value.trim()) body.append('name', name.value.trim())
    const res = await $fetch<{ slug: string }>('/api/generate', { method: 'POST', body })
    await navigateTo(`/blog/${res.slug}`)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main>
    <h1>Generate an SEO blog from a CSV</h1>
    <p>Upload a dataset and get a ready-to-publish blog page with statistics and a ranking table.</p>

    <form @submit.prevent="submit">
      <div>
        <label for="csv">CSV file (max 1 MB, 500 rows)</label>
        <input id="csv" type="file" accept=".csv,text/csv" @change="onFileChange">
      </div>
      <div>
        <label for="name">Dataset name (optional)</label>
        <input id="name" v-model="name" type="text" maxlength="100" placeholder="e.g. Top 100 UK healthtech companies">
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Generating… this can take up to a minute' : 'Generate blog' }}
      </button>
      <p role="alert" aria-live="polite">{{ error }}</p>
    </form>
  </main>
</template>