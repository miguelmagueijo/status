export const getCleanDateString = (targetDate: Date) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
        "October", "November", "December"];

    return `${("0" + targetDate.getDate()).slice(-2)} ${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
}

export const getLastHoursIntervals = (totalHours: number) => {
    const intervals = [];
    const now = new Date();

    // Start at the current hour
    now.setMinutes(0, 0, 0);

    for (let i = 0; i < totalHours; i++) {
        const end = new Date(now);
        const start = new Date(now);
        start.setHours(start.getHours() - 1);

        const formatHour = (date: Date) => `${date.getHours().toString().padStart(2, "0")}:00`;

        intervals.push(`${formatHour(start)}-${formatHour(end)}`);
        now.setHours(now.getHours() - 1); // Move one hour back
    }

    return intervals;
}

export const getCleanDateTodayMinusDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return getCleanDateString(date);
}