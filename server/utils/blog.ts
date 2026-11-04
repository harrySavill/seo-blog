export interface BlogContent {
    title: string
    metaDescription: string
    intro: string
    sections: { heading: string; body: string }[]
}

export function buildBlog(rows: Row[], content: BlogContent) {
    return { content, stats: computeStats(rows), rows }
}