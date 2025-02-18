import type { HeadlessDescriptionProps, HeadlessFieldProps, HeadlessLabelProps } from '@headlessui/react'
import type { ComponentPropsWithoutRef } from 'react'

export interface FormControlProps {
  className?: string
  disabled?: boolean
}

export interface FormGroupProps extends ComponentPropsWithoutRef<'div'>, FormControlProps {}

export interface FormFieldProps extends HeadlessFieldProps, FormControlProps {}

export interface FormLabelProps extends HeadlessLabelProps, FormControlProps {}

export interface FormDescriptionProps extends HeadlessDescriptionProps, FormControlProps {}

export interface ColorVariant {
  'dark/zinc': string[]
  'dark/white': string[]
  dark: string
  zinc: string
  red: string
  orange: string
  amber: string
  yellow: string
  lime: string
  green: string
  emerald: string
  teal: string
  cyan: string
  sky: string
  blue: string
  indigo: string
  violet: string
  purple: string
  fuchsia: string
  pink: string
  rose: string
}

export type ColorType = keyof ColorVariant