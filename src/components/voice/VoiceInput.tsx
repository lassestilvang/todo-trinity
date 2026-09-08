"use client"

import { useState, useEffect, useCallback } from 'react'
import { useTaskContext } from '@/src/hooks/useTasks'
import { useSuggestions } from '@/src/hooks/useSuggestions'
import { useToast } from '@/src/hooks/useToast'
import { motion } from 'framer-motion'
import { mic } from 'lucide-react'

interface VoiceInputProps {
  onTaskCreated?: (task: any) => void
}

export default function VoiceInput({ onTaskCreated }: VoiceInputProps) {
  const { tasks, fetchTasks, createTask } = useTaskContext()
  const { parseNaturalLanguage } = useSuggestions()
  const { addToast } = useToast()
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Check if SpeechRecognition is available
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  const isSupported = !!SpeechRecognition

  useEffect(() => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser')
    }
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      setTranscript('')
      setConfidence(0)
      setSuggestions([])
    }

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('')

      setTranscript(transcript)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (transcript.trim()) {
        processVoiceCommand(transcript)
      }
    }

    recognition.onerror = (event: any) => {
      setIsListening(false)
      setError(`Speech recognition error: ${event.error}`)
    }

    recognition.start()
  }, [transcript])

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Parse the natural language command
      const result = await parseNaturalLanguage(text)

      if (result.confidence < 30) {
        setError('Could not understand the command. Please try again.')
        return
      }

      // Create the task
      const newTask = await createTask({
        title: result.task.title,
        description: result.task.description,
        status: result.task.status,
        priority: result.task.priority,
        dueDate: result.task.dueDate,
        listId: result.task.listId,
        labelIds: result.task.labelIds
      })

      setSuggestions(result.suggestions)
      setConfidence(result.confidence)

      // Provide feedback
      addToast(`Task created: "${newTask.task.title}"`, 'success')

      // Refresh tasks
      await fetchTasks()

      if (onTaskCreated) {
        onTaskCreated(newTask.task)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process voice command')
      addToast('Voice command failed', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const stopListening = useCallback(() => {
    // SpeechRecognition automatically stops on onend
    setIsListening(false)
  }, [])

  const handleClick = () => {
    if (isListening) {
      stopListening()
    } else if (!isProcessing) {
      startListening()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isListening ? 1 : 0.8, scale: isListening ? 1.1 : 0.8 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <div className="relative">
        <button
          onClick={handleClick}
          disabled={isProcessing || !isSupported}
          className={`w-14 h-14 rounded-full flex items-center justify-center
            ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}
            text-white shadow-lg hover:shadow-xl transition-shadow
            ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600 hover:!bg-red-600'}`}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          title={isListening ? 'Listening... Speak now' : 'Click to start voice input'}
        >
          {isListening ? (
            <motion.div
              while={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6"
            >
              <mic className="w-5 h-5 text-white" />
            </motion.div>
          ) : (
            <mic className="w-5 h-5 text-white" />
          )}
        </button>

        {!isSupported && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded text-sm whitespace-nowrap z-10">
            Speech recognition not supported
          </div>
        )}

        {error && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded text-sm whitespace-nowrap z-10">
            {error}
          </div>
        )}

        {transcript && !isListening && (
          <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-md text-sm max-w-xs whitespace-normal z-10">
            "{transcript}"
          </div>
        )}

        {suggestions.length > 0 && !isListening && (
          <div className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-2 rounded-md text-sm max-w-xs z-10">
            <div className="font-medium mb-1">Did you mean:</div>
            <ul className="text-sm space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index}>• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {confidence > 0 && !isListening && (
          <div className="absolute bottom-full mb-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded text-xs z-10">
            Confidence: {confidence}%
          </div>
        )}
      </div>
    </motion.div>
  )
}