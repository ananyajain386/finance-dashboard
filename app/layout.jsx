import './globals.css'
import 'sweetalert2/dist/sweetalert2.min.css'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata = {
  title: 'Finance Dashboard',
  description: 'Customizable Finance Dashboard with real-time data',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-black">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

