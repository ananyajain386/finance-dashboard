'use client'

import Dashboard from '@/components/Dashboard'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

export default function Home() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Dashboard />
    </DndProvider>
  )
}

