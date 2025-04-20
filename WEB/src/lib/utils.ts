export const getCleanDateString = (targetDate: Date) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
        "October", "November", "December"];

    return `${("0" + targetDate.getDate()).slice(-2)} ${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
}

export const getCleanDateTodayMinusDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return getCleanDateString(date);
}