export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
          <main>{children}</main>
      </body>
    </html>
  )
}
