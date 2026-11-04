export interface BlogContent {
    title: string
    metaDescription: string
    intro: string
    sections: { heading: string; body: string }[]
}

export function buildBlog(rows: Row[], content: BlogContent) {
    return { content, stats: computeStats(rows), rows }
}


export const placeholderContent: BlogContent = {
    title: 'Top 100 UK Fintech Companies by Total Funding',
    metaDescription: 'Ranking of the 100 best-funded UK fintech companies, with funding statistics and regional insights.',
    intro: 'Placeholder introduction. AI-generated copy will go here.',
    sections: [
        { heading: 'Where the funding goes', body: 'Placeholder section copy.' },
        { heading: 'The full ranking', body: 'Placeholder section copy.' },
    ],
}