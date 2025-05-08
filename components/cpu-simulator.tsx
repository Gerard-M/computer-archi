"use client"

import { useState, useEffect } from "react"
import { DndProvider, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Cpu, Sparkles, BookOpen, Lightbulb } from "lucide-react"
import ClientOnly from "./client-only"
import InstructionPanel from "./instruction-panel"
import SequentialCPUVisualization from "./sequential-cpu-visualization"
import type { Instruction, CPUState, RegisterState } from "@/lib/types"
import { executeInstruction } from "@/lib/cpu-logic"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function CPUSimulator() {
  const [cpuState, setCPUState] = useState<CPUState>({
    registers: {
      AX: 0,
      BX: 0,
      CX: 0,
      DX: 0,
      PC: 0,
      SP: 0,
      FLAGS: 0,
    },
    memory: Array(64).fill(0),
    currentInstruction: null,
    executionPhase: "idle",
    executionSteps: [],
    currentStep: -1,
    isAnimating: false,
  })
  
  // Playback control states
  const [isPaused, setIsPaused] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // 0.5 = slow, 1 = normal, 2 = fast

  const [showIntro, setShowIntro] = useState(true)

  const handleInstructionDrop = (instruction: Instruction) => {
    setCPUState((prev) => ({
      ...prev,
      currentInstruction: instruction,
      executionPhase: "fetch",
      executionSteps: executeInstruction(instruction, prev.registers, prev.memory),
      currentStep: 0,
      isAnimating: true,
    }))
  }

  useEffect(() => {
    // Only proceed if animating, not paused, and there are steps remaining
    if (cpuState.isAnimating && !isPaused && cpuState.currentStep < cpuState.executionSteps.length) {
      const timer = setTimeout(() => {
        setCPUState((prev) => {
          const step = prev.executionSteps[prev.currentStep]
          const newRegisters = { ...prev.registers }
          const newMemory = [...prev.memory]

          // Apply the changes from the current step
          if (step.registerChanges) {
            Object.entries(step.registerChanges).forEach(([reg, value]) => {
              newRegisters[reg as keyof RegisterState] = value as number
            })
          }

          if (step.memoryChanges) {
            Object.entries(step.memoryChanges).forEach(([addr, value]) => {
              newMemory[Number.parseInt(addr)] = value
            })
          }

          return {
            ...prev,
            registers: newRegisters,
            memory: newMemory,
            executionPhase: step.phase,
            currentStep: prev.currentStep + 1,
            isAnimating: prev.currentStep + 1 < prev.executionSteps.length,
          }
        })
      }, 1000 / playbackSpeed) // Adjust speed based on playbackSpeed setting

      return () => clearTimeout(timer)
    }
  }, [cpuState.isAnimating, cpuState.currentStep, cpuState.executionSteps, isPaused, playbackSpeed])

  const resetSimulation = () => {
    setCPUState((prev) => ({
      ...prev,
      currentInstruction: null,
      executionPhase: "idle",
      executionSteps: [],
      currentStep: -1,
      isAnimating: false,
    }))
    setIsPaused(false)
    setPlaybackSpeed(1)
  }
  
  // Step forward one execution step
  const stepForward = () => {
    if (cpuState.currentStep < cpuState.executionSteps.length - 1) {
      setCPUState((prev) => {
        const step = prev.executionSteps[prev.currentStep + 1]
        const newRegisters = { ...prev.registers }
        const newMemory = [...prev.memory]

        // Apply the changes from the next step
        if (step.registerChanges) {
          Object.entries(step.registerChanges).forEach(([reg, value]) => {
            newRegisters[reg as keyof RegisterState] = value as number
          })
        }

        if (step.memoryChanges) {
          Object.entries(step.memoryChanges).forEach(([addr, value]) => {
            newMemory[Number.parseInt(addr)] = value
          })
        }

        return {
          ...prev,
          registers: newRegisters,
          memory: newMemory,
          executionPhase: step.phase,
          currentStep: prev.currentStep + 1,
          isAnimating: false, // Stop automatic animation when manually stepping
        }
      })
    }
  }
  
  // Step backward one execution step
  const stepBackward = () => {
    if (cpuState.currentStep > 0) {
      // We need to rebuild the CPU state up to the previous step
      // by applying all steps from the beginning up to currentStep - 1
      const targetStep = cpuState.currentStep - 1
      
      // Start with initial state
      const initialRegisters: RegisterState = {
        AX: 0, BX: 0, CX: 0, DX: 0, PC: 0, SP: 0, FLAGS: 0
      }
      const initialMemory = Array(64).fill(0)
      
      // Apply all steps up to the target step
      let newRegisters = { ...initialRegisters }
      let newMemory = [...initialMemory]
      let newPhase: "idle" | "fetch" | "decode" | "execute" | "memory" | "writeback" = "idle"
      
      for (let i = 0; i <= targetStep; i++) {
        const step = cpuState.executionSteps[i]
        newPhase = step.phase
        
        if (step.registerChanges) {
          Object.entries(step.registerChanges).forEach(([reg, value]) => {
            newRegisters[reg as keyof RegisterState] = value as number
          })
        }
        
        if (step.memoryChanges) {
          Object.entries(step.memoryChanges).forEach(([addr, value]) => {
            newMemory[Number.parseInt(addr)] = value
          })
        }
      }
      
      setCPUState((prev) => ({
        ...prev,
        registers: newRegisters,
        memory: newMemory,
        executionPhase: newPhase,
        currentStep: targetStep,
        isAnimating: false, // Stop automatic animation when manually stepping
      }))
    }
  }
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (!cpuState.isAnimating && !isPaused) {
      // If not currently animating and not paused, restart animation
      setCPUState((prev) => ({
        ...prev,
        isAnimating: prev.currentStep < prev.executionSteps.length - 1,
      }))
    }
    setIsPaused(prev => !prev)
  }
  
  // Change playback speed
  const changeSpeed = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed)
  }

  const [particles, setParticles] = useState<Array<{
    id: number;
    width: number;
    height: number;
    top: number;
    left: number;
    animation: string;
    animationDelay: string;
  }>>([]);

  // Only create particles on the client side
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      width: 10 + Math.random() * 20,
      height: 10 + Math.random() * 20,
      top: Math.random() * 100,
      left: Math.random() * 100,
      animation: `float ${10 + Math.random() * 20}s linear infinite`,
      animationDelay: `${Math.random() * 10}s`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-slate-50 to-violet-50 py-8">
        {/* Background particles - only rendered client-side */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute bg-indigo-200 rounded-full opacity-20"
              style={{
                width: `${particle.width}px`,
                height: `${particle.height}px`,
                top: `${particle.top}%`,
                left: `${particle.left}%`,
                animation: particle.animation,
                animationDelay: particle.animationDelay,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.header
            className="text-center py-6 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Cpu className="h-12 w-12 text-indigo-600 mr-3" />
                <Sparkles className="h-5 w-5 text-amber-400 absolute -top-1 -right-1" />
              </div>
              <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                CPU Simulator
              </h1>
            </div>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Learn how a CPU works by dragging instructions and watching them execute step by step!
            </p>
            <div className="flex justify-center mt-5">
              <Button
                variant="outline"
                onClick={() => setShowIntro(true)}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:bg-indigo-100 transition-all"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                How to Use This Simulator
              </Button>
            </div>
          </motion.header>

          <div className="flex flex-col lg:flex-row gap-8 mb-12">
            <motion.div
              className="lg:w-1/4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <InstructionPanel />
            </motion.div>

            <motion.div
              className="lg:w-3/4 lg:min-h-[600px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="rounded-xl border border-indigo-200 bg-white shadow-sm p-6">
                <SequentialCPUVisualization
                  cpuState={cpuState}
                  currentInstruction={cpuState.currentInstruction}
                  onInstructionDrop={handleInstructionDrop}
                  isPaused={isPaused}
                  playbackSpeed={playbackSpeed}
                  onTogglePlayPause={togglePlayPause}
                  onStepForward={stepForward}
                  onStepBackward={stepBackward}
                  onChangeSpeed={changeSpeed}
                />
                
                {!cpuState.isAnimating && cpuState.executionPhase === "idle" && (
                  <div className="mt-4 text-center">
                    <p className="text-slate-600 mb-3">Drag an instruction here to see the CPU process it</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={resetSimulation}
                      className="text-indigo-600"
                    >
                      Reset Simulation
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <motion.footer
            className="text-center text-sm text-slate-500 py-6 border-t border-indigo-100 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-indigo-500 font-medium">
              Interactive CPU Simulator - Learn how a CPU processes instructions
            </p>
            <p className="text-xs mt-1 text-slate-400">Drag and drop instructions to see the CPU in action!</p>
          </motion.footer>
        </div>
      </div>

      {/* Intro Dialog */}
      <Dialog open={showIntro} onOpenChange={setShowIntro}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center text-indigo-600">
              <Lightbulb className="mr-2 h-5 w-5" />
              Welcome to the CPU Simulator!
            </DialogTitle>
            <DialogDescription>A fun way to learn how computers process instructions</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="p-4 rounded-xl border bg-white border-slate-200">
              <h4 className="font-bold text-indigo-700 mb-2">What is this?</h4>
              <p className="text-slate-700">
                This simulator shows you how a CPU (the brain of a computer) works. You can drag different instructions
                and watch as the CPU processes them step by step.
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-white border-slate-200">
              <h4 className="font-bold text-indigo-700 mb-2">How to Use It</h4>
              <ol className="space-y-2 text-slate-700">
                <li>
                  1. <span className="font-medium">Choose an instruction</span> from the categories on the left
                </li>
                <li>
                  2. <span className="font-medium">Drag the instruction</span> to the CPU visualization area
                </li>
                <li>
                  3. <span className="font-medium">Watch</span> as the CPU processes it step by step
                </li>
                <li>
                  4. <span className="font-medium">Hover</span> over any CPU component to learn what it does
                </li>
                <li>
                  5. <span className="font-medium">Click "Explain"</span> on any instruction to see a simple explanation
                </li>
              </ol>
            </div>

            <div className="p-4 rounded-xl border bg-white border-slate-200">
              <h4 className="font-bold text-indigo-700 mb-2">What You'll Learn</h4>
              <ul className="space-y-2 text-slate-700">
                <li>• How a CPU processes instructions</li>
                <li>• What different parts of a CPU do</li>
                <li>• How data moves between CPU components</li>
                <li>• How registers and memory work together</li>
                <li>• The basics of computer architecture</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <h4 className="font-bold text-indigo-700 mb-2">Ready to Start?</h4>
              <p className="text-slate-700">
                Try dragging a simple instruction like "MOV AX, 42" to see how the CPU handles it. Don't worry about
                making mistakes - you can reset and try again anytime!
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setShowIntro(false)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              Let's Get Started!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add global animation keyframes */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(0) translateX(20px);
          }
          75% {
            transform: translateY(20px) translateX(10px);
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </DndProvider>
  )
}
