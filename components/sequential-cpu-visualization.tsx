"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Cpu,
  Zap,
  HelpCircle,
  ArrowRight,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  Clock
} from "lucide-react"
import { useDrop } from "react-dnd"
import type { Instruction, CPUState } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SequentialCPUVisualizationProps {
  cpuState: CPUState
  currentInstruction: Instruction | null
  onInstructionDrop: (instruction: Instruction) => void
  isPaused?: boolean
  playbackSpeed?: number
  onTogglePlayPause?: () => void
  onStepForward?: () => void
  onStepBackward?: () => void
  onChangeSpeed?: (speed: number) => void
}

export default function SequentialCPUVisualization({ 
  cpuState, 
  currentInstruction, 
  onInstructionDrop,
  isPaused = false,
  playbackSpeed = 1,
  onTogglePlayPause = () => {},
  onStepForward = () => {},
  onStepBackward = () => {},
  onChangeSpeed = () => {}
}: SequentialCPUVisualizationProps) {
  const { executionPhase, registers, memory } = cpuState
  
  // Set up drag and drop
  const dropRef = useRef<HTMLDivElement>(null)
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "INSTRUCTION",
    drop: (item: Instruction) => {
      onInstructionDrop(item)
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))
  
  // Connect drop ref
  useEffect(() => {
    if (dropRef.current) {
      drop(dropRef.current)
    }
  }, [drop])
  
  // Get the current active component based on execution phase
  const getCurrentComponent = () => {
    switch (executionPhase) {
      case "fetch":
        return "control"
      case "decode":
        return "decoder"
      case "execute":
        return "alu"
      case "memory":
        return "memory"
      case "writeback":
        return "registers"
      default:
        return "cpu" // Show the entire CPU in idle state
    }
  }
  
  // Component descriptions - more detailed for standalone display
  const getComponentDescription = (component: string) => {
    switch (component) {
      case "control":
        return "The Control Unit is getting the instruction from memory. It coordinates all CPU activities and tells other components what to do."
      case "decoder":
        return `The Instruction Decoder is figuring out what "${currentInstruction?.mnemonic || ''}" means and what needs to happen next. It translates machine code into specific operations.`
      case "alu":
        return `The Arithmetic Logic Unit (ALU) is performing the calculation: ${currentInstruction?.beginner_explanation || currentInstruction?.description || ''}. It handles all mathematical and logical operations.`
      case "registers":
        return "The Registers are being updated with the result of the operation. These are small, ultra-fast storage locations inside the CPU for data that's actively being used."
      case "memory":
        return "The Memory unit is being accessed to read or write data. This is where all programs and data are stored when the computer is running."
      case "cpu":
        return "The CPU is waiting for an instruction. It's the brain of the computer that processes all instructions."
      default:
        return ""
    }
  }
  
  // Get emoji for each component
  const getComponentEmoji = (component: string) => {
    switch (component) {
      case "control":
        return "🎮"
      case "decoder":
        return "🔍"
      case "alu":
        return "🧮"
      case "registers":
        return "📋"
      case "memory":
        return "💾"
      case "cpu":
        return "🖥️"
      default:
        return ""
    }
  }
  
  // Get component title
  const getComponentTitle = (component: string) => {
    switch (component) {
      case "control":
        return "Control Unit"
      case "decoder":
        return "Instruction Decoder"
      case "alu":
        return "Arithmetic Logic Unit (ALU)"
      case "registers":
        return "Registers"
      case "memory":
        return "Memory"
      case "cpu":
        return "Central Processing Unit (CPU)"
      default:
        return ""
    }
  }
  
  // Get phase description
  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case "fetch":
        return "Fetch Phase"
      case "decode":
        return "Decode Phase"
      case "execute":
        return "Execute Phase"
      case "memory":
        return "Memory Access Phase"
      case "writeback":
        return "Writeback Phase"
      default:
        return "Idle State"
    }
  }
  
  // Get component background color
  const getComponentColor = (component: string) => {
    switch (component) {
      case "control":
        return "bg-yellow-50 border-yellow-300"
      case "decoder":
        return "bg-green-50 border-green-300"
      case "alu":
        return "bg-rose-50 border-rose-300"
      case "registers":
        return "bg-blue-50 border-blue-300"
      case "memory":
        return "bg-purple-50 border-purple-300"
      case "cpu":
        return "bg-indigo-50 border-indigo-300"
      default:
        return "bg-white border-gray-300"
    }
  }

  const currentComponent = getCurrentComponent()
  
  return (
    <div 
      ref={dropRef}
      className={`w-full h-full transition-colors duration-200 ${isOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-white'} rounded-xl border ${isOver ? 'border-indigo-300' : 'border-slate-200'} shadow-md overflow-hidden`}
    >
      <div className="bg-gradient-to-b from-indigo-50 to-slate-50 p-6 h-full flex flex-col">
        {/* Header with phase indicator */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-indigo-800 flex items-center">
            <Cpu className="mr-2 h-5 w-5" />
            CPU Execution Flow
          </h3>
          
          {executionPhase !== "idle" && (
            <Badge 
              className={`
                px-3 py-1 
                ${executionPhase === "fetch" ? "bg-yellow-100 text-yellow-800 border-yellow-300" : ""}
                ${executionPhase === "decode" ? "bg-green-100 text-green-800 border-green-300" : ""}
                ${executionPhase === "execute" ? "bg-rose-100 text-rose-800 border-rose-300" : ""}
                ${executionPhase === "memory" ? "bg-purple-100 text-purple-800 border-purple-300" : ""}
                ${executionPhase === "writeback" ? "bg-blue-100 text-blue-800 border-blue-300" : ""}
              `}
            >
              {getPhaseLabel(executionPhase)}
            </Badge>
          )}
        </div>

        {/* Playback controls */}
        {executionPhase !== "idle" && cpuState.executionSteps.length > 0 && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onStepBackward}
                disabled={cpuState.currentStep <= 0}
                className="h-8 w-8 p-0"
                title="Previous step"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onTogglePlayPause}
                className="h-8 w-8 p-0"
                title={isPaused ? "Play" : "Pause"}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onStepForward}
                disabled={cpuState.currentStep >= cpuState.executionSteps.length - 1}
                className="h-8 w-8 p-0"
                title="Next step"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className="text-xs text-slate-500 mr-2">
                <Clock className="h-3 w-3 inline mr-1" /> Speed:
              </span>
              
              <Button 
                variant={playbackSpeed === 0.5 ? "default" : "outline"}
                size="sm" 
                onClick={() => onChangeSpeed(0.5)}
                className={`h-6 text-xs px-2 ${playbackSpeed === 0.5 ? 'bg-indigo-600' : ''}`}
              >
                0.5x
              </Button>
              
              <Button 
                variant={playbackSpeed === 1 ? "default" : "outline"}
                size="sm" 
                onClick={() => onChangeSpeed(1)}
                className={`h-6 text-xs px-2 ${playbackSpeed === 1 ? 'bg-indigo-600' : ''}`}
              >
                1x
              </Button>
              
              <Button 
                variant={playbackSpeed === 2 ? "default" : "outline"}
                size="sm" 
                onClick={() => onChangeSpeed(2)}
                className={`h-6 text-xs px-2 ${playbackSpeed === 2 ? 'bg-indigo-600' : ''}`}
              >
                2x
              </Button>
            </div>
            
            <div className="flex items-center">
              <Badge variant="outline" className="text-xs">
                Step {Math.min(cpuState.currentStep + 1, cpuState.executionSteps.length)} of {cpuState.executionSteps.length}
              </Badge>
            </div>
          </div>
        )}
        
        {/* Current Component Visualization */}
        <div className="flex-grow flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentComponent}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`
                w-full max-w-md aspect-square p-6 rounded-xl border-2 shadow-lg flex flex-col items-center justify-center
                ${getComponentColor(currentComponent)}
              `}
            >
              <div className="text-5xl mb-4">{getComponentEmoji(currentComponent)}</div>
              <h3 className="text-xl font-bold mb-3">{getComponentTitle(currentComponent)}</h3>
              
              {/* Component-specific visualizations */}
              {currentComponent === "registers" && (
                <div className="grid grid-cols-2 gap-3 my-4 w-full max-w-xs">
                  {Object.entries(registers).map(([reg, value]) => (
                    <div key={reg} className="bg-blue-100 rounded-lg p-2 flex justify-between items-center">
                      <span className="font-mono font-bold">{reg}:</span>
                      <span className="font-mono">{value.toString(16).toUpperCase().padStart(4, '0')}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {currentComponent === "memory" && (
                <div className="grid grid-cols-4 gap-2 my-4">
                  {memory.slice(0, 16).map((value, index) => (
                    <div key={index} className="bg-purple-100 rounded-lg p-1 text-center w-14">
                      <div className="text-xs text-purple-800 font-mono">{index}</div>
                      <div className="font-mono">{value.toString(16).toUpperCase().padStart(2, '0')}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {currentComponent === "alu" && currentInstruction && (
                <div className="bg-rose-100 rounded-lg p-3 my-4 w-full max-w-xs text-center">
                  <span className="font-mono font-bold">{currentInstruction.mnemonic}</span>
                </div>
              )}
              
              <p className="text-center mt-4 max-w-sm text-slate-700">
                {getComponentDescription(currentComponent)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Instruction Info */}
        {currentInstruction && (
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <h4 className="font-medium mb-2 flex items-center">
              <Zap className="h-4 w-4 mr-1 text-indigo-600" />
              Current Instruction:
            </h4>
            <div className="font-mono p-2 bg-white rounded border border-slate-200 text-center">
              {currentInstruction.mnemonic}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {currentInstruction.beginner_explanation || currentInstruction.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
