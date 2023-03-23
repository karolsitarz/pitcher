import {
  PropsWithChildren,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  TbCircleCheck,
  TbCornerLeftUp,
  TbDownload,
  TbFolder,
  TbUpload,
  TbWaveSine,
} from 'react-icons/tb'
import { IconType } from 'react-icons'
import classNames from 'classnames'
import { useDropzone } from 'react-dropzone'
import { Player } from 'react-simple-player'
import axios from 'axios'
import { useQuery } from 'react-query'
import hash from 'object-hash'
import { AnimatePresence, motion } from 'framer-motion'
import { CgSpinner } from 'react-icons/cg'
import download from 'downloadjs'

const useFileUrl = (file: File | null) => {
  const fileUrl = useMemo(() => {
    if (!file) return null
    return URL.createObjectURL(file)
  }, [file])

  useEffect(() => {
    if (!fileUrl) return
    return () => {
      URL.revokeObjectURL(fileUrl)
    }
  }, [fileUrl])

  return fileUrl
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState(0)
  const [pitch, setPitch] = useState(0)
  const [uploading, setUploading] = useState(true)

  const fileUrl = useFileUrl(file)

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      'audio/mpeg': ['.mp3'],
    },
    noKeyboard: true,
    noClick: true,
    multiple: false,
    noDragEventsBubbling: true,
    onDrop: async (acceptedFiles: File[]) => {
      const file = acceptedFiles?.[0]
      if (!file) return

      if (file.size > 8 * 1024 * 1024) {
        return
      }

      setFile(file)
      setStep(1)
      setPitch(0)
    },
  })

  const pitchQuery = useQuery(
    ['pitch', pitch, hash(file)],
    () => {
      const data = new FormData()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      data.append('file', file!)
      data.append('pitch', pitch.toString())

      return axios({
        url: window.location.origin + '/api/pitch',
        method: 'POST',
        headers: { 'content-type': 'multipart/form-data' },
        data,
        responseType: 'blob',
        onUploadProgress: (e) => setUploading(!e?.progress || e.progress < 1),
      }).then((res) => new File([res.data], 'file.mp3')) as Promise<File>
    },
    {
      enabled: !!pitch && !!file && step === 2,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      refetchOnMount: false,
      retry: 0,
    },
  )
  const newFileUrl = useFileUrl(pitchQuery?.data || null)

  return (
    <main
      className="flex flex-col min-h-full w-full p-2 sm:p-6 md:p-8 text-lg overflow-y-auto gap-4"
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col max-w-screen-md w-full grow mx-auto gap-2">
        <div className="bg-white rounded-2xl w-full flex flex-col p-8">
          <h1 className="font-bold text-3xl text-center">
            Welcome to <span className="text-sky-600">Pitcher</span>!
          </h1>
          <p className="text-base text-center text-gray-500 mt-4">
            {`Pitcher is a tiny tool to transpose mp3 files. Just upload the file, select the pitch, and you're set! Enjoy!`}
          </p>
        </div>

        <TbWaveSine className="text-2xl mx-auto my-2 text-gray-400" />

        <div
          className={classNames(
            'absolute-cover p-4 z-20 pointer-events-none bg-white bg-opacity-50 filter transition backdrop-blur opacity-0',
            isDragActive && 'opacity-100',
          )}
        >
          <div className="w-full h-full border-4 rounded-lg border-dashed border-gray-300 flex flex-col gap-4 text-center items-center justify-center text-gray-500">
            <TbUpload className="text-5xl" strokeWidth={3} />
            <div className="text-xl font-bold">Drop files here...</div>
          </div>
        </div>

        <Step
          icon={TbFolder}
          text="Choose file"
          active={0 <= step}
          header={
            <>
              {!!fileUrl && (
                <div
                  className="flex text-center justify-center items-center px-4 py-2.5 -my-2 -mr-2 bg-gray-100 gap-2 text-sm font-normal rounded-xl cursor-pointer transition hover:bg-gray-200"
                  onClick={() => {
                    setFile(null)
                    setStep(0)
                    setPitch(0)
                  }}
                >
                  <TbCornerLeftUp className="text-lg shrink-0" /> Change file
                </div>
              )}
            </>
          }
        >
          {!fileUrl ? (
            <div
              onClick={open}
              className="flex justify-center text-center items-center p-4 bg-transparent border-4 border-dashed border-gray-200 gap-3 text-lg rounded-xl cursor-pointer transition hover:bg-sky-50"
            >
              <TbUpload className="text-xl" /> Upload audio
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="[&>span>button+span]:!cursor-pointer [&_svg]:!fill-gray-600 [&>span>span]:!text-gray-600 grow [&>span]:rounded-xl">
                <Player
                  src={fileUrl}
                  height={40}
                  hideVolume
                  grey={[229, 231, 235]}
                  accent={[2, 132, 199]}
                />
              </div>
              <div className="mx-auto text-base text-gray-500">
                {file?.name}
              </div>
            </div>
          )}
        </Step>
        <Step icon={TbWaveSine} text="Select pitch" active={1 <= step}>
          <div className="grid grid-cols-4 sm:grid-cols-9 mx-auto gap-1 m-auto">
            {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((value) => (
              <PitchButton
                key={value}
                value={value}
                active={value === pitch}
                onClick={() => {
                  setPitch(value)
                  setStep(2)
                }}
              />
            ))}
          </div>
        </Step>
        <Step
          icon={TbCircleCheck}
          text="Done!"
          active={2 <= step}
          header={
            <>
              {pitchQuery.isSuccess && !!file && (
                <div
                  className="flex text-center justify-center items-center px-4 py-2.5 -my-2 -mr-2 bg-gray-100 gap-2 text-sm font-normal rounded-xl cursor-pointer transition hover:bg-gray-200"
                  onClick={() => {
                    download(
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      pitchQuery.data!,
                      `${pitch} ${file?.name ?? 'sound.mp3'}`,
                      'audio/mpeg',
                    )
                  }}
                >
                  <TbDownload className="text-lg" /> Download
                </div>
              )}
            </>
          }
        >
          {pitchQuery.isLoading ? (
            <div className="flex items-center gap-2 m-auto text-base text-gray-500">
              <CgSpinner className="animate-spin text-3xl text-gray-400" />
              {uploading ? 'Uploading...' : 'Processing...'}
            </div>
          ) : (
            <>
              <div className="[&>span>button+span]:!cursor-pointer [&_svg]:!fill-gray-600 [&>span>span]:!text-gray-600 grow [&>span]:rounded-xl">
                {!!newFileUrl && (
                  <Player
                    src={newFileUrl}
                    height={40}
                    hideVolume
                    grey={[229, 231, 235]}
                    accent={[2, 132, 199]}
                  />
                )}
              </div>
            </>
          )}
        </Step>
      </div>
      <footer className="mt-auto text-center bg-white p-2 text-base rounded-xl sm:-m-4 md:-m-7 !mt-8">
        Made by{' '}
        <a
          className="text-sky-600 hover:underline cursor-pointer"
          href="https://github.com/karolsitarz"
          target="_blank"
        >
          Karol
        </a>
      </footer>
    </main>
  )
}

const PitchButton = ({
  onClick,
  value,
  active,
}: {
  onClick: () => void
  value: number
  active: boolean
}) => {
  return (
    <div
      className={classNames(
        'flex items-center justify-center px-4 py-3 rounded-xl w-full h-full text-center text-xl font-bold transition',
        active && value ? 'bg-sky-600 text-white' : 'bg-gray-200',
        value
          ? 'hover:bg-gray-300 cursor-pointer'
          : 'opacity-50 hidden sm:flex',
      )}
      onClick={() => !!value && onClick()}
    >
      {value > 0 && '+'}
      {value}
    </div>
  )
}

const Step = ({
  icon: Icon,
  text,
  active,
  children,
  header,
}: PropsWithChildren<{
  icon: IconType
  text: string
  active?: boolean
  header?: ReactNode
}>) => (
  <div className="bg-white rounded-2xl w-full flex flex-col">
    <div className="flex gap-3 items-center font-bold py-3 px-4 leading-tight">
      <div
        className={classNames(
          'flex items-center justify-center p-1.5 rounded-lg',
          active ? 'bg-sky-600 text-white' : 'bg-sky-200 text-sky-600',
        )}
      >
        <Icon className="text-xl" />
      </div>
      {text}
      <div className="flex-grow" />
      {header}
    </div>
    <AnimatePresence>
      {active && (
        <motion.div
          className="flex flex-col overflow-hidden"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
        >
          <div className="border-b-2 border-gray-100" />
          <div className="p-4 flex flex-col">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)
