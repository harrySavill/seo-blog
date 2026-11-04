<script setup lang="ts">
const route = useRoute()
const { data: blog, error } = await useFetch(`/api/blogs/${route.params.slug}`)

if (error.value || !blog.value) {
  throw createError({ statusCode: 404, statusMessage: 'Blog not found', fatal: true })
}

useSeoMeta({
  title: blog.value.content.title,
  description: blog.value.content.metaDescription,
  ogTitle: blog.value.content.title,
  ogDescription: blog.value.content.metaDescription,
})

const columns = computed(() => blog.value?.stats.columns.map(c => c.name) ?? [])
</script>

<template>
  <main v-if="blog">
    <h1>{{ blog.content.title }}</h1>
    <p>{{ blog.content.intro }}</p>

    <section v-if="blog.stats.metric" aria-labelledby="stats-heading">
      <h2 id="stats-heading">Key statistics</h2>
      <ul>
        <li>{{ blog.stats.rowCount }} companies raised {{ blog.stats.metric.currency }}{{ blog.stats.metric.total.toLocaleString('en-GB') }} in total</li>
        <li>Median raise: {{ blog.stats.metric.currency }}{{ blog.stats.metric.median.toLocaleString('en-GB') }}</li>
        <li>Top 10 companies account for {{ Math.round(blog.stats.metric.top10Share * 100) }}% of funding</li>
      </ul>
    </section>

    <section v-for="section in blog.content.sections" :key="section.heading">
      <h2>{{ section.heading }}</h2>
      <p>{{ section.body }}</p>
    </section>

    <table>
      <caption>{{ blog.content.title }}</caption>
      <thead>
      <tr><th v-for="col in columns" :key="col" scope="col">{{ col }}</th></tr>
      </thead>
      <tbody>
      <tr v-for="(row, i) in blog.rows" :key="i">
        <td v-for="col in columns" :key="col">{{ row[col] }}</td>
      </tr>
      </tbody>
    </table>
  </main>
</template>