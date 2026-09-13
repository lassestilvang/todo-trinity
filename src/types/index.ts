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
  description?: string | null
  status: TaskStatus
  priority: Priority
  dueDate?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  userId: string
  listId?: string | null
  labels: Label[]
  list?: List
  subtasks?: SubTask[]
  dependencies?: TaskDependency[]
  dependents?: TaskDependency[]
  assignedToId?: string | null
}

export interface SubTask {
  id: string
  title: string
  completed: boolean
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  taskId: string
}

export interface TaskDependency {
  id: string
  taskId: string
  dependsOnId: string
  createdAt: string
  dependsOn?: Task
}

export interface RecurringTask {
  id: string
  title: string
  description?: string | null
  schedule: string
  isActive: boolean
  taskId: string
  createdAt: string
  updatedAt: string
  task?: Task
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

export interface AdminStats {
  totalUsers: number
  totalTasks: number
  totalLists: number
  totalLabels: number
  totalWorkspaces: number
  activeUsersLast7Days: number
  pendingInvitations: number
  storageUsed: string
}

export interface AdminUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  createdAt: string
  updatedAt: string
  _count: {
    tasks: number
    lists: number
    workspaces: number
  }
}

export interface AdminWorkspace {
  id: string
  name: string
  description?: string | null
  createdAt: string
  updatedAt: string
  memberCount: number
  _count: {
    tasks: number
    lists: number
    invitations: number
  }
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
  error: string | null
  selectedList: string
  selectedStatus: TaskStatus
  selectedPriority: Priority
  selectedLabel: string
  viewType: string
  filters: {
    listId?: string
    status?: TaskStatus
    priority?: Priority
    search?: string
    labelId?: string
  }
  fetchTasks: () => Promise<void>
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>
  updateTask: (id: string, taskData: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  createList: (listData: Omit<List, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>
  updateList: (id: string, listData: Partial<List>) => Promise<void>
  deleteList: (id: string) => Promise<void>
  createLabel: (labelData: Omit<Label, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>
  updateLabel: (id: string, labelData: Partial<Label>) => Promise<void>
  deleteLabel: (id: string) => Promise<void>
  createNotification: (notificationData: Omit<Notification, 'id' | 'createdAt' | 'userId'>) => Promise<void>
  markNotificationAsRead: (id: string) => Promise<void>
  getSubTasks: (taskId: string) => Promise<{ subtasks: SubTask[] }>
  createSubTask: (subTaskData: { title: string; taskId: string }) => Promise<void>
  updateSubTask: (taskId: string, subTaskId: string, updates: Partial<SubTask>) => Promise<void>
  deleteSubTask: (taskId: string, subTaskId: string) => Promise<void>
  getTaskDependencies: (taskId: string) => Promise<{ dependencies: TaskDependency[] }>
  createDependency: (dependencyData: { taskId: string; dependsOnId: string }) => Promise<void>
  deleteDependency: (taskId: string, dependsOnId: string) => Promise<void>
  getMentions: () => Promise<{ mentions: any[] }>
  markMentionsAsRead: () => Promise<{ message: string }>
  setFilters: (filters: Partial<TaskContextType['filters']>) => void
  getAnalytics: (userId: string, params?: any) => Promise<any>
  getUserStats: (userId: string) => Promise<any>
  getRecurringTasks: () => Promise<RecurringTask[]>
  createRecurringTask: (recurringTaskData: { title: string; description?: string; schedule: string; taskId: string }) => Promise<void>
  updateRecurringTask: (id: string, updates: { title?: string; description?: string; schedule?: string; isActive?: boolean }) => Promise<void>
  deleteRecurringTask: (id: string) => Promise<void>
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

export interface Mention {
  id: string
  commentId: string
  userId: string
  read: boolean
  createdAt: string
  comment: {
    id: string
    content: string
    taskId: string
    createdAt: string
    user: {
      id: string
      name: string
      image?: string
    }
  }
}