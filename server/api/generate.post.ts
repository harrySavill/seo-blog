import { createHash } from 'node:crypto'

const MAX_BYTES = 1_000_000
const MAX_ROWS = 500

function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'dataset'
}

export default defineEventHandler(async (event) => {
    const parts = await readMultipartFormData(event)
    const file = parts?.find(p => p.name === 'file')

    if (!file?.data?.length) throw createError({ statusCode: 400, statusMessage: 'No file uploaded.' })
    if (file.data.length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: 'File too large (max 1 MB).' })
    if (!file.filename?.toLowerCase().endsWith('.csv')) {
        throw createError({ statusCode: 400, statusMessage: 'Please upload a .csv file.' })
    }

    // Same file uploaded before? Return the existing page, no AI call.
    const hash = createHash('sha256').update(file.data).digest('hex')
    const existing = await findSlugByHash(hash)
    if (existing) return { slug: existing, cached: true }

    const rows = parseCsv(file.data.toString('utf-8'))
    if (rows.length < 3) throw createError({ statusCode: 400, statusMessage: 'The CSV needs at least 3 data rows.' })
    if (rows.length > MAX_ROWS) throw createError({ statusCode: 400, statusMessage: `Too many rows (max ${MAX_ROWS}).` })
    if (Object.keys(rows[0]).length < 2) throw createError({ statusCode: 400, statusMessage: 'The CSV needs at least 2 columns.' })

    // Dataset name comes from the optional name field, else the filename. Strip newlines and cap length: it goes into the prompt.
    const nameField = parts?.find(p => p.name === 'name')?.data.toString('utf-8').trim()
    const datasetName = (nameField || file.filename.replace(/\.csv$/i, '')).replace(/[\r\n]+/g, ' ').slice(0, 100)

    let content
    try {
        content = await generateContent(event, rows, datasetName)
    } catch (err) {
        console.error('Generation failed:', err)
        throw createError({ statusCode: 503, statusMessage: 'The AI service is busy or returned an invalid response. Please try again shortly.' })
    }

    const slug = `${slugify(datasetName)}-${hash.slice(0, 8)}`
    await saveBlog({
        slug,
        datasetName,
        createdAt: new Date().toISOString(),
        content,
        stats: computeStats(rows),
        rows,
    }, hash)

    return { slug }
})