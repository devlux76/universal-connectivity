import {
  type ListboxProps as HeadlessListboxProps,
  type ListboxOptionProps as HeadlessListboxOptionProps,
  type LabelProps as HeadlessLabelProps,
  type DescriptionProps as HeadlessDescriptionProps,
} from '@headlessui/react'
import { Fragment } from 'react'

export interface ListboxBaseProps {
  className?: string
  placeholder?: React.ReactNode
  autoFocus?: boolean
  'aria-label'?: string
  children?: React.ReactNode
}

export interface ListboxProps<T> extends ListboxBaseProps, Omit<HeadlessListboxProps<typeof Fragment, T>, 'multiple' | 'children'> {
  children?: React.ReactNode
}

export interface ListboxOptionProps<T> extends Omit<HeadlessListboxOptionProps<'div', T>, 'children'> {
  children?: React.ReactNode
  className?: string
}

export interface ListboxLabelProps extends HeadlessLabelProps {
  className?: string
}

export interface ListboxDescriptionProps extends HeadlessDescriptionProps {
  className?: string
  children?: React.ReactNode
}
