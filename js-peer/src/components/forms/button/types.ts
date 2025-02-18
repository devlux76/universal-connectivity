import type { ButtonProps as HeadlessButtonProps } from '@headlessui/react'
import type { LinkProps } from './link'

export interface ButtonBaseProps {
  className?: string
  children: React.ReactNode
}

export interface ButtonColorProps {
  /**
   * Color variant to use. If using outline or plain, color will be ignored.
   */
  color?: keyof typeof buttonColors
  outline?: never
  plain?: never
}

export interface ButtonOutlineProps {
  color?: never
  outline: true
  plain?: never
}

export interface ButtonPlainProps {
  color?: never
  outline?: never
  plain: true
}

export type ButtonStyleProps = ButtonBaseProps & (ButtonColorProps | ButtonOutlineProps | ButtonPlainProps)

export type ButtonProps = ButtonStyleProps & (HeadlessButtonProps | React.ComponentPropsWithoutRef<typeof Link>)

export type ButtonVariantStyles = {
  solid: string[]
  outline: string[]
  plain: string[]
  colors: Record<string, string[]>
}