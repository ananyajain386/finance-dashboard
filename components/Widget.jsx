'use client'

import { useState, useEffect } from 'react'
import useDashboardStore from '@/store/useDashboardStore'
import { fetchApiData, getNestedValue } from '@/utils/api'
import { autoFormat } from '@/utils/format'
import { showConfirm, showSuccess, showError } from '@/utils/swal'
import WidgetCard from './WidgetCard'
import WidgetTable from './WidgetTable'
import WidgetChart from './WidgetChart'
import WidgetConfigModal from './WidgetConfigModal'
import clsx from 'clsx'

export default function Widget({ widget, index }) {
  const { removeWidget, updateWidget } = useDashboardStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  if (!widget || !widget.id) {
    return null
  }

  const fetchData = async () => {
    if (!widget.apiUrl) return

    try {
      setLoading(true)
      setError(null)
      const response = await fetchApiData(widget.apiUrl, widget.cacheMaxAge || 30000)
      setData(response)
      setLastUpdated(new Date())
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [widget.apiUrl])

  useEffect(() => {
    if (!widget.apiUrl || !widget.refreshInterval) return

    const interval = setInterval(() => {
      fetchData()
    }, widget.refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [widget.apiUrl, widget.refreshInterval])

  const handleRemove = async () => {
    const result = await showConfirm({
      title: 'Remove Widget?',
      text: `Are you sure you want to remove "${widget.name || 'this widget'}"? This action cannot be undone.`,
      icon: 'warning',
      confirmButtonText: 'Yes, remove it',
      cancelButtonText: 'Cancel',
    })

    if (result.isConfirmed) {
      removeWidget(widget.id)
      showSuccess('Widget Removed', 'The widget has been removed successfully.', 2000)
    }
  }

  const renderWidgetContent = () => {
    if (loading && !data) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <svg className="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-500 font-medium mb-1">Error loading data</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      )
    }

    if (!data) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )
    }

    switch (widget.displayMode) {
      case 'table':
        return <WidgetTable widget={widget} data={data} />
      case 'chart':
        return <WidgetChart widget={widget} data={data} />
      case 'card':
      default:
        return <WidgetCard widget={widget} data={data} />
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all cursor-move">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
              {widget.name || 'Untitled Widget'}
            </h2>
            {widget.refreshInterval && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                {widget.refreshInterval}s
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Configure widget"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleRemove}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Remove widget"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          {renderWidgetContent()}
        </div>

        {lastUpdated && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {isConfigOpen && (
        <WidgetConfigModal
          widget={widget}
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          onUpdate={(updates) => updateWidget(widget.id, updates)}
        />
      )}
    </>
  )
}

