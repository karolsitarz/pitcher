import { PropsWithChildren, ReactNode } from 'react'
import { IconType } from 'react-icons'
import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'

export const Step = ({
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
