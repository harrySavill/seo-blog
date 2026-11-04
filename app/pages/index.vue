<script setup lang="ts">
const { data: rows } = await useFetch('/api/dataset')
const columns = computed(() => (rows.value?.length ? Object.keys(rows.value[0]) : []))

useSeoMeta({
  title: 'Top 100 UK Fintech Companies',
  description: 'Placeholder description',
})
</script>

<template>
  <main>
    <h1>Top 100 UK Fintech Companies</h1>
    <table>
      <caption>Ranked by total fundraising</caption>
      <thead>
      <tr><th v-for="col in columns" :key="col" scope="col">{{ col }}</th></tr>
      </thead>
      <tbody>
      <tr v-for="(row, i) in rows" :key="i">
        <td v-for="col in columns" :key="col">{{ row[col] }}</td>
      </tr>
      </tbody>
    </table>
  </main>
</template>