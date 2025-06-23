'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import questionsData from '@/app/mbti-test/questions.json'

export type Answer = 'A' | 'B'
export interface Question {
  id: string
  text: string
  dimension: string
  optionA: string
  optionB: string
}

export const questions: Question[] = questionsData

interface QuizContextType {
  answers: Record<string, Answer>
  setAnswer: (qid: string, ans: Answer) => void
}
const QuizContext = createContext<QuizContextType | undefined>(undefined)

export function useQuiz() {
  const ctx = useContext(QuizContext)
  if (!ctx) throw new Error('useQuiz must be inside QuizProvider')
  return ctx
}

export function QuizProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const setAnswer = (qid: string, ans: Answer) =>
    setAnswers(prev => ({ ...prev, [qid]: ans }))

  return (
    <QuizContext.Provider value={{ answers, setAnswer }}>
      {children}
    </QuizContext.Provider>
  )
}
