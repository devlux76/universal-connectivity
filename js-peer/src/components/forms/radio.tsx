import {
  Field as HeadlessField,
  Radio as HeadlessRadio,
  RadioGroup as HeadlessRadioGroup,
  type RadioGroupProps as HeadlessRadioGroupProps,
  type RadioProps as HeadlessRadioProps,
} from '@headlessui/react'
import { clsx } from 'clsx'
import { FormGroup, FormField, baseControlStyles } from './base'
import type { ColorType } from './types'

export { FormGroup as RadioGroup, FormField as RadioField }

const radioColors: Record<ColorType, string> = {
  'dark/zinc': '[--radio-checked-bg:theme(colors.zinc.900)] [--radio-checked-border:theme(colors.zinc.950/90%)] [--radio-checked-indicator:theme(colors.white)] dark:[--radio-checked-bg:theme(colors.zinc.600)]',
  'dark/white': '[--radio-checked-bg:theme(colors.zinc.900)] [--radio-checked-border:theme(colors.zinc.950/90%)] [--radio-checked-indicator:theme(colors.white)] dark:[--radio-checked-bg:theme(colors.white)] dark:[--radio-checked-border:theme(colors.zinc.950/15%)] dark:[--radio-checked-indicator:theme(colors.zinc.900)]',
  dark: '[--radio-checked-bg:theme(colors.zinc.900)] [--radio-checked-border:theme(colors.zinc.950/90%)] [--radio-checked-indicator:theme(colors.white)]',
  zinc: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.zinc.600)] [--radio-checked-border:theme(colors.zinc.700/90%)]',
  red: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.red.600)] [--radio-checked-border:theme(colors.red.700/90%)]',
  orange: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.orange.500)] [--radio-checked-border:theme(colors.orange.600/90%)]',
  amber: '[--radio-checked-bg:theme(colors.amber.400)] [--radio-checked-border:theme(colors.amber.500/80%)] [--radio-checked-indicator:theme(colors.amber.950)]',
  yellow: '[--radio-checked-bg:theme(colors.yellow.300)] [--radio-checked-border:theme(colors.yellow.400/80%)] [--radio-checked-indicator:theme(colors.yellow.950)]',
  lime: '[--radio-checked-bg:theme(colors.lime.300)] [--radio-checked-border:theme(colors.lime.400/80%)] [--radio-checked-indicator:theme(colors.lime.950)]',
  green: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.green.600)] [--radio-checked-border:theme(colors.green.700/90%)]',
  emerald: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.emerald.600)] [--radio-checked-border:theme(colors.emerald.700/90%)]',
  teal: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.teal.600)] [--radio-checked-border:theme(colors.teal.700/90%)]',
  cyan: '[--radio-checked-bg:theme(colors.cyan.300)] [--radio-checked-border:theme(colors.cyan.400/80%)] [--radio-checked-indicator:theme(colors.cyan.950)]',
  sky: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.sky.500)] [--radio-checked-border:theme(colors.sky.600/80%)]',
  blue: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.blue.600)] [--radio-checked-border:theme(colors.blue.700/90%)]',
  indigo: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.indigo.500)] [--radio-checked-border:theme(colors.indigo.600/90%)]',
  violet: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.violet.500)] [--radio-checked-border:theme(colors.violet.600/90%)]',
  purple: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.purple.500)] [--radio-checked-border:theme(colors.purple.600/90%)]',
  fuchsia: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.fuchsia.500)] [--radio-checked-border:theme(colors.fuchsia.600/90%)]',
  pink: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.pink.500)] [--radio-checked-border:theme(colors.pink.600/90%)]',
  rose: '[--radio-checked-indicator:theme(colors.white)] [--radio-checked-bg:theme(colors.rose.500)] [--radio-checked-border:theme(colors.rose.600/90%)]',
}

const baseStyles = [
  ...baseControlStyles.layout,
  'size-[1.1875rem] sm:size-[1.0625rem] rounded-full',
  'before:rounded-full',
  'before:group-data-[checked]:bg-[--radio-checked-bg]',
  'dark:group-data-[checked]:bg-[--radio-checked-bg]',
  'group-data-[checked]:bg-[--radio-checked-border]',
  'dark:after:-inset-px dark:after:hidden dark:after:rounded-full dark:group-data-[checked]:after:block',
  // Indicator color (light mode)
  '[--radio-indicator:transparent] group-data-[checked]:[--radio-indicator:var(--radio-checked-indicator)]',
  'group-data-[checked]:group-data-[hover]:[--radio-indicator:var(--radio-checked-indicator)]',
  'group-data-[hover]:[--radio-indicator:theme(colors.zinc.900/10%)]',
  // Indicator color (dark mode)
  'dark:group-data-[checked]:group-data-[hover]:[--radio-indicator:var(--radio-checked-indicator)]',
  'dark:group-data-[hover]:[--radio-indicator:theme(colors.zinc.700)]',
  ...baseControlStyles.states.checked,
  ...baseControlStyles.states.disabled,
]

export interface RadioProps extends Omit<HeadlessRadioProps, 'children'> {
  color?: ColorType
  className?: string
}

export function Radio({ color = 'dark/zinc', className, ...props }: RadioProps) {
  return (
    <HeadlessRadio
      data-slot="control"
      {...props}
      className={clsx(className, 'group inline-flex focus:outline-none')}
    >
      <span className={clsx([baseStyles, radioColors[color]])}>
        <span
          className={clsx(
            'size-full rounded-full border-[4.5px] border-transparent bg-[--radio-indicator] bg-clip-padding',
            // Forced colors mode
            'forced-colors:border-[Canvas] forced-colors:group-data-[checked]:border-[Highlight]',
          )}
        />
      </span>
    </HeadlessRadio>
  )
}