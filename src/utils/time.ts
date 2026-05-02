const pad2 = (value: number) => String(value).padStart(2, '0')

export const formatMonthDay = (date: Date) => {
    const month = pad2(date.getMonth() + 1)
    const day = pad2(date.getDate())
    return `${month}/${day}`
}

export const formatMonthDayTime = (timestamp: number) => {
    if (!timestamp) return '--/-- --:--'

    const date = new Date(timestamp)
    const hours = pad2(date.getHours())
    const minutes = pad2(date.getMinutes())

    return `${formatMonthDay(date)} ${hours}:${minutes}`
}
