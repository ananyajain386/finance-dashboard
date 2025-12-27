'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getNestedValue, extractFields } from '@/utils/api'

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
    if (!data) {
      return []
    }

    if (!widget.selectedFields || widget.selectedFields.length === 0) {
      const allFields = extractFields(data)
      return allFields
        .filter(f => {
          const isNumeric = f.type === 'number' || (f.type === 'string' && f.value !== null && f.value !== undefined && isNumericValue(f.value))
          return isNumeric
        })
        .slice(0, 4)
        .map(f => ({
          path: f.path,
          type: f.type,
          value: f.value,
          label: f.path.split('_').pop().replace(/\d+\.\s*/, '') || f.path
        }))
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
    if (!numericFields || numericFields.length === 0 || !data) {
      return []
    }

    const extractTimeSeries = (data) => {
      if (Array.isArray(data)) {
        return data.map((item, index) => {
          const result = { index }
          numericFields.forEach((field) => {
            const value = getNestedValue(item, field.path)
            const fieldKey = field.label || field.path
            if (isNumericValue(value)) {
              result[fieldKey] = typeof value === 'string' ? parseFloat(value) : value
            } else {
              result[fieldKey] = null
            }
          })
          return result
        }).filter(item => Object.values(item).some(v => v !== null && v !== undefined && v !== 'index'))
      }

      const timeSeriesPattern = /time.?series/i
      for (const key in data) {
        if (timeSeriesPattern.test(key) && typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
          const timeSeriesData = data[key]
          const timestamps = Object.keys(timeSeriesData).sort().reverse().slice(0, 100) 
          
          const chartPoints = timestamps.map((timestamp, index) => {
            const result = { index, timestamp: timestamp.split(' ')[0] } 
            const timestampData = timeSeriesData[timestamp]
            
            numericFields.forEach((field) => {
              let propertyName = field.path
              
              if (field.path.includes(key)) {
                const pathParts = field.path.split('_')
                let keyEndIndex = -1
                for (let i = 0; i < pathParts.length; i++) {
                  if (pathParts.slice(0, i + 1).join('_').includes(key)) {
                    keyEndIndex = i
                    break
                  }
                }
                
                if (keyEndIndex >= 0 && pathParts.length > keyEndIndex + 2) {
                  propertyName = pathParts.slice(keyEndIndex + 2).join('_')
                } else if (pathParts.length > 0) {
                  propertyName = pathParts[pathParts.length - 1]
                }
              } else {
                const pathParts = field.path.split('_')
                if (pathParts.length > 0) {
                  propertyName = pathParts[pathParts.length - 1]
                }
              }
              
              let value = timestampData[propertyName]
              
              if (value === undefined || value === null) {
                const propertyBase = propertyName.replace(/\d+\.\s*/, '').trim().toLowerCase()
                for (const prop in timestampData) {
                  const propBase = prop.replace(/\d+\.\s*/, '').trim().toLowerCase()
                  if (prop === propertyName || 
                      propBase === propertyBase || 
                      prop.includes(propertyBase) || 
                      propertyBase.includes(propBase)) {
                    value = timestampData[prop]
                    break
                  }
                }
              }
              
              const fieldKey = field.label || propertyName.replace(/\d+\.\s*/, '').trim() || field.path
              
              if (isNumericValue(value)) {
                result[fieldKey] = typeof value === 'string' ? parseFloat(value) : value
              } else {
                result[fieldKey] = null
              }
            })
            
            return result
          })
          
          return chartPoints.filter(item => {
            const numericValues = Object.entries(item).filter(([k]) => k !== 'index' && k !== 'timestamp')
            return numericValues.some(([_, v]) => v !== null && v !== undefined)
          })
        }
      }

      const arrayKeys = ['timeSeries', 'values', 'data', 'series', 'history', 'feed']
      for (const key of arrayKeys) {
        if (data[key] && Array.isArray(data[key])) {
          return data[key].slice(0, 100).map((item, index) => {
            const result = { index }
            numericFields.forEach((field) => {
              let propertyPath = field.path
              if (field.path.startsWith(`${key}_`)) {
                const parts = field.path.split('_')
                if (parts.length >= 3 && parts[0] === key && !isNaN(parseInt(parts[1], 10))) {
                  propertyPath = parts.slice(2).join('_')
                } else if (parts.length >= 2) {
                  propertyPath = parts.slice(1).join('_')
                }
              }
              
              const value = getNestedValue(item, propertyPath) || (typeof item === 'object' ? item[propertyPath] : undefined)
              const fieldKey = field.label || field.path
              
              if (isNumericValue(value)) {
                result[fieldKey] = typeof value === 'string' ? parseFloat(value) : value
              } else {
                result[fieldKey] = null
              }
            })
            return result
          }).filter(item => Object.values(item).some(v => v !== null && v !== undefined && v !== 'index'))
        }
      }

      const result = { index: 0 }
      numericFields.forEach((field) => {
        const value = getNestedValue(data, field.path)
        const fieldKey = field.label || field.path
        
        if (value !== undefined && value !== null && isNumericValue(value)) {
          result[fieldKey] = typeof value === 'string' ? parseFloat(value) : value
        } else {
          result[fieldKey] = null
        }
      })
      
      const hasValidData = Object.entries(result).some(([k, v]) => k !== 'index' && v !== null && v !== undefined)
      return hasValidData ? [result] : []
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
            dataKey={chartData[0]?.timestamp ? 'timestamp' : 'index'}
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
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


