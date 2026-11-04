let cached: Awaited<ReturnType<typeof generateContent>> | undefined

export default defineEventHandler(async (event) => {
    cached ??= await generateContent(event, await loadFintech(), 'UK fintech companies ranked by total funding raised')
    return cached
})