export function isImageUrl(url: string): boolean {
    const link = url.toLowerCase();
    const imageExtension = ['jpg', 'jpeg', 'png'];
    return imageExtension.some(extension => link.includes(extension));
}