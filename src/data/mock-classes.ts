export interface ClassGroup {
  id: string;
  code: string;
  name: string;
  shortCode: string;
  avatarBg: string;
  evaluatorName: string;
  institution: string;
  memberCount: number;
  unreadPostsCount: number;
  pendingAssignmentsCount: number;
  filesCount: number;
}

export const mockClassGroups: ClassGroup[] = [
  {
    id: 'dhqg-tin-hoc-03',
    code: 'DHQG24',
    name: 'Tin học ứng dụng & Năng lực số - Nhóm 03',
    shortCode: 'TH',
    avatarBg: 'bg-sky-600',
    evaluatorName: 'TS. Nguyễn Văn Hùng',
    institution: 'Khoa CNTT - ĐHQG Hà Nội',
    memberCount: 42,
    unreadPostsCount: 3,
    pendingAssignmentsCount: 2,
    filesCount: 6,
  },
  {
    id: 'ai-pro-k24',
    code: 'AI-PRO8',
    name: 'Kỹ năng làm việc cùng AI & Tự động hóa công việc',
    shortCode: 'AI',
    avatarBg: 'bg-emerald-600',
    evaluatorName: 'ThS. Trần Thu Trang',
    institution: 'Học viện Đổi mới Sáng tạo NEXA',
    memberCount: 28,
    unreadPostsCount: 1,
    pendingAssignmentsCount: 1,
    filesCount: 4,
  },
  {
    id: 'an-toan-thong-tin-k49',
    code: 'SEC26',
    name: 'An toàn Thông tin & Bảo vệ Dữ liệu Cá nhân',
    shortCode: 'AT',
    avatarBg: 'bg-amber-600',
    evaluatorName: 'ThS. Lê Hoàng Long',
    institution: 'Trung tâm Đào tạo An ninh mạng',
    memberCount: 35,
    unreadPostsCount: 0,
    pendingAssignmentsCount: 1,
    filesCount: 3,
  },
  {
    id: 'phan-tich-du-lieu-k20e',
    code: 'MIS-T2',
    name: 'Xử lý & Trực quan hóa Dữ liệu Bảng tính K20E',
    shortCode: 'DL',
    avatarBg: 'bg-slate-700',
    evaluatorName: 'TS. Nguyễn Văn Hùng',
    institution: 'Đại học Quốc gia Hà Nội',
    memberCount: 48,
    unreadPostsCount: 4,
    pendingAssignmentsCount: 0,
    filesCount: 8,
  },
];
