// Parallel route: `modal` slot renders intercepted auth routes as an overlay on
// top of the landing (@modal/(.)login, @modal/(.)register). On a direct visit or
// refresh the slot falls back to @modal/default.tsx (null) and the full page shows.
export default function AheadOfTheMenuLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
