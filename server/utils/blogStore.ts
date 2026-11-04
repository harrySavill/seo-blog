export interface StoredBlog {
    slug: string
    datasetName: string
    createdAt: string
    content: BlogContent
    stats: ReturnType<typeof computeStats>
    rows: Row[]
}

const blogs = () => useStorage('blogs')

export const getBlog = (slug: string) => blogs().getItem<StoredBlog>(`blog:${slug}`)
export const findSlugByHash = (hash: string) => blogs().getItem<string>(`hash:${hash}`)

export async function saveBlog(blog: StoredBlog, hash: string) {
    await blogs().setItem(`blog:${blog.slug}`, blog as any)
    await blogs().setItem(`hash:${hash}`, blog.slug)
}