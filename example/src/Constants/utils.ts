export function isImageUrl(url: string): boolean {
    const link = url.toLowerCase()
    const imageExtension = ['jpg', 'jpeg', 'png']
    imageExtension.forEach((item, index) => {
        if (link.includes(item)) {
            return true
        }
    })
    return false;
}