import type { DescriptionProps as HeadlessDescriptionProps, FieldProps as HeadlessFieldProps, LabelProps as HeadlessLabelProps } from '@headlessui/react'
import type { ComponentPropsWithoutRef } from 'react'

// Base form control props without className
interface BaseFormControlProps {
  disabled?: boolean
}

// Extended form control props for regular components
export interface FormControlProps extends BaseFormControlProps, Pick<ComponentPropsWithoutRef<'div'>, 'className'> {}

// Extended form control props for HeadlessUI components
export interface HeadlessFormControlProps extends BaseFormControlProps {
  className?: string | ((bag: { disabled: boolean }) => string)
}

export interface FormGroupProps extends ComponentPropsWithoutRef<'div'>, FormControlProps {}
export interface FormFieldProps extends ComponentPropsWithoutRef<'div'>, FormControlProps {}
export interface FormLabelProps extends Omit<HeadlessLabelProps, 'className'>, HeadlessFormControlProps {}
export interface FormDescriptionProps extends Omit<HeadlessDescriptionProps, 'className'>, HeadlessFormControlProps {}

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
