import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import LibraryView from './views/LibraryView'
import ChatView from './views/ChatView'
import SettingsView from './views/SettingsView'

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/library" element={<LibraryView />} />
        <Route path="/chat" element={<ChatView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Route>
    </Routes>
  )
}

