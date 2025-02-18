import type { ListboxProps as HeadlessListboxProps, ListboxOptionProps as HeadlessListboxOptionProps } from '@headlessui/react'
import type { Fragment, ComponentPropsWithoutRef } from 'react'

export interface ListboxBaseProps {
  className?: string
  placeholder?: React.ReactNode
  autoFocus?: boolean
  'aria-label'?: string
  children?: React.ReactNode
}

export interface ListboxProps<T> extends ListboxBaseProps, Omit<HeadlessListboxProps<typeof Fragment, T>, 'multiple'> {}

export interface ListboxOptionProps<T> extends Omit<HeadlessListboxOptionProps<'div', T>, 'children'> {
  children?: React.ReactNode
  className?: string
}

export interface ListboxLabelProps extends ComponentPropsWithoutRef<'span'> {}

export interface ListboxDescriptionProps extends ComponentPropsWithoutRef<'span'> {
  children?: React.ReactNode
}