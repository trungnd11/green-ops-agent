import { sttColumn, statusColumn, dateColumn } from "../../../../shared/components/columns";
import { DriverCell } from "../../components/DriverCell";
import type { DriverResponse } from "../../api/driver.types";

const driverStatusMap = {
  active: { label: "Hoạt động", color: "#22C55E" },
  inactive: { label: "Ngưng", color: "#8792A2" },
  blocked: { label: "Khóa", color: "#F05252" },
  pending_verification: { label: "Chờ xác minh", color: "#F59E0B" },
};

export function useDriverTable(page: number) {
  const columns = [
    sttColumn(page, 20),
    {
      title: "Tài xế",
      key: "driver",
      width: 240,
      render: (_: unknown, record: DriverResponse) => <DriverCell name={record.fullName} code={record.driverCode} />,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 140,
      render: (text: string) => (
        <span className="text-text-primary text-[13px]">{text || "—"}</span>
      ),
    },
    {
      title: "CCCD",
      dataIndex: "cccd",
      key: "cccd",
      width: 140,
      render: (text: string) => (
        <span className="text-text-secondary text-[13px]">{text || "—"}</span>
      ),
    },
    statusColumn(driverStatusMap),
    dateColumn("Ngày tham gia", "joinDate"),
  ];

  return { columns };
}
