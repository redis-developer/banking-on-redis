export const createAmount = () => {
    const random = getRandom()
    let amount = ((random / 100) % 300).toFixed(2)
    amount *= Math.random() < 0.5 ? -1 : 1
    return amount
}

export const getRandom = () => {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0]
}

export const replacer = (key, value) => {
    if (typeof value === "number") {
        return value.toString();
    }
    return value;
}