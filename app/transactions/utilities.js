export const createAmount = () => {
    const random = getRandom()
    let amount = ((random / 100) % 300).toFixed(2)
    amount *= Math.random() < 0.5 ? -1 : 1
    return amount
}

export const getRandom = () => {
    return Math.floor(Math.random() * 9999999999) 
}

export const replacer = (key, value) => {
    if (typeof value === "number") {
        return value.toString();
    }
    return value;
}