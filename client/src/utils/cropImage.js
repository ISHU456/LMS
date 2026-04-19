export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })

export function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

/**
 * This function was adapted from the one in the react-easy-crop project.
 * @param {File} image - Image File url
 * @param {Object} pixelCrop - pixelCrop Object provided by react-easy-crop
 * @param {number} rotation - optional rotation parameter
 */
export default async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  const rotRad = getRadianAngle(rotation)

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // Fill white background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, bBoxWidth, bBoxHeight)

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.translate(-image.width / 2, -image.height / 2)

  // draw rotated image
  ctx.drawImage(image, 0, 0)

  // Create final cropped canvas
  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')
  
  croppedCanvas.width = pixelCrop.width
  croppedCanvas.height = pixelCrop.height
  
  // Fill with white
  croppedCtx.fillStyle = 'white'
  croppedCtx.fillRect(0, 0, croppedCanvas.width, croppedCanvas.height)
  
  // Draw the cropped portion
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Resize if necessary
  const MAX_SIZE = 512;
  if (pixelCrop.width > MAX_SIZE || pixelCrop.height > MAX_SIZE) {
    const scale = Math.min(MAX_SIZE / pixelCrop.width, MAX_SIZE / pixelCrop.height);
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = pixelCrop.width * scale;
    scaledCanvas.height = pixelCrop.height * scale;
    const scaledCtx = scaledCanvas.getContext('2d');
    scaledCtx.drawImage(croppedCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
    return scaledCanvas.toDataURL('image/jpeg', 0.9);
  }

  // As Base64 string
  return croppedCanvas.toDataURL('image/jpeg', 0.9);

  // As a blob
  // return new Promise((resolve, reject) => {
  //   canvas.toBlob((file) => {
  //     resolve(URL.createObjectURL(file))
  //   }, 'image/jpeg')
  // })
}
