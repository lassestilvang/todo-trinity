import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/password'

async function main() {
  // Delete all existing data
  await prisma.task.deleteMany()
  await prisma.list.deleteMany()
  await prisma.label.deleteMany()
  await prisma.user.deleteMany()

  // Create user with hashed password
  const hashedPassword = await hashPassword('demo123')
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
    },
  })

  // Create lists
  const workList = await prisma.list.create({
    data: {
      name: 'Work',
      color: 'blue',
      icon: 'briefcase',
      userId: user.id,
    },
  })

  const personalList = await prisma.list.create({
    data: {
      name: 'Personal',
      color: 'green',
      icon: 'home',
      userId: user.id,
    },
  })

  const shoppingList = await prisma.list.create({
    data: {
      name: 'Shopping',
      color: 'purple',
      icon: 'shopping-cart',
      userId: user.id,
    },
  })

  const learningList = await prisma.list.create({
    data: {
      name: 'Learning',
      color: 'orange',
      icon: 'book',
      userId: user.id,
    },
  })

  // Create labels
  const urgentLabel = await prisma.label.create({
    data: {
      name: 'Urgent',
      color: 'red',
      userId: user.id,
    },
  })

  const importantLabel = await prisma.label.create({
    data: {
      name: 'Important',
      color: 'blue',
      userId: user.id,
    },
  })

  const lowPriorityLabel = await prisma.label.create({
    data: {
      name: 'Low Priority',
      color: 'gray',
      userId: user.id,
    },
  })

  // Create tasks
  const tasks = [
    {
      title: 'Complete project documentation',
      description: 'Finish writing the API documentation and user guide',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: '',
      listId: workList.id,
      labelIds: [importantLabel.id],
    },
    {
      title: 'Prepare presentation for client meeting',
      description: 'Create slides and practice presentation',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      dueDate: '',
      listId: workList.id,
      labelIds: [urgentLabel.id],
    },
    {
      title: 'Buy groceries for the week',
      description: 'Milk, eggs, bread, vegetables, fruits',
      status: 'TODO',
      priority: 'NORMAL',
      dueDate: '',
      listId: shoppingList.id,
      labelIds: [lowPriorityLabel.id],
    },
    {
      title: 'Complete online course on React',
      description: 'Finish modules 5-8 and complete the final project',
      status: 'IN_PROGRESS',
      priority: 'NORMAL',
      dueDate: '',
      listId: learningList.id,
      labelIds: [importantLabel.id],
    },
    {
      title: 'Schedule dentist appointment',
      description: 'Call the clinic and book a check-up',
      status: 'TODO',
      priority: 'LOW',
      dueDate: '',
      listId: personalList.id,
      labelIds: [lowPriorityLabel.id],
    },
    {
      title: 'Review team performance metrics',
      description: 'Analyze Q3 results and prepare summary report',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: '',
      listId: workList.id,
      labelIds: [importantLabel.id],
    },
    {
      title: 'Plan weekend hiking trip',
      description: 'Research trails, book accommodation, pack gear',
      status: 'TODO',
      priority: 'NORMAL',
      dueDate: '',
      listId: personalList.id,
      labelIds: [],
    },
    {
      title: 'Update personal budget spreadsheet',
      description: 'Review expenses and update monthly budget',
      status: 'TODO',
      priority: 'LOW',
      dueDate: '',
      listId: personalList.id,
      labelIds: [lowPriorityLabel.id],
    },
    {
      title: 'Test new API endpoints',
      description: 'Write unit tests for the new authentication endpoints',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: '',
      listId: workList.id,
      labelIds: [urgentLabel.id],
    },
    {
      title: "Read 'Atomic Habits' book",
      description: 'Read chapters 1-3 and take notes',
      status: 'TODO',
      priority: 'NORMAL',
      dueDate: '',
      listId: learningList.id,
      labelIds: [importantLabel.id],
    },
  ]

  for (const taskData of tasks) {
    const task = await prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status as any,
        priority: taskData.priority as any,
        dueDate: taskData.dueDate,
        userId: user.id,
        listId: taskData.listId,
      },
    })

    if (taskData.labelIds.length > 0) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          labels: {
            connect: taskData.labelIds.map(labelId => ({ id: labelId })),
          },
        },
      })
    }
  }

  console.log('✅ Database seeded successfully!')
  console.log('👤 Created user: demo@example.com')
  console.log('📋 Created 4 lists: Work, Personal, Shopping, Learning')
  console.log('🏷️ Created 3 labels: Urgent, Important, Low Priority')
  console.log('✅ Created 10 sample tasks')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })