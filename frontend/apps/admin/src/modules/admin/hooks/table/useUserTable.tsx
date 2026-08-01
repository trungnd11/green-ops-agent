import { sttColumn, statusColumn, dateColumn } from "../../../../shared/components/columns";
import { UserCell } from "../../components/UserCell";
import { ContactCell } from "../../components/ContactCell";
import type { UserResponse } from "../../api/user.types";

const userStatusMap = {
  active: { label: "Đang hoạt động", color: "#22C55E" },
  inactive: { label: "Vô hiệu hóa", color: "#8792A2" },
};

export function useUserTable(page: number) {
  const columns = [
    sttColumn(page, 10),
    {
      title: "Người dùng",
      key: "fullName",
      width: 220,
      render: (_: unknown, record: UserResponse) => <UserCell name={record.fullName} username={record.username} />,
    },
    {
      title: "Thông tin liên hệ",
      key: "contact",
      width: 200,
      render: (_: unknown, record: UserResponse) => <ContactCell email={record.email} phone={record.phone} />,
    },
    statusColumn(userStatusMap as any),
    dateColumn("Lần đăng nhập cuối", "lastLogin"),
  ];

  return { columns };
}
