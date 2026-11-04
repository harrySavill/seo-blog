export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug') ?? ''
    if (!/^[a-z0-9-]{1,100}$/.test(slug)) {
        throw createError({ statusCode: 404, statusMessage: 'Blog not found' })
    }

    const blog = await getBlog(slug)
    if (!blog) throw createError({ statusCode: 404, statusMessage: 'Blog not found' })
    return blog
})