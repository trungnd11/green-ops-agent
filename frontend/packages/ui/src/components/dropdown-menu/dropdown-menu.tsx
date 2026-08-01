import { Dropdown } from 'antd';

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: any[];
  children?: React.ReactNode;
}

export function DropdownMenu({ trigger, items, children }: DropdownMenuProps) {
  return (
    <Dropdown menu={{ items: items || [] }} trigger={['click']}>
      {children || trigger}
    </Dropdown>
  );
}
