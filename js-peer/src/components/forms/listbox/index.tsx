import {
  Listbox as HeadlessListbox,
  ListboxButton as HeadlessListboxButton,
  ListboxOption as HeadlessListboxOption,
  ListboxOptions as HeadlessListboxOptions,
  ListboxSelectedOption as HeadlessListboxSelectedOption,
  Transition as HeadlessTransition,
} from '@headlessui/react'
import { clsx } from 'clsx'
import { Fragment } from 'react'
import { listboxStyles } from './styles'
import type { ListboxProps, ListboxOptionProps, ListboxLabelProps, ListboxDescriptionProps } from './types'

export function Listbox<T>({
  className,
  placeholder,
  autoFocus,
  'aria-label': ariaLabel,
  children: options,
  ...props
}: ListboxProps<T>) {
  return (
    <HeadlessListbox {...props} multiple={false}>
      <HeadlessListboxButton
        autoFocus={autoFocus}
        data-slot="control"
        aria-label={ariaLabel}
        className={clsx([className, listboxStyles.container])}
      >
        <HeadlessListboxSelectedOption
          as="span"
          options={options}
          placeholder={placeholder && <span className="block truncate text-zinc-500">{placeholder}</span>}
          className={clsx(listboxStyles.button)}
        />
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className="size-5 stroke-zinc-500 group-data-[disabled]:stroke-zinc-600 sm:size-4 dark:stroke-zinc-400 forced-colors:stroke-[CanvasText]"
            viewBox="0 0 16 16"
            aria-hidden="true"
            fill="none"
          >
            <path d="M5.75 10.75L8 13L10.25 10.75" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.25 5.25L8 3L5.75 5.25" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </HeadlessListboxButton>
      <HeadlessTransition
        leave="transition-opacity duration-100 ease-in pointer-events-none"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <HeadlessListboxOptions anchor="selection start" className={clsx(listboxStyles.options.container)}>
          {options}
        </HeadlessListboxOptions>
      </HeadlessTransition>
    </HeadlessListbox>
  )
}

export function ListboxOption<T>({ children, className, ...props }: ListboxOptionProps<T>) {
  const sharedClasses = clsx(listboxStyles.options.shared)

  return (
    <HeadlessListboxOption as={Fragment} {...props}>
      {({ selectedOption }) => {
        if (selectedOption) {
          return <div className={clsx(className, sharedClasses)}>{children}</div>
        }

        return (
          <div className={clsx(listboxStyles.options.item)}>
            <svg
              className="relative hidden size-5 self-center stroke-current group-data-[selected]/option:inline sm:size-4"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path d="M4 8.5l3 3L12 4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={clsx(className, sharedClasses, 'col-start-2')}>{children}</span>
          </div>
        )
      }}
    </HeadlessListboxOption>
  )
}

export function ListboxLabel({ className, children, ...props }: ListboxLabelProps) {
  return (
    <span className={clsx(className, listboxStyles.options.label)} {...props}>
      {typeof children === 'function' ? children({}) : children}
    </span>
  )
}

export function ListboxDescription({ className, children, ...props }: ListboxDescriptionProps) {
  return (
    <span className={clsx(className, listboxStyles.options.description)} {...props}>
      <span className="flex-1 truncate">{children}</span>
    </span>
  )
}
