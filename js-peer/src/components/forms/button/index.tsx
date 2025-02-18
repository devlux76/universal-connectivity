import { Button as HeadlessButton } from '@headlessui/react'
import { clsx } from 'clsx'
import { forwardRef } from 'react'
import { Link } from '../link'
import { buttonBaseStyles, buttonStyles } from './styles'
import type { ButtonProps } from './types'

export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  { color, outline, plain, className, children, ...props },
  ref,
) {
  const styles = clsx(
    className,
    buttonBaseStyles,
    outline ? buttonStyles.outline : plain ? buttonStyles.plain : clsx(buttonStyles.solid, buttonStyles.colors[color ?? 'dark/zinc']),
  )

  return 'href' in props ? (
    <Link {...props} className={styles} ref={ref as React.ForwardedRef<HTMLAnchorElement>}>
      <TouchTarget>{children}</TouchTarget>
    </Link>
  ) : (
    <HeadlessButton {...props} className={styles} ref={ref}>
      <TouchTarget>{children}</TouchTarget>
    </HeadlessButton>
  )
})

function TouchTarget({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative -mx-[calc(theme(spacing[1.5])-theme(spacing.1))] -my-[calc(theme(spacing[1.5])-theme(spacing.1))] px-[calc(theme(spacing[1.5])-theme(spacing.1))] py-[calc(theme(spacing[1.5])-theme(spacing.1))] sm:-mx-[calc(theme(spacing[1])-theme(spacing.1))] sm:-my-[calc(theme(spacing[1])-theme(spacing.1))] sm:px-[calc(theme(spacing[1])-theme(spacing.1))] sm:py-[calc(theme(spacing[1])-theme(spacing.1))]">
      {children}
    </span>
  )
}