'use client'

import { useRef } from 'react'
import { useDrop } from 'react-dnd'
import DraggableWidget from './DraggableWidget'

export default function DashboardDropZone({ widgets, moveWidget, onAddWidget }) {
  const dropRef = useRef(null)

  const [{ isOver }, drop] = useDrop({
    accept: 'widget',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  drop(dropRef)

  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-7">
          <svg className="w-12 h-12 text-gray-400 dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Connect to APIs and build your custom dashboard
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Get started by adding your first widget
        </p>
        <button
          onClick={onAddWidget}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          Add Your First Widget
        </button>
      </div>
    )
  }

  return (
    <div
      ref={dropRef}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px] ${
        isOver ? 'bg-primary-50 dark:bg-primary-900/10' : ''
      } transition-colors rounded-lg p-2`}
    >
      {widgets.map((widget, index) => (
        <DraggableWidget
          key={widget.id}
          widget={widget}
          index={index}
          moveWidget={moveWidget}
        />
      ))}

      <div
        onClick={onAddWidget}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[300px]"
      >
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Add Widget
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Connect to a finance API and create a custom widget
        </p>
      </div>
    </div>
  )
}

