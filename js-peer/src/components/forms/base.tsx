import { clsx } from 'clsx'
import type { FormGroupProps, FormFieldProps } from './types'

export function FormGroup({ className, ...props }: FormGroupProps) {
  return (
    <div
      data-slot="control"
      {...props}
      className={clsx(
        className,
        'space-y-3',
        'has-[[data-slot=description]]:space-y-6 [&_[data-slot=label]]:has-[[data-slot=description]]:font-medium',
      )}
    />
  )
}

export function FormField({ className, children, ...props }: FormFieldProps & { children: React.ReactNode }) {
  return (
    <div
      data-slot="field"
      {...props}

      className={clsx(
        className,
        // Base layout
        'grid grid-cols-[1.125rem_1fr] items-center gap-x-4 gap-y-1 sm:grid-cols-[1rem_1fr]',

        // Control layout
        '[&>[data-slot=control]]:col-start-1 [&>[data-slot=control]]:row-start-1 [&>[data-slot=control]]:justify-self-center',

        // Label layout
        '[&>[data-slot=label]]:col-start-2 [&>[data-slot=label]]:row-start-1 [&>[data-slot=label]]:justify-self-start',

        // Description layout
        '[&>[data-slot=description]]:col-start-2 [&>[data-slot=description]]:row-start-2',

        // With description
        '[&_[data-slot=label]]:has-[[data-slot=description]]:font-medium',
      )}
    />
  )
}

export const baseControlStyles = {
  layout: [
    // Basic layout
    'relative isolate flex items-center justify-center',

    // Background color + shadow applied to inset pseudo element
    'before:absolute before:inset-0 before:-z-10 before:bg-white before:shadow',

    // Dark mode adjustments
    'dark:before:hidden',
    'dark:bg-white/5',

    // Border styles
    'border border-zinc-950/15',
    'dark:border-white/15',

    // Hover states
    'group-data-[hover]:border-zinc-950/30',
    'dark:group-data-[hover]:border-white/30',

    // Focus ring
    'group-data-[focus]:outline group-data-[focus]:outline-2 group-data-[focus]:outline-offset-2 group-data-[focus]:outline-blue-500',

    // Inner highlight shadow
    'after:absolute after:inset-0 after:shadow-[inset_0_1px_theme(colors.white/15%)]',
  ],
  states: {
    checked: [
      'group-data-[checked]:border-transparent',
      'group-data-[checked]:group-data-[hover]:border-transparent',
      'dark:group-data-[checked]:border-white/5',
      'dark:group-data-[checked]:group-data-[hover]:border-white/5',
    ],
    disabled: [
      'group-data-[disabled]:opacity-50',
      'group-data-[disabled]:border-zinc-950/25',
      'group-data-[disabled]:bg-zinc-950/5',
      'dark:group-data-[disabled]:border-white/20',
      'dark:group-data-[disabled]:bg-white/[2.5%]',
    ],
  },
}
