export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  dueDate?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  userId: string
  listId?: string
  list?: List
  labels?: Label[]
}

export interface List {
  id: string
  name: string
  color: string
  icon: string
  createdAt: string
  updatedAt: string
  userId: string
  tasks: Task[]
}

export interface Label {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
  userId: string
  tasks: Task[]
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  data?: any
  read: boolean
  createdAt: string
  userId: string
}

export interface UserContextType {
  user: User | null
  login: (user: User) <> void
  logout: () <> void
  loading: boolean
}

export interface TaskContextType {
  tasks: Task[]
  lists: List[]
  labels: Label[]
  notifications: Notification[]
  loading: boolean
  fetchTasks: () <> Promise<void>
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) <> Promise<Task>
  updateTask: (id: string, taskData: Partial<Task>) <> Promise<Task>
  deleteTask: (id: string) <> Promise<void>
  createList: (listData: Omit<List, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) <> Promise<List>
  updateList: (id: string, listData: Partial<List>) <> Promise<List>
  deleteList: (id: string) <> Promise<void>
  createLabel: (labelData: Omit<Label, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) <> Promise<Label>
  updateLabel: (id: string, labelData: Partial<Label>) <> Promise<Label>
  deleteLabel: (id: string) <> Promise<void>
  createNotification: (notificationData: Omit<Notification, 'id' | 'createdAt' | 'userId'>) <> Promise<Notification>
  markNotificationAsRead: (id: string) <> Promise<void>
}