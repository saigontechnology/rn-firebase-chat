export function isImageUrl(url: string): boolean {
  const link = url.toLowerCase();
  const imageExtension = ['jpg', 'jpeg', 'png'];
  return imageExtension.some(extension => link.includes(extension));
}
export function isVideoUrl(url: string): boolean {
  const link = url.toLowerCase();
  const videoExtension = ['mp4', 'mov', 'avi'];
  return videoExtension.some(extension => link.includes(extension));
}
