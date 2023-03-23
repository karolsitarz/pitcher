import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import {
  TbCircleCheck,
  TbCornerLeftUp,
  TbFolder,
  TbRefresh,
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

const useFileUrl = (file) => {
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

      return axios({
        url: window.location.origin + '/api/pitch',
        method: 'POST',
        headers: { 'content-type': 'multipart/form-data' },
        data,
        responseType: 'blob',
      }).then((res) => new File([res.data], 'file.mp3'))
    },
    {
      enabled: !!pitch && !!file && step === 2,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      refetchOnMount: false,
      retry: 0,
    },
  )
  const newFileUrl = useFileUrl(pitchQuery?.data)

  return (
    <main
      className="flex flex-col max-w-screen-lg w-full mx-auto px-8 py-12 text-lg overflow-y-auto gap-2"
      {...getRootProps()}
    >
      <input {...getInputProps()} />
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

      <Step icon={TbFolder} text="Choose file" active={0 <= step}>
        {!fileUrl ? (
          <div
            onClick={open}
            className="flex justify-center text-center items-center p-4 bg-transparent border-4 border-dashed border-gray-200 gap-3 text-lg rounded-xl cursor-pointer transition hover:bg-sky-50"
          >
            <TbUpload className="text-xl" /> Upload audio
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="[&>span>button+span]:!cursor-pointer [&_svg]:!fill-gray-600 [&>span>span]:!text-gray-600 grow [&>span]:rounded-xl">
              <Player
                src={fileUrl}
                height={40}
                hideVolume
                grey={[229, 231, 235]}
                accent={[2, 132, 199]}
              />
            </div>
            <div
              className="flex text-center justify-center items-center px-3 py-1 bg-gray-200 gap-2 text-base rounded-xl cursor-pointer transition hover:bg-gray-300"
              onClick={() => {
                setFile(null)
                setStep(0)
                setPitch(0)
              }}
            >
              <TbCornerLeftUp className="text-xl" /> Change audio
            </div>
          </div>
        )}
      </Step>
      <Step icon={TbWaveSine} text="Select pitch" active={1 <= step}>
        <div className="grid grid-cols-9 mx-auto gap-1 m-auto">
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
      <Step icon={TbCircleCheck} text="Done!" active={2 <= step}>
        {pitchQuery.isLoading ? (
          <CgSpinner className="m-auto animate-spin text-3xl text-gray-400" />
        ) : (
          <>
            <div className="flex gap-2">
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
              <div
                className="flex text-center justify-center items-center px-3 py-1 bg-gray-200 gap-2 text-base rounded-xl cursor-pointer transition hover:bg-gray-300"
                onClick={() => pitchQuery.refetch()}
              >
                <TbRefresh className="text-xl" /> Refetch
              </div>
            </div>
          </>
        )}
      </Step>
    </main>
  )
}

const PitchButton = ({ onClick, value, active }) => {
  return (
    <div
      className={classNames(
        'flex items-center justify-center px-4 py-3 rounded-xl w-full h-full text-center text-xl font-bold transition',
        active && value ? 'bg-sky-600 text-white' : 'bg-gray-200',
        value ? 'hover:bg-gray-300 cursor-pointer' : 'opacity-50',
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
}: PropsWithChildren<{
  icon: IconType
  text: string
  active?: boolean
}>) => (
  <div className="bg-white rounded-2xl w-full flex flex-col">
    <div className="flex gap-3 items-center font-bold py-3 px-4">
      <div
        className={classNames(
          'flex items-center justify-center p-1.5 rounded-lg',
          active ? 'bg-sky-600 text-white' : 'bg-sky-200 text-sky-600',
        )}
      >
        <Icon className="text-xl" />
      </div>
      {text}
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
