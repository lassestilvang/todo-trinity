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

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  emailVerified?: string
  createdAt: string
  updatedAt: string
  tasks: Task[]
  lists: List[]
  labels: Label[]
  sessions: Session[]
  accounts: Account[]
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