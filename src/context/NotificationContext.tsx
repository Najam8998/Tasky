// ============================================================
// NotificationContext.tsx — Global notification state
// ============================================================
import React, { createContext, useContext, useState, type ReactNode } from 'react'

export interface Notification {
  id: string
  type: 'task_accepted' | 'payment_released' | 'dispute_raised' | 'task_created' | 'message' | 'info'
  title: string
  body: string
  timestamp: number
  read: boolean
  taskId?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (type: Notification['type'], title: string, body: string, taskId?: string) => void
  markAllRead: () => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try { return JSON.parse(localStorage.getItem('tasky_notifications') ?? '[]') }
    catch { return [] }
  })

  const save = (list: Notification[]) => {
    setNotifications(list)
    localStorage.setItem('tasky_notifications', JSON.stringify(list))
  }

  const addNotification = (type: Notification['type'], title: string, body: string, taskId?: string) => {
    const n: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      type, title, body, taskId,
      timestamp: Date.now(),
      read: false,
    }
    save([n, ...notifications].slice(0, 30))
  }

  const markAllRead = () => save(notifications.map(n => ({ ...n, read: true })))
  const clearAll    = () => save([])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
