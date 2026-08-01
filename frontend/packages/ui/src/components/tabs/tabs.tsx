import { Tabs as AntTabs } from 'antd';

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  items: { value: string; label: string }[];
  className?: string;
}

export function Tabs({ items, onValueChange, value, defaultValue, ...props }: TabsProps) {
  return (
    <AntTabs
      activeKey={value}
      defaultActiveKey={defaultValue}
      onChange={onValueChange as any}
      items={items.map((item) => ({ key: item.value, label: item.label }))}
      {...(props as any)}
    />
  );
}
