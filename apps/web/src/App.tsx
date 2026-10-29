import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './features/dashboard/page'

export default function App() {
  return (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  )
}
