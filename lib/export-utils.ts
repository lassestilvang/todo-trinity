export function tasksToCSV(tasks: any[]): string {
  const headers = ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'completedAt', 'createdAt', 'updatedAt', 'list', 'labels']
  const rows = tasks.map(task => [
    task.id,
    `"${task.title.replace(/"/g, '""')}"`,
    task.description ? `"${task.description.replace(/"/g, '""')}"` : '',
    task.status,
    task.priority,
    task.dueDate ? task.dueDate.toISOString() : '',
    task.completedAt ? task.completedAt.toISOString() : '',
    task.createdAt.toISOString(),
    task.updatedAt.toISOString(),
    task.list?.name || '',
    task.labels?.map((l: any) => l.name).join('|') || '',
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

export async function tasksToPDF(tasks: any[]): Promise<Buffer> {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Todo Trinity - Task Export', 105, 15, { align: 'center' })

  // Metadata
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(128, 128, 128)
  doc.text(`Exported on: ${new Date().toLocaleString()}`, 105, 25, { align: 'center' })
  doc.text(`Total Tasks: ${tasks.length}`, 105, 30, { align: 'center' })

  // Draw a line under the header
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(10, 35, 200, 35)

  // Task list
  doc.setFontSize(12)
  let y = 42

  tasks.forEach((task, index) => {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    // Task title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    const statusEmoji = task.completed ? '✓' : '○'
    const priorityLabel = task.priority || 'NORMAL'
    const statusText = task.status || 'TODO'
    doc.text(`${statusEmoji} ${task.title} [${priorityLabel}] ${statusText}`, 15, y)

    y += 6

    // Task details
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(128, 128, 128)
    if (task.description) {
      doc.text(`Description: ${task.description}`, 15, y)
      y += 5
    }
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate).toLocaleDateString()
      doc.text(`Due: ${dueDate}`, 15, y)
      y += 5
    }
    if (task.list?.name) {
      doc.text(`List: ${task.list.name}`, 15, y)
      y += 5
    }
    if (task.labels && task.labels.length > 0) {
      const labelNames = task.labels.map((l: any) => l.name).join(', ')
      doc.text(`Labels: ${labelNames}`, 15, y)
      y += 5
    }
    if (task.createdAt) {
      const created = new Date(task.createdAt).toLocaleDateString()
      doc.text(`Created: ${created}`, 15, y)
      y += 5
    }

    y += 3
  })

  // Convert to Buffer
  const pdfBytes = doc.output('arraybuffer')
  return Buffer.from(pdfBytes)
}