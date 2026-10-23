export const metadata = {
  title: 'NEXA — Phòng Thi Trực Tiếp',
  description: 'Không gian phòng thi trực tiếp và phòng chờ khảo thí năng lực số',
};

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 overflow-x-hidden flex flex-col">
      {children}
    </div>
  );
}
