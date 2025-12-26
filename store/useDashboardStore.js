import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useDashboardStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      widgets: [],
      
      addWidget: (widget) => {
        const newWidget = {
          ...widget,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          widgets: [...state.widgets, newWidget],
        }))
        return newWidget.id
      },

      removeWidget: (id) => {
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
        }))
      },

      updateWidget: (id, updates) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }))
      },

      reorderWidgets: (newOrder) => {
        set({ widgets: newOrder })
      },

      moveWidget: (dragIndex, hoverIndex) => {
        const widgets = [...get().widgets]
        const draggedWidget = widgets[dragIndex]
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
          set({
            widgets: config.widgets || [],
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
    }),
    {
      name: 'finance-dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        widgets: state.widgets,
        theme: state.theme,
      }),
    }
  )
)

export default useDashboardStore

