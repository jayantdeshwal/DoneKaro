import React from 'react'

export interface AppLogoProps {
  className?: string
  size?: number
  alt?: string
}

/**
 * DoneKaro Official Brand Logo Component
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-8 h-8',
  size,
  alt = 'DoneKaro',
}) => {
  const style = size ? { width: size, height: size } : undefined

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden rounded-xl shadow-xs transition-transform ${className}`}
      style={style}
    >
      <img
        src="/app-logo.png"
        alt={alt}
        className="w-full h-full object-cover rounded-xl"
        loading="eager"
        decoding="async"
      />
    </div>
  )
}

export const DoneKaroLogo = AppLogo
export default AppLogo
