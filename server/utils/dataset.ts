import Papa from 'papaparse'

export type Row = Record<string, string>

export function parseCsv(text: string): Row[] {
    const { data } = Papa.parse<Row>(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
    })
    return data
}

export async function loadFintech(): Promise<Row[]> {
    const csv = await useStorage('assets:server').getItem('fintech.csv')
    return parseCsv(String(csv))
}