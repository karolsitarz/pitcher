import { useEffect, useMemo } from 'react'

export const useFileUrl = (file: File | null) => {
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
