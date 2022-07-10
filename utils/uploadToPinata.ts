import pinataSDK from '@pinata/sdk'
import 'dotenv/config'
import path from 'path'
import fs from 'fs'

const PINATA_API_KEY = process.env.PINATA_API_KEY || ''
const PINATA_API_SECRET = process.env.PINATA_API_SECRET || ''
const pinata = pinataSDK(PINATA_API_KEY, PINATA_API_SECRET)

const storeImages = async (imagesFilePath: string) => {
  const fullImagesPath = path.resolve(imagesFilePath)
  const files = fs.readdirSync(fullImagesPath)
  let responses = []

  console.log('Uploading to Pinata!')
  for (const i in files) {
    console.log(`Working on ${files[i]}...`)
    const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[i]}`)
    try {
      const response = await pinata.pinFileToIPFS(readableStreamForFile)
      responses.push(response)
    } catch (e) {
      console.error(e)
    }
  }
  return {responses, files}
}

const storeTokenUriMetadata = async (metadata: Object) => {
  try {
    const response = await pinata.pinJSONToIPFS(metadata)
    return response
  } catch (e) {
    console.error(e)
  }
  return null
}

export {storeImages, storeTokenUriMetadata}
