export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')
    if (slug !== 'fintech') {
        throw createError({ statusCode: 404, statusMessage: 'Blog not found' })
    }
    return buildBlog(await loadFintech(), placeholderContent)
})