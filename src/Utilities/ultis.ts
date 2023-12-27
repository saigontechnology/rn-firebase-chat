export const haveSameContents = <T>(a: T[], b: T[]): boolean => {
    for (const v of new Set([...a, ...b]))
        if (a.filter(e => e === v).length !== b.filter(e => e === v).length)
            return false;
    return true;
};