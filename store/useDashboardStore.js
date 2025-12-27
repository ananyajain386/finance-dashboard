import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useDashboardStore = create(
  persist(
    (set, get) => {
      const cleanupWidgets = (widgets) => {
        return (widgets || [])
          .filter((w) => w && typeof w === 'object')
          .map((w) => {
            if (!w.id) {
              return {
                ...w,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              }
            }
            return w
          })
      }

      return {
        theme: 'dark',
        setTheme: (theme) => set({ theme }),

        widgets: cleanupWidgets([]),
        
        addWidget: (widget) => {
        if (!widget || typeof widget !== 'object') {
          console.error('Invalid widget provided to addWidget')
          return null
        }
        const newWidget = {
          ...widget,
          id: widget.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: widget.createdAt || new Date().toISOString(),
        }
        set((state) => ({
          widgets: [...(state.widgets || []).filter((w) => w && w.id), newWidget],
        }))
        return newWidget.id
      },

      removeWidget: (id) => {
        if (!id) return
        set((state) => ({
          widgets: (state.widgets || []).filter((w) => w && w.id && w.id !== id),
        }))
      },

      updateWidget: (id, updates) => {
        if (!id || !updates) return
        set((state) => ({
          widgets: (state.widgets || [])
            .filter((w) => w && w.id)
            .map((w) =>
              w.id === id ? { ...w, ...updates } : w
            ),
        }))
      },

      reorderWidgets: (newOrder) => {
        const validOrder = (newOrder || []).filter((w) => w && w.id)
        set({ widgets: validOrder })
      },

      moveWidget: (dragIndex, hoverIndex) => {
        const widgets = [...get().widgets].filter((w) => w && w.id)
        if (dragIndex < 0 || dragIndex >= widgets.length || hoverIndex < 0 || hoverIndex > widgets.length) {
          return
        }
        const draggedWidget = widgets[dragIndex]
        if (!draggedWidget) {
          return
        }
        widgets.splice(dragIndex, 1)
        widgets.splice(hoverIndex, 0, draggedWidget)
        set({ widgets })
      },

      exportConfig: () => {
        const state = get()
        return JSON.stringify({
          widgets: state.widgets,
          theme: state.theme,
        }, null, 2)
      },

      importConfig: (configString) => {
        try {
          const config = JSON.parse(configString)
          const validWidgets = (config.widgets || [])
            .filter((w) => w && typeof w === 'object')
            .map((w) => {
              if (!w.id) {
                return {
                  ...w,
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                }
              }
              return w
            })
          set({
            widgets: validWidgets,
            theme: config.theme || 'dark',
          })
          return true
        } catch (error) {
          console.error('Failed to import config:', error)
          return false
        }
      },

      clearAllWidgets: () => {
        set({ widgets: [] })
      },
    }},
    {
      name: 'finance-dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        widgets: (state.widgets || []).filter((w) => w && w.id),
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.widgets) {
          const cleanedWidgets = (state.widgets || [])
            .filter((w) => w && typeof w === 'object')
            .map((w) => {
              if (!w.id) {
                return {
                  ...w,
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                }
              }
              return w
            })
          state.widgets = cleanedWidgets
        }
      },
    }
  
  )
)

export default useDashboardStore

