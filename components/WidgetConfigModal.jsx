'use client'

import { useState, useEffect } from 'react'
import { testApiConnection, extractFields } from '@/utils/api'
import clsx from 'clsx'

export default function WidgetConfigModal({ widget, isOpen, onClose, onUpdate }) {
  const [widgetName, setWidgetName] = useState(widget.name || '')
  const [apiUrl, setApiUrl] = useState(widget.apiUrl || '')
  const [refreshInterval, setRefreshInterval] = useState(widget.refreshInterval || 30)
  const [displayMode, setDisplayMode] = useState(widget.displayMode || 'card')
  const [selectedFields, setSelectedFields] = useState(widget.selectedFields || [])
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)
  const [availableFields, setAvailableFields] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      setWidgetName(widget.name || '')
      setApiUrl(widget.apiUrl || '')
      setRefreshInterval(widget.refreshInterval || 30)
      setDisplayMode(widget.displayMode || 'card')
      setSelectedFields(widget.selectedFields || [])
      setTestResult(null)
      setAvailableFields([])
      setSearchTerm('')
    }
  }, [isOpen, widget])

  const isNumericField = (field) => {
    if (field.type === 'number') {
      return true
    }
    if (field.type === 'string' && field.value !== null && field.value !== undefined) {
      const strValue = String(field.value).trim()
      if (strValue.includes('%') || strValue.includes('T') || strValue.match(/^\d{4}-\d{2}-\d{2}/)) {
        return false
      }
      const numValue = parseFloat(strValue)
      return !isNaN(numValue) && isFinite(numValue) && strValue !== ''
    }
    return false
  }

  const handleTestApi = async () => {
    if (!apiUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter an API URL',
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const result = await testApiConnection(apiUrl)
      setTestResult(result)

      if (result.success && result.data) {
        const fields = extractFields(result.data)
        setAvailableFields(fields)
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error.message}`,
      })
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    setSelectedFields([])
  }, [displayMode])

  const handleAddField = (field) => {
    const keyPath = displayMode === 'table' && field.label ? field.label : field.path
    
    if (!selectedFields.find((f) => {
      const fKeyPath = displayMode === 'table' && f.label ? f.label : f.path
      return fKeyPath === keyPath
    })) {
      const label = displayMode === 'table' && field.label ? field.label : (field.label || field.path)
      setSelectedFields([...selectedFields, { ...field, label, displayPath: displayMode === 'table' ? field.label : undefined }])
    }
  }

  const handleRemoveField = (fieldToRemove) => {
    setSelectedFields(selectedFields.filter((f) => {
      if (displayMode === 'table') {
        const fKeyPath = f.label ? f.label : f.path
        const removeKeyPath = fieldToRemove.label ? fieldToRemove.label : fieldToRemove.path
        return fKeyPath !== removeKeyPath
      }
      return f.path !== fieldToRemove.path
    }))
  }

  const handleSave = () => {
    if (displayMode === 'table') {
      const tableFields = getTableFields()
      if (arrayKeys.length === 0 || tableFields.length === 0) {
        alert('Table mode requires array data. This API does not contain any arrays. Please use Card or Chart mode instead.')
        return
      }
      if (selectedFields.length === 0) {
        alert('Please select at least one field to display in table mode.')
        return
      }
    }
    
    onUpdate({
      name: widgetName,
      apiUrl: apiUrl.trim(),
      refreshInterval: parseInt(refreshInterval) || 30,
      displayMode,
      selectedFields,
    })
    onClose()
  }

  const detectArrayKeys = () => {
    if (displayMode !== 'table' || availableFields.length === 0) return []
    
    const prefixCounts = {}
    availableFields.forEach(field => {
      const parts = field.path.split('_')
      if (parts.length >= 3) {
        if (!isNaN(parseInt(parts[1], 10))) {
          const prefix = parts[0]
          prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1
        }
      }
    })
    
    return Object.entries(prefixCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key)
  }

  const arrayKeys = detectArrayKeys()

  const getTableFields = () => {
    if (arrayKeys.length === 0) return []
    
    const fieldMap = new Map()
    
    arrayKeys.forEach(arrayKey => {
      availableFields.forEach(field => {
        const arrayKeyPattern = arrayKey.replace(/\s+/g, '_').replace(/[()]/g, '')
        const pathPrefix = `${arrayKeyPattern}_`
        
        if (field.path.startsWith(pathPrefix)) {
          const remainingPath = field.path.substring(pathPrefix.length)
          const remainingParts = remainingPath.split('_')
          
          if (remainingParts.length > 0 && !isNaN(parseInt(remainingParts[0], 10))) {
            if (remainingParts.length > 1) {
              const propertyName = remainingParts.slice(1).join('_')
              const displayPath = `${arrayKey}.${propertyName}`
              
              if (!fieldMap.has(displayPath)) {
                fieldMap.set(displayPath, {
                  ...field,
                  path: field.path, 
                  label: displayPath,
                  propertyPath: propertyName, 
                  arrayKey: arrayKey,
                })
              }
            }
          }
        }
      })
    })
    
    return Array.from(fieldMap.values())
  }

  const filteredFields = (() => {
    let fields = displayMode === 'table' ? getTableFields() : availableFields
    
    if (searchTerm) {
      fields = fields.filter((field) =>
        (field.label || field.path).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (displayMode === 'chart') {
      fields = fields.filter(isNumericField)
    }
    
    return fields
  })()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configure Widget</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Widget Name
            </label>
            <input
              type="text"
              value={widgetName}
              onChange={(e) => setWidgetName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={handleTestApi}
                disabled={testing || !apiUrl.trim()}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Testing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Test
                  </>
                )}
              </button>
            </div>
            {testResult && (
              <div
                className={clsx(
                  'mt-2 p-3 rounded-lg text-sm',
                  testResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                )}
              >
                {testResult.message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Refresh Interval (seconds)
            </label>
            <input
              type="number"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
              min="5"
              max="3600"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Display Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="card"
                  checked={displayMode === 'card'}
                  onChange={(e) => setDisplayMode(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Card</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="table"
                  checked={displayMode === 'table'}
                  onChange={(e) => setDisplayMode(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Table</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="chart"
                  checked={displayMode === 'chart'}
                  onChange={(e) => setDisplayMode(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Chart</span>
              </label>
            </div>
          </div>

          {availableFields.length > 0 && (
            <>
              {displayMode === 'table' && filteredFields.length === 0 && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm">
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Table mode requires array data. This API does not contain any arrays. Please use Card or Chart mode instead.
                </div>
              )}
              {filteredFields.length > 0 && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search for fields..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {filteredFields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-mono text-gray-900 dark:text-white truncate">
                            {displayMode === 'table' && field.label ? field.label : field.path}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {field.type}
                            {field.value !== undefined && field.type !== 'object' && field.type !== 'array' && (
                              <span className="ml-2">| {String(field.value).slice(0, 30)}</span>
                            )}
                            {displayMode === 'table' && field.propertyPath && (
                              <span className="ml-2 text-gray-400">| {field.path}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddField(field)}
                          disabled={selectedFields.find((f) => {
                            const fKeyPath = displayMode === 'table' && f.label ? f.label : f.path
                            const fieldKeyPath = displayMode === 'table' && field.label ? field.label : field.path
                            return fKeyPath === fieldKeyPath
                          })}
                          className="ml-2 px-2 py-1 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Selected Fields
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-96 overflow-y-auto">
                  {selectedFields.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No fields selected
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedFields.map((field, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-mono text-gray-900 dark:text-white truncate">
                              {displayMode === 'table' && field.label ? field.label : field.path}
                            </div>
                            {displayMode !== 'table' && (
                              <input
                                type="text"
                                value={field.label || ''}
                                onChange={(e) => {
                                  const updated = [...selectedFields]
                                  updated[index].label = e.target.value
                                  setSelectedFields(updated)
                                }}
                                placeholder="Label (optional)"
                                className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            )}
                            {displayMode === 'table' && (
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Path: {field.path}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveField(field)}
                            className="ml-2 px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

