import { forwardRef, useMemo } from 'react';
import { ConfigProvider, theme } from 'antd';
import AntDatePicker from 'antd/es/date-picker';
import dayjs from 'dayjs';
import { cn } from '@xanh/utils';

const AntRangePicker = AntDatePicker.RangePicker;

const calendarTheme = {
  algorithm: theme.darkAlgorithm,
  components: {
    DatePicker: {
      cellHoverBg: '#2A3A4A',
      cellActiveWithRangeBg: '#003b32',
      cellRangeBorderColor: '#00C7A5',
      cellHoverBorderColor: '#00C7A5',
    },
  },
};

export interface DateRangeValue {
  from: string;
  to: string;
}

export interface DateRangeProps {
  value: DateRangeValue | undefined;
  onChange: ((value: DateRangeValue) => void) | undefined;
  className?: string;
  picker?: 'date' | 'month' | 'quarter' | 'year';
  format?: string;
  placeholder?: [string, string];
}

export const DateRange = forwardRef<any, DateRangeProps>(
  ({ value, onChange, className, picker = 'date', format = 'DD/MM/YYYY', placeholder = ['Từ ngày', 'Đến ngày'] }, ref) => {
    const dayjsValue = useMemo(() => {
      if (value?.from && value?.to) {
        try {
          return [dayjs(value.from), dayjs(value.to)];
        } catch {
          return undefined;
        }
      }
      return undefined;
    }, [value?.from, value?.to]);

    return (
      <ConfigProvider theme={calendarTheme}>
        <AntRangePicker
          picker={picker}
          value={dayjsValue as any}
          onChange={(dates: any) => {
            if (dates && dates[0] && dates[1] && onChange) {
              onChange({
                from: dates[0].format('YYYY-MM-DD'),
                to: dates[1].format('YYYY-MM-DD'),
              });
            } else if (onChange) {
              onChange({ from: '', to: '' });
            }
          }}
          className={cn("w-full", className)}
          format={format}
          placeholder={placeholder}
          separator="—"
          allowClear
          ref={ref}
        />
      </ConfigProvider>
    );
  },
);
DateRange.displayName = 'DateRange';
