export type ColumnKind = 'numeric' | 'category' | 'multi' | 'text'
export interface ColumnInfo { name: string; kind: ColumnKind; currency?: string }

export function parseNumber(value: string | undefined): number | null {
    if (!value) return null
    const cleaned = value.replace(/[£$€,\s]/g, '')
    return /^-?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : null
}

export function detectColumns(rows: Row[]): ColumnInfo[] {
    const names = Object.keys(rows[0] ?? {})
    return names.map((name) => {
        const values = rows.map(r => r[name]).filter(v => v !== undefined && v !== '')
        if (!values.length) return { name, kind: 'text' as const }

        const numericShare = values.filter(v => parseNumber(v) !== null).length / values.length
        if (numericShare >= 0.9) {
            const currency = values[0].match(/^[£$€]/)?.[0]
            return { name, kind: 'numeric' as const, currency }
        }

        const multiShare = values.filter(v => v.includes(';')).length / values.length
        if (multiShare >= 0.3) return { name, kind: 'multi' as const }

        const distinct = new Set(values).size
        if (distinct <= Math.max(10, rows.length * 0.2)) return { name, kind: 'category' as const }

        return { name, kind: 'text' as const }
    })
}

function median(nums: number[]) {
    const s = [...nums].sort((a, b) => a - b)
    const mid = Math.floor(s.length / 2)
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export function computeStats(rows: Row[]) {
    const columns = detectColumns(rows)

    // label = the column that names each row (Company)
    const labelCol =
        columns.find(c => c.kind === 'text' && /name|company|title/i.test(c.name)) ??
        columns.find(c => c.kind === 'text')

    // metric = the main number to analyse: prefer currency, skip rank/id columns
    const numeric = columns.filter(c => c.kind === 'numeric' && !/rank|^id$|index/i.test(c.name))
    const metricCol = numeric.find(c => c.currency) ?? numeric[0]

    let metric = null
    if (metricCol) {
        const entries = rows
            .map(r => ({ label: labelCol ? r[labelCol.name] : '', value: parseNumber(r[metricCol.name]) }))
            .filter((e): e is { label: string; value: number } => e.value !== null)
            .sort((a, b) => b.value - a.value)
        const values = entries.map(e => e.value)
        const total = values.reduce((a, b) => a + b, 0)
        metric = {
            column: metricCol.name,
            currency: metricCol.currency ?? '',
            total,
            mean: total / values.length,
            median: median(values),
            max: entries[0],
            min: entries[entries.length - 1],
            top10Share: values.slice(0, 10).reduce((a, b) => a + b, 0) / total,
        }
    }
    const metricTotal = metric?.total ?? 0

    // breakdowns for category and multi-value columns
    const breakdowns = columns
        .filter(c => c.kind === 'category' || c.kind === 'multi')
        .map((c) => {
            const map = new Map<string, { count: number; total: number }>()
            for (const r of rows) {
                const raw = r[c.name]
                if (!raw) continue
                const labels = (c.kind === 'multi' ? raw.split(';') : [raw])
                    .map(s => s.trim())
                    .filter(s => s && !/^(n\/a|unknown|-)$/i.test(s))
                const amount = metricCol ? parseNumber(r[metricCol.name]) ?? 0 : 0
                for (const label of labels) {
                    const cur = map.get(label) ?? { count: 0, total: 0 }
                    cur.count += 1
                    cur.total += amount
                    map.set(label, cur)
                }
            }
            const items = [...map.entries()]
                .map(([label, v]) => ({
                    label,
                    ...v,
                    average: v.count ? Math.round(v.total / v.count) : null,
                    share: metricTotal ? Math.round((v.total / metricTotal) * 100) : null,
                }))
                // drop near-universal values (e.g. "Application software" in 98 of 100 rows)
                .filter(i => i.count / rows.length <= 0.9)
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
            return { column: c.name, kind: c.kind, items }
        })
        .filter(b => b.items.length > 1)

    // categorical columns where every row has the same value (e.g. Stage = Seed): kept as facts
    const constants = columns
        .filter(c => c.kind === 'category')
        .map(c => ({ column: c.name, values: new Set(rows.map(r => r[c.name]).filter(Boolean)) }))
        .filter(c => c.values.size === 1)
        .map(c => ({ column: c.column, value: [...c.values][0] }))

    return { rowCount: rows.length, columns, labelColumn: labelCol?.name ?? null, metric, breakdowns, constants }
}