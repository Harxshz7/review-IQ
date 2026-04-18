import React from 'react'

const cardVariants = {
  default: 'bg-white border border-gray-200 shadow-sm',
  elevated: 'bg-white border border-gray-200 shadow-md',
  outlined: 'bg-white border-2 border-gray-300',
  glass: 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg'
}

export default function Card({
  children,
  variant = 'default',
  className = '',
  padding = 'p-6',
  ...props
}) {
  const baseClasses = 'rounded-lg'
  const variantClasses = cardVariants[variant] || cardVariants.default

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-sm text-gray-600 mt-1 ${className}`} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  )
}
