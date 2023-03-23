import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
import { v4 as uuid } from 'uuid'
import Formidable, { Fields, File as FFile, Files } from 'formidable'
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import { Duplex } from 'stream'

const ffmpeg = createFFmpeg({
  log: true,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(404).json({ message: 'Method not found' })
  }
  try {
    const parsedFile: FFile = await new Promise((resolve, reject) => {
      const form = new Formidable.IncomingForm()

      form.parse(req, (err, fields: Fields, files: Files) => {
        if (err) return reject(err)
        if (!files?.file || Array.isArray(files.file)) return reject()
        resolve(files.file)
      })
    })

    fs.readFile(parsedFile.filepath, async function (err, buffer) {
      if (err) throw err

      const tempFileName = uuid()
      if (!ffmpeg.isLoaded()) await ffmpeg.load()
      ffmpeg.FS('writeFile', `${tempFileName}.mp3`, await fetchFile(buffer))

      await ffmpeg.run(
        '-i',
        `${tempFileName}.mp3`,
        '-ar',
        '44100',
        `${tempFileName}-enc.mp3`,
      )

      const file = ffmpeg.FS('readFile', `${tempFileName}-enc.mp3`)
      // const file = ffmpeg.FS('readFile', `${tempFileName}.mp3`)
      // await ffmpeg.FS('unlink', `${tempFileName}.mp3`)
      // await ffmpeg.FS('unlink', `${tempFileName}-enc.mp3`)

      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': file.length,
      })
      const stream = new Duplex()
      stream.push(file)
      stream.push(null)
      return stream.pipe(res)
    })
  } catch (e) {
    return res.status(400).json({ message: e?.message })
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}
