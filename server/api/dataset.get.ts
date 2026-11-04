import Papa from 'papaparse'

export default defineEventHandler(async () => {
    const csv = await useStorage('assets:server').getItem('fintech.csv')
    const { data } = Papa.parse<Record<string, any>>(String(csv), {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    })
    return data
})