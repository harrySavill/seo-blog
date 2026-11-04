import { createClient } from '@supabase/supabase-js'

export interface StoredBlog {
    slug: string
    datasetName: string
    createdAt: string
    content: BlogContent
    stats: ReturnType<typeof computeStats>
    rows: Row[]
}

let client: ReturnType<typeof createClient> | undefined
function db() {
    if (!client) {
        const config = useRuntimeConfig()
        client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
            auth: { persistSession: false },
        })
    }
    return client
}

export async function getBlog(slug: string): Promise<StoredBlog | null> {
    const { data, error } = await db().from('blogs').select('*').eq('slug', slug).maybeSingle()
    if (error) throw error
    if (!data) return null
    return {
        slug: data.slug,
        datasetName: data.dataset_name,
        createdAt: data.created_at,
        content: data.content,
        stats: data.stats,
        rows: data.data_rows,
    }
}

export async function findSlugByHash(hash: string): Promise<string | null> {
    const { data, error } = await db().from('blogs').select('slug').eq('content_hash', hash).maybeSingle()
    if (error) throw error
    return data?.slug ?? null
}

export async function saveBlog(blog: StoredBlog, hash: string) {
    const { error } = await db().from('blogs').insert({
        slug: blog.slug,
        content_hash: hash,
        dataset_name: blog.datasetName,
        content: blog.content,
        stats: blog.stats,
        data_rows: blog.rows,
    })
    if (error && error.code !== '23505') throw error
}