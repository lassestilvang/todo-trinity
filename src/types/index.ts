export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  password?: string
  emailVerified?: string
  createdAt: string
  updatedAt: string
  tasks: Task[]
  lists: List[]
  labels: Label[]
  sessions: Session[]
  accounts: Account[]
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  dueDate?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  userId: string
  listId?: string
  labels: Label[]
  list?: List
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

export interface Session {
  id: string
  userId: string
  token: string
  expires: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface Account {
  id: string
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refresh_token?: string
  access_token?: string
  expires_at?: number
  token_type?: string
  scope?: string
  id_token?: string
  session_state?: string
  createdAt: string
  updatedAt: string
}

export interface UserContextType {
  user: User | null
  login: (user: User) => void
  logout: () => void
  loading: boolean
}

export interface TaskContextType {
  tasks: Task[]
  lists: List[]
  labels: Label[]
  notifications: Notification[]
  loading: boolean
  fetchTasks: () => Promise<void>
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Task>
  updateTask: (id: string, taskData: Partial<Task>) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
  createList: (listData: Omit<List, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<List>
  updateList: (id: string, listData: Partial<List>) => Promise<List>
  deleteList: (id: string) => Promise<void>
  createLabel: (labelData: Omit<Label, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Label>
  updateLabel: (id: string, labelData: Partial<Label>) => Promise<Label>
  deleteLabel: (id: string) => Promise<void>
  createNotification: (notificationData: Omit<Notification, 'id' | 'createdAt' | 'userId'>) => Promise<Notification>
  markNotificationAsRead: (id: string) => Promise<void>
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