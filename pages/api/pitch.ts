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
    const [pitch, parsedFile]: [number, FFile] = await new Promise(
      (resolve, reject) => {
        const form = new Formidable.IncomingForm()

        form.parse(req, (err, fields: Fields, files: Files) => {
          if (err) return reject(err)
          if (!fields?.pitch || !files?.file || Array.isArray(files.file))
            return reject()
          const pitch = Number(fields.pitch)

          if (!pitch || pitch < -4 || pitch > 4) return reject()

          resolve([pitch, files.file])
        })
      },
    )

    fs.readFile(parsedFile.filepath, async function (err, buffer) {
      if (err) throw err

      const tempFileName = uuid()
      if (!ffmpeg.isLoaded()) await ffmpeg.load()
      ffmpeg.FS('writeFile', `${tempFileName}.mp3`, await fetchFile(buffer))

      const rate = 2 ** (pitch / 12)

      // todo: potentially build rubberband
      // await ffmpeg.run(
      //   '-i',
      //   `${tempFileName}.mp3`,
      //   '-filter:a',
      //   `rubberband=pitch=${rate}`,
      //   `${tempFileName}-enc.mp3`,
      // )

      await ffmpeg.run(
        '-i',
        `${tempFileName}.mp3`,
        '-af',
        `aresample=48000,asetrate=48000*${rate},aresample=48000,atempo=1/${rate}`,
        `${tempFileName}-enc.mp3`,
      )

      const file = ffmpeg.FS('readFile', `${tempFileName}-enc.mp3`)
      await ffmpeg.FS('unlink', `${tempFileName}.mp3`)
      await ffmpeg.FS('unlink', `${tempFileName}-enc.mp3`)

      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': file.length,
      })
      const stream = new Duplex()
      stream.push(file)
      stream.push(null)
      return stream.pipe(res)
    })
  } catch {
    return res
      .status(400)
      .json({ message: 'An error occurred! Please try again later.' })
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}
