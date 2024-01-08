export const isImageUrl = (url: string) => {
  const pattern = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|jpeg|bmp|webp|svg)$/
  return pattern.test(url)
}
