export const listboxStyles = {
  container: [
    // Basic layout
    'relative block w-full',

    // Background color + shadow
    'before:absolute before:inset-px before:rounded-[calc(theme(borderRadius.lg)-1px)] before:bg-white before:shadow',
    'dark:before:hidden',

    // Focus ring
    'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-inset after:ring-transparent sm:after:data-[focus]:ring-2 sm:after:data-[focus]:ring-blue-500',

    // Disabled state
    'data-[disabled]:opacity-50 before:data-[disabled]:bg-zinc-950/5 before:data-[disabled]:shadow-none',
  ],
  button: [
    // Basic layout
    'relative block w-full appearance-none rounded-lg py-[calc(theme(spacing[2.5])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]',
    'min-h-11 sm:min-h-9',
    'pl-[calc(theme(spacing[3.5])-1px)] pr-[calc(theme(spacing.7)-1px)] sm:pl-[calc(theme(spacing.3)-1px)]',

    // Typography
    'text-left text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]',

    // Border
    'border border-zinc-950/10 group-data-[active]:border-zinc-950/20 group-data-[hover]:border-zinc-950/20',
    'dark:border-white/10 dark:group-data-[active]:border-white/20 dark:group-data-[hover]:border-white/20',

    // Background
    'bg-transparent dark:bg-white/5',

    // Invalid state
    'group-data-[invalid]:border-red-500 group-data-[invalid]:group-data-[hover]:border-red-500',
    'group-data-[invalid]:dark:border-red-600 group-data-[invalid]:data-[hover]:dark:border-red-600',

    // Disabled state
    'group-data-[disabled]:border-zinc-950/20 group-data-[disabled]:opacity-100',
    'dark:group-data-[hover]:group-data-[disabled]:border-white/15 group-data-[disabled]:dark:border-white/15',
    'group-data-[disabled]:dark:bg-white/[2.5%]',
  ],
  options: {
    container: [
      // Anchor positioning
      '[--anchor-offset:-1.625rem] [--anchor-padding:theme(spacing.4)] sm:[--anchor-offset:-1.375rem]',

      // Base styles
      'isolate w-max min-w-[calc(var(--button-width)+1.75rem)] select-none scroll-py-1 rounded-xl p-1',

      // Focus outline
      'outline outline-1 outline-transparent focus:outline-none',

      // Scrolling
      'overflow-y-scroll overscroll-contain',

      // Background
      'bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75',

      // Shadows
      'shadow-lg ring-1 ring-zinc-950/10 dark:ring-inset dark:ring-white/10',
    ],
    item: [
      // Basic layout
      'group/option grid cursor-default grid-cols-[theme(spacing.5),1fr] items-baseline gap-x-1.5',
      'rounded-lg py-2.5 pl-2.5 pr-3.5 sm:grid-cols-[theme(spacing.4),1fr] sm:py-1.5 sm:pl-2 sm:pr-3',

      // Typography
      'text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]',

      // Focus
      'outline-none data-[focus]:bg-blue-500 data-[focus]:text-white',

      // Forced colors mode
      'forced-color-adjust-none forced-colors:data-[focus]:bg-[Highlight] forced-colors:data-[focus]:text-[HighlightText]',

      // Disabled
      'data-[disabled]:opacity-50',
    ],
    icon: [
      'stroke-zinc-500 group-data-[disabled]:stroke-zinc-600 sm:size-4',
      'dark:stroke-zinc-400 forced-colors:stroke-[CanvasText]',
    ],
    label: [
      'ml-2.5 truncate first:ml-0 sm:ml-2 sm:first:ml-0',
    ],
    description: [
      'flex flex-1 overflow-hidden text-zinc-500',
      'before:w-2 before:min-w-0 before:shrink',
      'group-data-[focus]/option:text-white dark:text-zinc-400',
    ],
    shared: [
      // Base layout
      'flex min-w-0 items-center',

      // Icons
      '[&>[data-slot=icon]]:size-5 [&>[data-slot=icon]]:shrink-0 [&>[data-slot=icon]]:text-zinc-500',
      '[&>[data-slot=icon]]:group-data-[focus]/option:text-white sm:[&>[data-slot=icon]]:size-4',
      'forced-colors:[&>[data-slot=icon]]:text-[CanvasText]',
      'forced-colors:[&>[data-slot=icon]]:group-data-[focus]/option:text-[Canvas]',

      // Avatars
      '[&>[data-slot=avatar]]:size-6 sm:[&>[data-slot=avatar]]:size-5',
    ]
  }
}