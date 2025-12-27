'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getNestedValue } from '@/utils/api'

export default function WidgetChart({ widget, data }) {
  const isNumericValue = (value) => {
    if (typeof value === 'number') {
      return !isNaN(value) && isFinite(value)
    }
    if (typeof value === 'string' && value !== null && value !== undefined) {
      const strValue = String(value).trim()
      if (strValue.includes('%') || strValue.includes('T') || strValue.match(/^\d{4}-\d{2}-\d{2}/)) {
        return false
      }
      const numValue = parseFloat(strValue)
      return !isNaN(numValue) && isFinite(numValue) && strValue !== ''
    }
    return false
  }

  const numericFields = useMemo(() => {
    if (!widget.selectedFields || widget.selectedFields.length === 0) {
      return []
    }
    if (!data) {
      return []
    }
    return widget.selectedFields.filter(field => {
      const value = getNestedValue(data, field.path)
      const isNumeric = isNumericValue(value)
      if (!isNumeric && value === undefined) {
        const altPaths = [
          field.path.replace(/_/g, '.'),
          field.path.replace(/\./g, '_'),
        ]
        for (const altPath of altPaths) {
          if (altPath === field.path) continue
          const altValue = getNestedValue(data, altPath)
          if (isNumericValue(altValue)) {
            return true
          }
        }
      }
      return isNumeric
    })
  }, [data, widget.selectedFields])

  const chartData = useMemo(() => {
    if (!numericFields || numericFields.length === 0) {
      return []
    }

    const extractTimeSeries = (data) => {
      if (Array.isArray(data)) {
        return data.map((item, index) => {
          const result = { index }
          numericFields.forEach((field) => {
            const value = getNestedValue(item, field.path)
            if (isNumericValue(value)) {
              result[field.label || field.path] = typeof value === 'string' ? parseFloat(value) : value
            } else {
              result[field.label || field.path] = 0
            }
          })
          return result
        })
      }

      const timeSeriesKeys = ['timeSeries', 'values', 'data', 'series', 'history', 'feed']
      for (const key of timeSeriesKeys) {
        if (data[key] && Array.isArray(data[key])) {
          return data[key].map((item, index) => {
            const result = { index }
            numericFields.forEach((field) => {
              let propertyPath = field.path
              if (field.path.startsWith(`${key}_`)) {
                const parts = field.path.split('_')
                if (parts.length >= 3 && parts[0] === key) {
                  const secondPart = parts[1]
                  if (!isNaN(parseInt(secondPart, 10))) {
                    propertyPath = parts.slice(2).join('_')
                  } else {
                    propertyPath = parts.slice(1).join('.')
                  }
                }
              }
              
              const value = getNestedValue(item, propertyPath) || getNestedValue(item, field.path)
              const fieldKey = field.label || field.path
              
              if (isNumericValue(value)) {
                result[fieldKey] = typeof value === 'string' ? parseFloat(value) : value
              } else {
                const numValue = parseFloat(value)
                result[fieldKey] = (!isNaN(numValue) && isFinite(numValue)) ? numValue : 0
              }
            })
            return result
          })
        }
      }

      const timeSeriesPattern = /time.?series|timeseries/i
      for (const key in data) {
        if (timeSeriesPattern.test(key) && typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
          const timeSeriesData = data[key]
          const timestamps = Object.keys(timeSeriesData).sort().reverse() 
          
          return timestamps.map((timestamp, index) => {
            const result = { index, timestamp }
            const timestampData = timeSeriesData[timestamp]
            
            numericFields.forEach((field) => {
              let propertyPath = field.path
              
              if (field.path.includes(key)) {
                const pathParts = field.path.split('_')
                const keyIndex = pathParts.findIndex(p => p.includes(key) || timeSeriesPattern.test(p))
                
                if (keyIndex >= 0 && pathParts.length > keyIndex + 1) {
                  const possibleTimestamp = pathParts[keyIndex + 1]
                  if (possibleTimestamp === timestamp || timestamps.includes(possibleTimestamp)) {
                    propertyPath = pathParts.slice(keyIndex + 2).join('_')
                  } else {
                    propertyPath = pathParts.slice(keyIndex + 1).join('_')
                  }
                }
              }
              
              const value = getNestedValue(timestampData, propertyPath) || getNestedValue(timestampData, field.path)
              const fieldKey = field.label || field.path
              
              if (isNumericValue(value)) {
                result[fieldKey] = typeof value === 'string' ? parseFloat(value) : value
              } else {
                const numValue = parseFloat(value)
                result[fieldKey] = (!isNaN(numValue) && isFinite(numValue)) ? numValue : 0
              }
            })
            
            return result
          })
        }
      }

      const result = { index: 0 } 
      numericFields.forEach((field) => {
        const value = getNestedValue(data, field.path)
        const fieldKey = field.label || field.path
        
        if (value === undefined || value === null) {
          console.warn(`[WidgetChart] Value not found for path: "${field.path}", label: "${field.label}", trying alternatives...`)
        }
        
        if (value !== undefined && value !== null) {
          if (isNumericValue(value)) {
            const numValue = typeof value === 'string' ? parseFloat(value) : value
            result[fieldKey] = numValue
            console.log(`[WidgetChart] Set ${fieldKey} = ${numValue} (from path: ${field.path})`)
          } else {
            const numValue = parseFloat(value)
            if (!isNaN(numValue) && isFinite(numValue)) {
              result[fieldKey] = numValue
              console.log(`[WidgetChart] Set ${fieldKey} = ${numValue} (parsed from: ${value})`)
            } else {
              result[fieldKey] = 0
              console.warn(`[WidgetChart] Could not parse ${fieldKey} from value: ${value}`)
            }
          }
        } else {
          const altPaths = [
            field.path.replace(/_/g, '.'), 
            field.path.replace(/\./g, '_'),
          ]
          
          let foundValue = null
          let foundPath = null
          for (const altPath of altPaths) {
            if (altPath === field.path) continue 
            const altValue = getNestedValue(data, altPath)
            if (altValue !== undefined && altValue !== null && isNumericValue(altValue)) {
              foundValue = altValue
              foundPath = altPath
              break
            }
          }
          
          if (foundValue !== null) {
            const numValue = typeof foundValue === 'string' ? parseFloat(foundValue) : foundValue
            result[fieldKey] = numValue
            console.log(`[WidgetChart] Set ${fieldKey} = ${numValue} (from alternative path: ${foundPath})`)
          } else {
            result[fieldKey] = 0
            console.error(`[WidgetChart] Could not find value for ${fieldKey} (path: ${field.path}), data keys:`, Object.keys(data || {}))
          }
        }
      })
      console.log(`[WidgetChart] Final chart data:`, result)
      return Object.keys(result).length > 1 ? [result] : [] 
    }

    return extractTimeSeries(data)
  }, [data, numericFields])

  if (chartData.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No chart data available. Select numeric fields to display.
      </div>
    )
  }

  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="index"
            stroke="#6b7280"
            tick={{ fill: '#6b7280' }}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#6b7280' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          {numericFields?.map((field, index) => {
            const fieldKey = field.label || field.path
            return (
              <Line
                key={field.path}
                type="monotone"
                dataKey={fieldKey}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

