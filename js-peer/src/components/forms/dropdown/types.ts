import type {
  MenuProps as HeadlessMenuProps,

  MenuItemProps as HeadlessMenuItemProps,
  MenuItemsProps as HeadlessMenuItemsProps,
  MenuHeadingProps as HeadlessMenuHeadingProps,
  MenuSeparatorProps as HeadlessMenuSeparatorProps,
  LabelProps as HeadlessLabelProps,
  DescriptionProps as HeadlessDescriptionProps,
} from '@headlessui/react'
import type { ComponentPropsWithoutRef, ElementType } from 'react'


export interface DropdownProps extends HeadlessMenuProps {}

export interface DropdownButtonProps<T extends ElementType>
  extends React.ComponentProps<typeof HeadlessMenuButton<T>> {}

export interface DropdownItemProps extends HeadlessMenuItemProps<'button'> {
  href?: string
}

export interface DropdownMenuProps extends HeadlessMenuItemsProps {}

export interface DropdownHeaderProps extends ComponentPropsWithoutRef<'div'> {}

export interface DropdownHeadingProps extends HeadlessMenuHeadingProps {}

export interface DropdownSeparatorProps extends HeadlessMenuSeparatorProps {}

export interface DropdownLabelProps extends HeadlessLabelProps {}

export interface DropdownDescriptionProps extends HeadlessDescriptionProps {}

export interface DropdownShortcutProps extends HeadlessDescriptionProps<'kbd'> {
  keys: string | string[]
}
