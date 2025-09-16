import "../styles/globals.css";

export const metadata = {
  title: "Jeju Travel Planner",
  description: "제주 여행 플래너 (Leaflet 지도, 일정/카테고리/경로 안내)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}