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

const columns = computed(() => blog.value?.stats.columns ?? [])
const metric = computed(() => blog.value?.stats.metric)

const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 })
const money = (n: number) => `${metric.value?.currency ?? ''}${compact.format(n)}`
const isUrl = (v: unknown) => typeof v === 'string' && /^https?:\/\//.test(v)
const cellClass = (kind: string) => (kind === 'numeric' ? 'num' : kind)

type BreakdownItem = { label: string; count: number; share?: number | null }

// Top 6 rows, ordered by count
const topItems = (items: BreakdownItem[]) =>
    [...items].sort((a, b) => b.count - a.count).slice(0, 6)

// A row's share of the count: its count divided by the total count of the
// whole breakdown (not just the rows shown). Used for both the label and the bar.
const countShare = (item: BreakdownItem, items: BreakdownItem[]) => {
  const total = items.reduce((sum, i) => sum + i.count, 0)
  return total > 0 ? (item.count / total) * 100 : 0
}
</script>

<template>
  <article v-if="blog">
    <h1>{{ blog.content.title }}</h1>
    <p>{{ blog.content.intro }}</p>

    <h2 class="sr-only">Key figures</h2>
    <dl v-if="metric" class="stats">
      <div class="stat"><dt>Total {{ metric.column.toLowerCase() }}</dt><dd>{{ money(metric.total) }}</dd></div>
      <div class="stat"><dt>Median</dt><dd>{{ money(metric.median) }}</dd></div>
      <div class="stat"><dt>Top 10 share</dt><dd>{{ Math.round(metric.top10Share * 100) }}%</dd></div>
      <div class="stat"><dt>Largest</dt><dd>{{ money(metric.max.value) }}</dd><span class="stat-note">{{ metric.max.label }}</span></div>
    </dl>

    <section v-for="section in blog.content.sections" :key="section.heading">
      <h2>{{ section.heading }}</h2>
      <p>{{ section.body }}</p>
    </section>

    <section v-if="blog.stats.breakdowns.length" aria-labelledby="breakdowns-heading">
      <h2 id="breakdowns-heading">Breakdowns</h2>
      <div class="breakdowns">
        <div v-for="b in blog.stats.breakdowns.slice(0, 4)" :key="b.column" class="breakdown">
          <h3>By {{ b.column.toLowerCase() }}</h3>
          <ul>
            <li v-for="item in topItems(b.items)" :key="item.label">
              <span class="row-head">
                <span>{{ item.label }}</span>
                <span>{{ item.count }} · {{ Math.round(countShare(item, b.items)) }}% of total</span>
              </span>
              <span class="bar" aria-hidden="true"><span :style="{ width: countShare(item, b.items) + '%' }" /></span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section aria-labelledby="ranking-heading">
      <h2 id="ranking-heading">Full ranking</h2>
      <div class="table-wrap" tabindex="0" role="region" aria-label="Scrollable ranking table">
        <table>
          <caption>{{ blog.content.title }}</caption>
          <thead>
          <tr><th v-for="col in columns" :key="col.name" scope="col" :class="cellClass(col.kind)">{{ col.name }}</th></tr>
          </thead>
          <tbody>
          <tr v-for="(row, i) in blog.rows" :key="i">
            <td v-for="col in columns" :key="col.name" :class="cellClass(col.kind)">
              <a v-if="isUrl(row[col.name])" :href="row[col.name]" target="_blank" rel="noopener noreferrer">Visit site</a>
              <template v-else>{{ row[col.name] }}</template>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>
  </article>
</template>