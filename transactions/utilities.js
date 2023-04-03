export const formatDate = (date) => {
    date = date.toJSON()
    const yyyy = date.substring(0,4)
    const MM = date.substring(5,7)
    const dd = date.substring(8,10)
    const HH = date.substring(11,13)
    const mm = date.substring(14,16)
    const ss = date.substring(17,19)

    return `${yyyy}.${MM}.${dd} at ${HH}:${mm}:${ss}`
}

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
