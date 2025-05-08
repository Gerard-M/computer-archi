"use client"

import { Info, Zap, ClipboardList, ChevronDown, ChevronUp } from "lucide-react"
import type { Instruction, CPUState } from "@/lib/types"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"

interface ProcessDescriptionPanelProps {
  cpuState: CPUState
}

// Define types for our execution phases and history
type ExecutionPhase = "fetch" | "decode" | "execute" | "memory" | "writeback" | "idle"

type PhaseHistoryItem = {
  id: string // Unique ID for each phase entry
  phase: ExecutionPhase
  description: string
  expanded: boolean
}

// Type guard to check if a phase is active (not idle)
const isActivePhase = (phase: ExecutionPhase | undefined): phase is "fetch" | "decode" | "execute" | "memory" | "writeback" => {
  return phase !== undefined && phase !== "idle"
}

export default function ProcessDescriptionPanel({ cpuState }: ProcessDescriptionPanelProps) {
  const { executionPhase, currentInstruction, currentStep, executionSteps } = cpuState
  const [phaseHistory, setPhaseHistory] = useState<PhaseHistoryItem[]>([])
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({})
  const [lastInstructionRef, setLastInstructionRef] = useState<string | null>(null)

  // Function to toggle the expanded state of a phase
  const togglePhaseExpansion = (id: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Track instruction changes to reset phase history when a new instruction is loaded
  useEffect(() => {
    // Get a unique identifier for the current instruction
    const currentInstructionId = currentInstruction ? currentInstruction.mnemonic : null;
    
    // If we have a new instruction, reset everything
    if (currentInstructionId && lastInstructionRef !== currentInstructionId) {
      // Clear previous phases when instruction changes
      setPhaseHistory([])
      setExpandedPhases({})
      setLastInstructionRef(currentInstructionId)
    } else if (!currentInstructionId) {
      // No instruction is loaded
      setLastInstructionRef(null)
    }
  }, [currentInstruction, lastInstructionRef])

  // Update phase history when execution phase changes
  useEffect(() => {
    if (isActivePhase(executionPhase) && currentInstruction) {
      // Check if this phase is already in our history
      const phaseExists = phaseHistory.some(item => item.phase === executionPhase)
      
      if (!phaseExists) {
        // Add the new phase to our history
        const description = getPhaseDescription(executionPhase, currentInstruction)
        const id = `${executionPhase}-${Date.now()}`
        
        // Set this phase as expanded by default
        setExpandedPhases(prev => ({
          ...prev,
          [id]: true
        }))
        
        setPhaseHistory(prev => [...prev, { 
          id,
          phase: executionPhase,
          description,
          expanded: true // This is now just for initial state
        }])
      }
    }
    
    // Reset history when no instruction is running
    if (!executionPhase || executionPhase === "idle") {
      setPhaseHistory([])
      setExpandedPhases({})
    }
  }, [executionPhase, currentInstruction])

  const getPhaseDescription = (phase: string, instruction: Instruction | null): string => {
    if (!instruction) return ""
    
    switch (phase) {
      case "fetch":
        return "The CPU is getting the instruction from memory, like picking up a recipe card."
      case "decode":
        return `The CPU is figuring out what "${instruction.mnemonic}" means and what it needs to do.`
      case "execute":
        return `The CPU is performing the operation: ${instruction.beginner_explanation || instruction.description}`
      case "memory":
        return "The CPU is accessing memory to read or write data, like opening a filing cabinet."
      case "writeback":
        return "The CPU is saving the results back to registers, like writing down the answer."
      case "idle":
        return "The CPU is waiting for an instruction, like a chef waiting for an order."
      default:
        return "Processing the instruction..."
    }
  }

  // Get the appropriate color for each phase
  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case "fetch":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "decode":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "execute":
        return "bg-rose-100 text-rose-800 border-rose-200"
      case "memory":
        return "bg-violet-100 text-violet-800 border-violet-200"
      case "writeback":
        return "bg-sky-100 text-sky-800 border-sky-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-slate-200 h-full flex flex-col">
      <div className="flex items-center mb-4">
        <Info className="h-5 w-5 mr-2 text-indigo-600" />
        <h2 className="text-xl font-bold text-indigo-600">Current Operation</h2>
      </div>

      {executionPhase === "idle" ? (
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="mb-4 p-4 rounded-full bg-slate-100">
            <ClipboardList className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-2">No Operation Running</h3>
          <p className="text-slate-500 mb-4">
            Drag an instruction to the CPU to see the execution process
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress indicator */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Start</span>
              <span>{currentStep > 0 && executionSteps.length > 0 ? Math.round((currentStep / executionSteps.length) * 100) : 0}%</span>
              <span>Complete</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                style={{ width: `${currentStep > 0 && executionSteps.length > 0 ? Math.round((currentStep / executionSteps.length) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Current instruction info */}
          {currentInstruction && (
            <div className="mb-4 border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Current Instruction:</h3>
              <div className="p-3 bg-slate-100 rounded font-mono text-indigo-700 text-base">
                {currentInstruction.mnemonic}
              </div>
              
              <div className="mt-3 text-sm text-slate-600">
                <p>{currentInstruction.beginner_explanation || currentInstruction.description}</p>
              </div>
            </div>
          )}

          {/* Phase history with collapsible sections - larger with better spacing */}
          <div className="space-y-3 pr-1">
            {phaseHistory.length === 0 ? (
              <div className="text-center py-4 text-slate-500 italic">
                Execution will begin soon...
              </div>
            ) : (
              <AnimatePresence>
                {phaseHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="border rounded-lg overflow-hidden">
                    {/* Phase header - always visible */}
                    <div 
                      className={`w-full cursor-pointer flex items-center justify-between p-3 text-left rounded-t-lg ${getPhaseColor(item.phase)}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        togglePhaseExpansion(item.id);
                      }}
                    >
                      <span className="font-medium capitalize text-base">{item.phase} Phase</span>
                      <div className="flex-shrink-0">
                        {expandedPhases[item.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    
                    {/* Collapsible content - more compact */}
                    {expandedPhases[item.id] && (
                      <div className="p-4 bg-white text-sm text-slate-700 border-t">
                        {item.description}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
          
          {/* Show current phase if it's not in history yet */}
          {isActivePhase(executionPhase) && (
            <div className="text-center py-2 text-slate-600 animate-pulse">
              {phaseHistory.some(item => item.phase === executionPhase) ? null : (
                <Badge className={`px-3 py-1 capitalize text-sm ${getPhaseColor(executionPhase)}`}>
                  {executionPhase} Phase
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
