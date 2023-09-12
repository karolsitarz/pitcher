import classNames from 'classnames'

export const PitchButton = ({
  onClick,
  value,
  active,
}: {
  onClick: () => void
  value: number
  active: boolean
}) => (
  <div
    className={classNames(
      'flex items-center justify-center px-4 py-3 rounded-xl w-full h-full text-center text-xl font-bold transition',
      active && value ? 'bg-sky-600 text-white' : 'bg-gray-200',
      value ? 'hover:bg-gray-300 cursor-pointer' : 'opacity-50 hidden sm:flex',
    )}
    onClick={() => !!value && onClick()}
  >
    {value > 0 && '+'}
    {value}
  </div>
)
