
export const haveSameContents = <T>(a: T[], b: T[]): boolean => {
    return a.length === b.length && a.every(item => b.includes(item))
};