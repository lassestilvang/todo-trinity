import { prisma } from '@/lib/prisma'

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',
  SHARE = 'share',
  COMMENT = 'comment',
  PRIORITY_CHANGE = 'priority_change',
  STATUS_CHANGE = 'status_change',
  WORKFLOW_CREATE = 'workflow_create',
  WORKFLOW_UPDATE = 'workflow_update',
  WORKFLOW_DELETE = 'workflow_delete',
  INTEGRATION_CONNECT = 'integration_connect',
  INTEGRATION_DISCONNECT = 'integration_disconnect',
  PERMISSION_CHANGE = 'permission_change',
  PASSWORD_CHANGE = 'password_change',
  EMAIL_VERIFICATION = 'email_verification',
  TWO_FACTOR_ENABLE = 'two_factor_enable',
  TWO_FACTOR_DISABLE = 'two_factor_disable',
  SECURITY_LOGIN_FAILED = 'security_login_failed',
  SECURITY_LOCKOUT = 'security_lockout',
  BACKUP_CREATE = 'backup_create',
  BACKUP_RESTORE = 'backup_restore',
}

// Map string action to AuditAction enum
export function mapAction(action: string): AuditAction {
  const actionMap: Record<string, AuditAction> = {
    'create': AuditAction.CREATE,
    'read': AuditAction.READ,
    'update': AuditAction.UPDATE,
    'delete': AuditAction.DELETE,
    'login': AuditAction.LOGIN,
    'logout': AuditAction.LOGOUT,
    'export': AuditAction.EXPORT,
    'import': AuditAction.IMPORT,
    'share': AuditAction.SHARE,
    'comment': AuditAction.COMMENT,
    'priority_change': AuditAction.PRIORITY_CHANGE,
    'status_change': AuditAction.STATUS_CHANGE,
    'workflow_create': AuditAction.WORKFLOW_CREATE,
    'workflow_update': AuditAction.WORKFLOW_UPDATE,
    'workflow_delete': AuditAction.WORKFLOW_DELETE,
    'integration_connect': AuditAction.INTEGRATION_CONNECT,
    'integration_disconnect': AuditAction.INTEGRATION_DISCONNECT,
    'permission_change': AuditAction.PERMISSION_CHANGE,
    'password_change': AuditAction.PASSWORD_CHANGE,
    'email_verification': AuditAction.EMAIL_VERIFICATION,
    'two_factor_enable': AuditAction.TWO_FACTOR_ENABLE,
    'two_factor_disable': AuditAction.TWO_FACTOR_DISABLE,
    'security_login_failed': AuditAction.SECURITY_LOGIN_FAILED,
    'security_lockout': AuditAction.SECURITY_LOCKOUT,
    'backup_create': AuditAction.BACKUP_CREATE,
    'backup_restore': AuditAction.BACKUP_RESTORE,
  }
  return actionMap[action] || AuditAction.READ
}

export interface AuditLog {
  id: string
  userId: string
  action: string  // Prisma stores action as string; use mapAction() to convert to enum
  resource: string
  resourceId: string
  details: any | null
  ipAddress: string | null
  userAgent: string | null
  timestamp: Date
  metadata: any | null
  previousState: any | null
  newState: any | null
}

export class AuditService {
  static async log(
    action: AuditAction,
    resource: string,
    resourceId: string,
    details: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any,
    previousState?: any,
    newState?: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          resource,
          resourceId,
          details: details ? JSON.stringify(details) : null,
          ipAddress,
          userAgent,
          metadata: metadata ? JSON.stringify(metadata) : null,
          previousState: previousState ? JSON.stringify(previousState) : null,
          newState: newState ? JSON.stringify(newState) : null,
          userId,
        },
      })
    } catch (error) {
      console.error('Failed to create audit log:', error)
    }
  }

  static async getAuditLogs(
    filters: {
      userId?: string
      action?: AuditAction
      resource?: string
      startDate?: Date
      endDate?: Date
      limit?: number
      offset?: number
    } = {}
  ): Promise<AuditLog[]> {
    const where: any = {}
    if (filters.userId) where.userId = filters.userId
    if (filters.action) where.action = filters.action
    if (filters.resource) where.resource = filters.resource
    if (filters.startDate || filters.endDate) {
      where.timestamp = {}
      if (filters.startDate) where.timestamp.gte = filters.startDate
      if (filters.endDate) where.timestamp.lte = filters.endDate
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    })

    return logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      previousState: log.previousState ? JSON.parse(log.previousState) : null,
      newState: log.newState ? JSON.parse(log.newState) : null,
      action: log.action as AuditAction, // Cast to enum for type safety
    }))
  }

  static async getAuditStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalLogs: number
    actionsByType: Record<string, number>
    resourcesByType: Record<string, number>
    topUsers: { userId: string; count: number }[]
  }> {
    const where: any = {}
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = startDate
      if (endDate) where.timestamp.lte = endDate
    }

    const logs = await prisma.auditLog.findMany({ where })

    const actionsByType: Record<string, number> = {}
    const resourcesByType: Record<string, number> = {}
    const userCounts: Record<string, number> = {}

    for (const log of logs) {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1
      resourcesByType[log.resource] = (resourcesByType[log.resource] || 0) + 1
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1
    }

    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalLogs: logs.length,
      actionsByType,
      resourcesByType,
      topUsers,
    }
  }

  static async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    })

    return result.count
  }
}

export const auditService = AuditService