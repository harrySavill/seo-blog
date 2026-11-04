export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')
    if (slug !== 'fintech') {
        throw createError({ statusCode: 404, statusMessage: 'Blog not found' })
    }

    const raw = await useStorage('assets:server').getItem('fintech-content.json')
    const content = (typeof raw === 'string' ? JSON.parse(raw) : raw) as BlogContent | null
    if (!content) {
        throw createError({ statusCode: 500, statusMessage: 'Fintech content missing' })
    }

    return buildBlog(await loadFintech(), content)
})