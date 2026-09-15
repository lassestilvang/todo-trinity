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
  resourceId: string | null
  details: any | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

export class AuditService {
  static async log(
    action: AuditAction,
    resource: string,
    resourceId: string,
    details: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          resource,
          resourceId,
          changes: details ? JSON.stringify(details) : undefined,
          ipAddress,
          userAgent,
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
  ): Promise<{ action: AuditAction; resource: string; resourceId: string | null; changes: any | null; ipAddress: string | null; userAgent: string | null; createdAt: Date; userId: string }[]> {
    const where: any = {}
    if (filters.userId) where.userId = filters.userId
    if (filters.action) where.action = filters.action
    if (filters.resource) where.resource = filters.resource
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    })

    return logs.map((log) => ({
      action: log.action as AuditAction,
      resource: log.resource,
      resourceId: log.resourceId,
      changes: log.changes ? JSON.parse(log.changes as string) : null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      userId: log.userId,
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
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
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
        createdAt: { lt: cutoffDate },
      },
    })

    return result.count
  }
}

export const auditService = AuditService