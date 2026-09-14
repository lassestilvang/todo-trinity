import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

interface SkillTreeNodeProps {
  id: string
  name: string
  description?: string
  icon: string
  xpValue: number
  prerequisites: string[]
  isUnlocked: boolean
  isCompleted: boolean
  completedAt?: string
  positionX: number
  positionY: number
  onNodeClick?: (nodeId: string) => void
}

interface SkillTreeProps {
  userId: string
}

export default function SkillTree({ userId }: SkillTreeProps) {
  const [skillTree, setSkillTree] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchSkillTree = async () => {
      setIsLoading(true)
      try {
        // In a real app, we would fetch from API
        // For now, we'll use a mock skill tree
        const mockSkillTree = {
          id: 'tree1',
          userId,
          name: 'Productivity Master',
          description: 'Master the art of getting things done',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes: [
            {
              id: 'node1',
              skillTreeId: 'tree1',
              name: 'Task Beginner',
              description: 'Complete your first 5 tasks',
              icon: '✅',
              xpValue: 10,
              prerequisites: [],
              isUnlocked: true,
              isCompleted: true,
              completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
              positionX: 100,
              positionY: 100,
            },
            {
              id: 'node2',
              skillTreeId: 'tree1',
              name: 'Daily Planner',
              description: 'Plan your day for 7 consecutive days',
              icon: '📅',
              xpValue: 20,
              prerequisites: ['node1'],
              isUnlocked: true,
              isCompleted: false,
              completedAt: undefined,
              positionX: 300,
              positionY: 80,
            },
            {
              id: 'node3',
              skillTreeId: 'tree1',
              name: 'Streak Master',
              description: 'Maintain a 7-day streak',
              icon: '🔥',
              xpValue: 30,
              prerequisites: ['node2'],
              isUnlocked: false,
              isCompleted: false,
              completedAt: undefined,
              positionX: 500,
              positionY: 100,
            },
            {
              id: 'node4',
              skillTreeId: 'tree1',
              name: 'Multi-tasker',
              description: 'Complete 3 tasks in one day',
              icon: '⚡',
              xpValue: 15,
              prerequisites: ['node1'],
              isUnlocked: true,
              isCompleted: true,
              completedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
              positionX: 200,
              positionY: 200,
            },
            {
              id: 'node5',
              skillTreeId: 'tree1',
              name: 'Project Manager',
              description: 'Complete 3 projects',
              icon: '📊',
              xpValue: 40,
              prerequisites: ['node4'],
              isUnlocked: false,
              isCompleted: false,
              completedAt: undefined,
              positionX: 400,
              positionY: 250,
            },
          ],
        }
        setSkillTree(mockSkillTree)
      } catch (err) {
        setError('Failed to load skill tree')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSkillTree()
  }, [userId])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading skill tree...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 text-red-500">
        Error loading skill tree: {error}
      </div>
    )
  }

  if (!skillTree) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 text-center">
        <p className="text-gray-500">No skill tree data available</p>
      </div>
    )
  }

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.027 12.027 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.029 9-11.622 0-1.304-.298-2.584-.832-3.64z" />
          </svg>
          Skill Tree
        </h3>
      </div>

      <div className="relative h-96 w-full bg-gray-50 rounded-lg overflow-hidden">
        {/* Skill Tree Connections */}
        <div className="absolute inset-0 pointer-events-none">
          {skillTree.nodes.map((node: SkillTreeNodeProps) => {
            return node.prerequisites.map((prereqId: string) => {
              const prereqNode = skillTree.nodes.find((n: SkillTreeNodeProps) => n.id === prereqId)
              if (!prereqNode) return null

              return (
                <motion.line
                  key={`${node.id}-${prereqId}`}
                  x1={prereqNode.positionX}
                  y1={prereqNode.positionY}
                  x2={node.positionX}
                  y2={node.positionY}
                  stroke="currentColor"
                  strokeWidth={2}
                  className={`
                    ${node.isUnlocked && prereqNode.isUnlocked
                      ? 'stroke-blue-400'
                      : 'stroke-gray-300'}
                    ${node.isCompleted && prereqNode.isCompleted
                      ? 'stroke-green-500'
                      : ''}
                    transition-stroke duration-300
                  `}
                />
              )
            })
          }).filter(Boolean)}
        </div>

        {/* Skill Tree Nodes */}
        {skillTree.nodes.map((node: SkillTreeNodeProps) => {
          const isSelected = selectedNode === node.id
          const isHoverable = node.isUnlocked || selectedNode === null

          return (
            <motion.div
              key={node.id}
              className={`absolute left-[${node.positionX}px] top-[${node.positionY}px] transform -translate-x-1/2 -translate-y-1/2`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: isSelected ? 1.2 : 1, opacity: 1 }}
              whileHover={{ scale: isHoverable ? 1.1 : 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNodeClick(node.id)}
            >
              <div className={`w-16 h-16 flex flex-col items-center justify-center
                ${node.isCompleted
                  ? 'bg-green-500 text-white'
                  : node.isUnlocked
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'}
                rounded-full shadow-lg transition-all duration-300
                ${isSelected ? 'ring-2 ring-blue-300' : ''}
                cursor-pointer`}
              >
                <div className="text-2xl">{node.icon}</div>
                <div className="mt-1 text-xs font-medium text-center">{node.xpValue}XP</div>
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap text-xs font-medium text-gray-700">
                {node.name}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 text-xs text-center text-gray-500">
                {node.description}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Node Details Panel */}
      {selectedNode && selectedNode !== null && (
        <SkillNodeDetailsPanel
          skillTree={skillTree}
          selectedNodeId={selectedNode}
        />
      )}
    </div>
  )
}

// Separate component for skill node details
function SkillNodeDetailsPanel({
  skillTree,
  selectedNodeId
}: {
  skillTree: any,
  selectedNodeId: string
}) {
  const node = skillTree.nodes.find((n: any) => n.id === selectedNodeId)
  if (!node) return null

  return (
    <div className="mt-4 bg-white rounded-lg shadow-md p-4">
      <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
        <span className="text-2xl">{node.icon}</span>
        {node.name}
      </h4>
      <p className="text-gray-600 mb-3">{node.description}</p>
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <span className="font-medium">XP Value:</span>
          <span className="text-blue-600">{node.xpValue}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="font-medium">Status:</span>
          <span className={`
            ${node.isCompleted
              ? 'text-green-600 font-medium'
              : node.isUnlocked
              ? 'text-blue-600 font-medium'
              : 'text-gray-600'}
          `}>
            {node.isCompleted ? 'Completed' : node.isUnlocked ? 'Unlocked' : 'Locked'}
          </span>
        </div>
        {node.prerequisites.length > 0 && (
          <div className="flex items-center space-x-3">
            <span className="font-medium">Prerequisites:</span>
            <span className="text-sm">
              {node.prerequisites
                .map((prereqId: string) => {
                  const prereq = skillTree.nodes.find((n: any) => n.id === prereqId)
                  return prereq ? prereq.name : 'Unknown'
                })
                .join(', ')}
            </span>
          </div>
        )}
        {!node.isCompleted && (
          <div className="mt-3">
            <button
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              disabled={!node.isUnlocked}
            >
              {node.isUnlocked ? 'Complete Node' : 'Unlock Node'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}