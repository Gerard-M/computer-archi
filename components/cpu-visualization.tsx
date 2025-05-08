"use client"

import { useDrop } from "react-dnd"
import { Cpu, ArrowRight, RotateCcw, Info, Zap, Sparkles, HelpCircle, ChevronUp, ChevronDown } from "lucide-react"
import type { Instruction, CPUState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import React, { useState, useEffect, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

interface CPUVisualizationProps {
  cpuState: CPUState
  onInstructionDrop: (instruction: Instruction) => void
  onReset: () => void
  setCPUState: (cpuState: (prevState: CPUState) => CPUState) => void
}

export default function CPUVisualization({ cpuState, onInstructionDrop, onReset, setCPUState }: CPUVisualizationProps) {
  const dropRef = useRef<HTMLDivElement | null>(null)
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "INSTRUCTION",
    drop: (item: Instruction) => {
      onInstructionDrop(item)
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))

  const { registers, memory, currentInstruction, executionPhase, executionSteps, currentStep, isAnimating } = cpuState
  const [showSummary, setShowSummary] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showOperationStatus, setShowOperationStatus] = useState(false)
  const [showRegisters, setShowRegisters] = useState(true)
  const [showMemory, setShowMemory] = useState(true)
  const [instructionHistory, setInstructionHistory] = useState<Instruction[]>([])

  // Show operation status when animation starts
  useEffect(() => {
    if (isAnimating && currentInstruction) {
      setShowOperationStatus(true)
    }
  }, [isAnimating, currentInstruction])

  // Show summary when animation completes and hide operation status after delay
  useEffect(() => {
    if (!isAnimating && currentStep > 0 && currentStep === executionSteps.length) {
      // Wait a moment before showing the summary
      const summaryTimer = setTimeout(() => {
        setShowSummary(true)
      }, 500)

      // Hide operation status after 3 seconds
      const statusTimer = setTimeout(() => {
        setShowOperationStatus(false)
      }, 3000)

      return () => {
        clearTimeout(summaryTimer)
        clearTimeout(statusTimer)
      }
    }
  }, [isAnimating, currentStep, executionSteps.length])

  // Update instruction history when a new instruction is executed
  useEffect(() => {
    if (currentInstruction && !instructionHistory.some((inst) => inst.id === currentInstruction.id)) {
      setInstructionHistory((prev) => [...prev, currentInstruction])
    }
  }, [currentInstruction, instructionHistory])

  const handleCloseSummary = useCallback(() => {
    setShowSummary(false)
  }, [])

  const resetSimulation = useCallback(() => {
    setCPUState((prev) => ({
      ...prev,
      currentInstruction: null,
      executionPhase: "idle",
      executionSteps: [],
      currentStep: -1,
      isAnimating: false,
    }))
    setInstructionHistory([])
  }, [setCPUState])

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-indigo-600 flex items-center">
            <Cpu className="mr-2 h-5 w-5" />
            CPU Visualization
          </h2>
          <button
            onClick={() => setShowHelp(true)}
            className="ml-3 text-indigo-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-indigo-50"
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetSimulation}
          disabled={!currentInstruction}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:bg-indigo-100 transition-all"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Execution Status - Floating in top right when active */}
      <AnimatePresence>
        {currentInstruction && showOperationStatus && (
          <motion.div
            className="absolute top-6 right-6 z-10 w-72 bg-white rounded-xl border border-emerald-200 shadow-md p-4"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-bold mb-3 text-emerald-700 flex items-center text-sm">
              <Info className="mr-2 h-4 w-4" />
              Current Operation
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <div className="font-mono font-medium bg-emerald-50 px-3 py-1.5 text-sm rounded-lg border border-emerald-100">
                {currentInstruction.mnemonic}
              </div>
              <ArrowRight className="h-4 w-4 text-emerald-500" />
              <div className="px-3 py-1.5 text-sm bg-emerald-100 rounded-lg text-emerald-800 font-medium capitalize">
                {executionPhase}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / executionSteps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Start</span>
              <span>{Math.round((currentStep / executionSteps.length) * 100)}%</span>
              <span>Complete</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {/* CPU Diagram */}
        <div>
          <div
            ref={(el) => {
              dropRef.current = el
              drop(el)
            }}
            className={`relative border-2 ${
              isOver ? "border-indigo-500 bg-indigo-50" : "border-slate-200"
            } rounded-xl p-4 sm:p-6 h-[500px] sm:h-[600px] md:h-[650px] transition-all duration-300 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden`}
          >
            {isOver && (
              <div className="absolute inset-0 bg-indigo-500 opacity-10 z-10 pointer-events-none">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animation: `sparkle ${1 + Math.random() * 2}s linear infinite`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>
            )}
            {!currentInstruction ? (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center text-center z-30 p-6 sm:p-8 rounded-xl bg-gray-100/90 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, -5, 0, 5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  <Cpu className="mx-auto h-16 w-16 sm:h-20 sm:w-20 mb-4 text-violet-600" />
                </motion.div>
                <p className="text-xl sm:text-2xl font-bold text-violet-700 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
                  Drag an instruction here to start
                </p>
                <p className="text-base sm:text-lg text-gray-600 mt-2">Watch the CPU process it step by step</p>
              </motion.div>
            ) : (
              <>
                <CPUDiagram
                  cpuState={cpuState}
                  instructionHistory={instructionHistory}
                  showRegisters={showRegisters}
                  setShowRegisters={setShowRegisters}
                  showMemory={showMemory}
                  setShowMemory={setShowMemory}
                />

                {/* Current Instruction */}
                {currentInstruction && (
                  <motion.div
                    className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-transparent px-4 py-2 border-2 border-cyan-400 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.6)] z-20"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 10,
                    }}
                  >
                    <span className="font-mono font-bold text-sm text-cyan-300">{currentInstruction.mnemonic}</span>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-lg bg-gradient-to-b from-white to-slate-50">
          <DialogHeader>
            <DialogTitle className="flex items-center text-indigo-600">
              <HelpCircle className="mr-2 h-5 w-5" />
              How the CPU Works
            </DialogTitle>
            <DialogDescription>A simple guide to understanding CPU operations</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="p-4 rounded-xl border bg-white border-slate-200">
              <h4 className="font-bold text-indigo-700 mb-2">What is a CPU?</h4>
              <p className="text-slate-700">
                The CPU (Central Processing Unit) is the brain of a computer. It follows instructions to perform
                calculations, move data, and control other parts of the computer.
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-white border-slate-200">
              <h4 className="font-bold text-indigo-700 mb-2">CPU Components</h4>
              <ul className="space-y-2 text-slate-700">
                <li>
                  <span className="font-medium">Control Unit:</span> Coordinates all CPU operations, like a conductor
                </li>
                <li>
                  <span className="font-medium">ALU:</span> Performs math and logic operations (like a calculator)
                </li>
                <li>
                  <span className="font-medium">Registers:</span> Small, fast storage locations (like small boxes for
                  data)
                </li>
                <li>
                  <span className="font-medium">Cache:</span> Fast memory that stores frequently used data
                </li>
                <li>
                  <span className="font-medium">Memory:</span> Stores programs and data the CPU is working with
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border bg-white border-slate-200">
              <h4 className="font-bold text-indigo-700 mb-2">How Instructions Work</h4>
              <p className="text-slate-700 mb-2">The CPU processes instructions in stages:</p>
              <ol className="space-y-1 text-slate-700">
                <li>
                  <span className="font-medium text-amber-600">1. Fetch:</span> Get the instruction from memory
                </li>
                <li>
                  <span className="font-medium text-emerald-600">2. Decode:</span> Figure out what the instruction means
                </li>
                <li>
                  <span className="font-medium text-rose-600">3. Execute:</span> Perform the operation
                </li>
                <li>
                  <span className="font-medium text-violet-600">4. Memory:</span> Access memory if needed
                </li>
                <li>
                  <span className="font-medium text-sky-600">5. Writeback:</span> Save the results
                </li>
              </ol>
            </div>

            <div className="p-4 rounded-xl border bg-white border-slate-200">
              <h4 className="font-bold text-indigo-700 mb-2">How to Use This Simulator</h4>
              <ol className="space-y-1 text-slate-700">
                <li>1. Select an instruction category from the left panel</li>
                <li>2. Drag an instruction to the CPU visualization area</li>
                <li>3. Watch as the CPU processes the instruction step by step</li>
                <li>4. See how registers and memory change</li>
                <li>5. Click "Explain" on any instruction to learn more about it</li>
              </ol>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setShowHelp(false)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center text-emerald-600">
              <Sparkles className="mr-2 h-5 w-5" />
              Execution Complete!
            </DialogTitle>
            <DialogDescription>
              Here's what happened when the CPU ran{" "}
              <span className="font-mono font-bold">{currentInstruction?.mnemonic}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
            {executionSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border ${
                  index === executionSteps.length - 1
                    ? "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <h4 className="font-bold capitalize text-indigo-700 flex items-center">
                  <Badge className="mr-2 bg-indigo-100 text-indigo-700 border-indigo-200">{index + 1}</Badge>
                  {step.phase} Phase
                </h4>
                <p className="text-slate-700 mt-2">{step.description}</p>

                {step.registerChanges && Object.keys(step.registerChanges).length > 0 && (
                  <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200">
                    <h5 className="text-sm font-medium text-slate-700 mb-2">Register Changes:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(step.registerChanges).map(([reg, value]) => (
                        <div key={reg} className="text-sm flex justify-between p-1 border-b border-slate-100">
                          <span className="font-mono font-medium text-indigo-600">{reg}:</span>
                          <span className="font-mono">{(value ?? 0).toString(16).padStart(4, "0").toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step.memoryChanges && Object.keys(step.memoryChanges).length > 0 && (
                  <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200">
                    <h5 className="text-sm font-medium text-slate-700 mb-2">Memory Changes:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(step.memoryChanges).map(([addr, value]) => (
                        <div key={addr} className="text-sm flex justify-between p-1 border-b border-slate-100">
                          <span className="font-mono font-medium text-purple-600">Addr {addr}:</span>
                          <span className="font-mono">{(value ?? 0).toString(16).padStart(4, "0").toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCloseSummary}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              <Zap className="mr-2 h-4 w-4" />
              Run Another Instruction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CPUDiagram({
  cpuState,
  instructionHistory,
  showRegisters,
  setShowRegisters,
  showMemory,
  setShowMemory,
}: {
  cpuState: CPUState
  instructionHistory: Instruction[]
  showRegisters: boolean
  setShowRegisters: (show: boolean) => void
  showMemory: boolean
  setShowMemory: (show: boolean) => void
}): React.ReactElement {
  const { executionPhase, currentInstruction, registers, memory } = cpuState

  // Different components will be highlighted based on the current phase
  const getHighlightClass = (component: string) => {
    // If idle phase, don't grayscale anything (all components at default color)
    if (executionPhase === "idle") {
      switch (component) {
        case "controlUnit":
          return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 hover:shadow-md hover:border-amber-300"
        case "decoder":
          return "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-md hover:border-emerald-300"
        case "alu":
          return "bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 hover:shadow-md hover:border-rose-300"
        case "memory":
          return "bg-gradient-to-r from-violet-50 to-violet-100 border-violet-200 hover:shadow-md hover:border-violet-300"
        case "registers":
          return "bg-gradient-to-r from-sky-50 to-sky-100 border-sky-200 hover:shadow-md hover:border-sky-300"
        case "cache":
          return "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 hover:shadow-md hover:border-orange-300"
        case "bus":
          return "bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300"
        default:
          return "bg-slate-100 border-slate-300"
      }
    }

    // Highlight active components based on current phase
    if (executionPhase === "fetch" && component === "controlUnit")
      return "shadow-[0_0_20px_rgba(251,191,36,0.6)] bg-gradient-to-r from-amber-100 to-amber-200 border-amber-400"
    if (executionPhase === "decode" && component === "decoder")
      return "shadow-[0_0_20px_rgba(52,211,153,0.6)] bg-gradient-to-r from-emerald-100 to-emerald-200 border-emerald-400"
    if (executionPhase === "execute" && component === "alu")
      return "shadow-[0_0_20px_rgba(251,113,133,0.6)] bg-gradient-to-r from-rose-100 to-rose-200 border-rose-400"
    if (executionPhase === "memory" && component === "memory")
      return "shadow-[0_0_20px_rgba(167,139,250,0.6)] bg-gradient-to-r from-violet-100 to-violet-200 border-violet-400"
    if (executionPhase === "writeback" && component === "registers")
      return "shadow-[0_0_20px_rgba(56,189,248,0.6)] bg-gradient-to-r from-sky-100 to-sky-200 border-sky-400"
    
    // For inactive components, apply grayscale
    switch (component) {
      case "controlUnit":
        return "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 hover:shadow-md filter grayscale"
      case "decoder":
        return "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 hover:shadow-md filter grayscale"
      case "alu":
        return "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 hover:shadow-md filter grayscale"
      case "memory":
        return "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 hover:shadow-md filter grayscale"
      case "registers":
        return "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 hover:shadow-md filter grayscale"
      case "cache":
        return "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 hover:shadow-md filter grayscale"
      case "bus":
        return "bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300 filter grayscale opacity-75"
      default:
        return "bg-slate-100 border-slate-300 filter grayscale"
    }
  }

  // Component descriptions for tooltips
  const getComponentDescription = (component: string): string => {
    switch (component) {
      case "controlUnit":
        return "The Control Unit is like the conductor of an orchestra. It coordinates all CPU operations, telling other parts what to do and when to do it."
      case "decoder":
        return "The Instruction Decoder is like a translator. It takes the instruction code and figures out what operation to perform and which data to use."
      case "alu":
        return "The Arithmetic Logic Unit is like a calculator. It performs math operations (addition, subtraction) and logical operations (AND, OR, XOR)."
      case "memory":
        return "Memory is like a filing cabinet. It stores both the program instructions and the data the CPU is working with."
      case "registers":
        return "Registers are like small, quick-access boxes on the CPU's desk. They hold data that the CPU is actively working with."
      case "cache":
        return "Cache is like a small notepad for frequently used information. It's faster to access than main memory."
      case "dataBus":
        return "The Data Bus is like a highway that carries data between different parts of the computer."
      case "addressBus":
        return "The Address Bus is like a street address. It tells the CPU where in memory to find or store data."
      case "controlBus":
        return "The Control Bus carries command signals, like a traffic officer directing the flow of information."
      default:
        return "CPU component"
    }
  }

  // Get emoji for each component
  const getComponentEmoji = (component: string): string => {
    switch (component) {
      case "controlUnit":
        return "🎮"
      case "decoder":
        return "🔍"
      case "alu":
        return "🧮"
      case "memory":
        return "💾"
      case "registers":
        return "📋"
      case "cache":
        return "⚡"
      default:
        return "⚙️"
    }
  }

  // Get simple label for each component
  const getSimpleLabel = (component: string): string => {
    switch (component) {
      case "controlUnit":
        return "Gets instructions"
      case "decoder":
        return "Figures out what to do"
      case "alu":
        return "Does the math"
      case "memory":
        return "Stores data & programs"
      case "registers":
        return "Quick access storage"
      case "cache":
        return "Super fast memory"
      default:
        return ""
    }
  }

  return (
    <TooltipProvider>
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative w-full h-full rounded-xl p-2 sm:p-4 bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-800 shadow-inner overflow-hidden">
          {/* Bento-style grid layout */}
          <div className="grid grid-cols-12 grid-rows-12 gap-2 sm:gap-3 h-full w-full p-1 sm:p-2">
            {/* CPU Header - spans full width */}
            <div className="col-span-12 row-span-1 bg-gradient-to-r from-indigo-800 to-violet-800 rounded-xl border-2 border-indigo-400/50 flex items-center justify-center">
              <Cpu className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" />
              <span className="font-bold text-base sm:text-lg text-white">Central Processing Unit (CPU)</span>
            </div>

            {/* Control Unit */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className={`col-span-3 row-span-3 border-2 rounded-xl flex items-center justify-center ${getHighlightClass("controlUnit")} shadow-md transition-all duration-300 cursor-help`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="text-center p-1 sm:p-2">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{getComponentEmoji("controlUnit")}</div>
                    <div className="font-bold text-sm sm:text-base">Control Unit</div>
                    <div className="text-xs mt-1 text-slate-600 hidden sm:block">{getSimpleLabel("controlUnit")}</div>
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs bg-amber-50 border border-amber-200">
                <p>{getComponentDescription("controlUnit")}</p>
              </TooltipContent>
            </Tooltip>

            {/* Instruction Decoder */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className={`col-span-3 row-span-3 border-2 rounded-xl flex items-center justify-center ${getHighlightClass("decoder")} shadow-md transition-all duration-300 cursor-help`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="text-center p-1 sm:p-2">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{getComponentEmoji("decoder")}</div>
                    <div className="font-bold text-sm sm:text-base">Instruction Decoder</div>
                    <div className="text-xs mt-1 text-slate-600 hidden sm:block">{getSimpleLabel("decoder")}</div>
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs bg-emerald-50 border border-emerald-200">
                <p>{getComponentDescription("decoder")}</p>
              </TooltipContent>
            </Tooltip>

            {/* Cache */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className={`col-span-3 row-span-3 border-2 rounded-xl flex items-center justify-center ${getHighlightClass("cache")} shadow-md transition-all duration-300 cursor-help`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="text-center p-1 sm:p-2">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{getComponentEmoji("cache")}</div>
                    <div className="font-bold text-sm sm:text-base">Cache</div>
                    <div className="text-xs mt-1 text-slate-600 hidden sm:block">{getSimpleLabel("cache")}</div>
                    <div className="flex justify-center gap-2 mt-1 sm:mt-2">
                      <div className="bg-orange-200 px-1 sm:px-2 rounded text-xs font-medium">L1</div>
                      <div className="bg-orange-200 px-1 sm:px-2 rounded text-xs font-medium">L2</div>
                    </div>
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs bg-orange-50 border border-orange-200">
                <p>{getComponentDescription("cache")}</p>
              </TooltipContent>
            </Tooltip>

            {/* ALU */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className={`col-span-3 row-span-3 border-2 rounded-xl flex items-center justify-center ${getHighlightClass("alu")} shadow-md transition-all duration-300 cursor-help`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="text-center p-1 sm:p-2">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{getComponentEmoji("alu")}</div>
                    <div className="font-bold text-sm sm:text-base">ALU</div>
                    <div className="text-xs mt-1 text-slate-600 hidden sm:block">{getSimpleLabel("alu")}</div>
                    <div className="flex justify-center gap-1 sm:gap-2 mt-1 sm:mt-2 text-xs">
                      <div className="bg-rose-200 px-1 sm:px-2 rounded font-medium">+</div>
                      <div className="bg-rose-200 px-1 sm:px-2 rounded font-medium">-</div>
                      <div className="bg-rose-200 px-1 sm:px-2 rounded font-medium">×</div>
                      <div className="bg-rose-200 px-1 sm:px-2 rounded font-medium">÷</div>
                    </div>
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs bg-rose-50 border border-rose-200">
                <p>{getComponentDescription("alu")}</p>
              </TooltipContent>
            </Tooltip>

            {/* System Bus */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="col-span-12 row-span-1 border-2 border-indigo-400/50 rounded-xl flex items-center justify-center bg-indigo-900/40 shadow-inner cursor-help">
                  <div className="font-bold text-sm sm:text-base text-white flex items-center">
                    <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-cyan-400 mr-2 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></span>
                    System Bus <span className="text-xs ml-2 text-slate-300 hidden sm:inline">(Data Highway)</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs bg-slate-50 border border-slate-200">
                <p>
                  <strong>System Bus:</strong> Think of this as the highway system of the CPU:
                  <br />- {getComponentDescription("dataBus")}
                  <br />- {getComponentDescription("addressBus")}
                  <br />- {getComponentDescription("controlBus")}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* CPU Registers Panel */}
            <div className="col-span-6 row-span-4 bg-indigo-900/30 rounded-xl border-2 border-indigo-400/30 overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-2 hover:bg-indigo-800/50 transition-colors"
                onClick={() => setShowRegisters(!showRegisters)}
                aria-expanded={showRegisters}
                aria-controls="registers-panel"
              >
                <h3 className="font-bold text-indigo-100 flex items-center">
                  <Badge variant="outline" className="mr-2 bg-indigo-700/50 text-indigo-100 border-indigo-500/50">
                    CPU Registers
                  </Badge>
                  <span className="text-xs text-indigo-300 ml-2 hidden sm:inline">(Quick access storage)</span>
                </h3>
                {showRegisters ? (
                  <ChevronUp className="h-4 w-4 text-indigo-300" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-indigo-300" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {showRegisters && (
                  <motion.div
                    id="registers-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(registers).map(([name, value]) => (
                          <motion.div
                            key={name}
                            className={`flex justify-between p-2 rounded-lg shadow-sm border ${
                              executionPhase === "writeback"
                                ? "bg-sky-100/90 border-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                                : "bg-white/90 border-indigo-200/50"
                            }`}
                            whileHover={{ scale: 1.03 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <span className="font-mono font-bold text-indigo-700">{name}:</span>
                            <span className="font-mono text-slate-800">
                              {value.toString(16).padStart(4, "0").toUpperCase()}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Memory Panel */}
            <div className="col-span-6 row-span-4 bg-violet-900/30 rounded-xl border-2 border-violet-400/30 overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-2 hover:bg-violet-800/50 transition-colors"
                onClick={() => setShowMemory(!showMemory)}
                aria-expanded={showMemory}
                aria-controls="memory-panel"
              >
                <h3 className="font-bold text-violet-100 flex items-center">
                  <Badge variant="outline" className="mr-2 bg-violet-700/50 text-violet-100 border-violet-500/50">
                    Memory
                  </Badge>
                  <span className="text-xs text-violet-300 ml-2 hidden sm:inline">(Storage for data and programs)</span>
                </h3>
                {showMemory ? (
                  <ChevronUp className="h-4 w-4 text-violet-300" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-violet-300" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {showMemory && (
                  <motion.div
                    id="memory-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {memory.slice(0, 16).map((value, index) => (
                          <motion.div
                            key={index}
                            className={`text-center p-2 rounded-lg shadow-sm border ${
                              executionPhase === "memory"
                                ? "bg-violet-100/90 border-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.3)]"
                                : "bg-white/90 border-violet-200/50"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <div className="text-xs text-violet-600 font-medium">
                              {index.toString(16).padStart(2, "0").toUpperCase()}
                            </div>
                            <div className="font-mono text-slate-800">
                              {value.toString(16).padStart(2, "0").toUpperCase()}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CPU Chip details */}
            <div className="col-span-12 row-span-1 flex items-center justify-center">
              <div className="text-xs text-cyan-400 font-medium">CPU Model: x86-64 • Clock: 3.2 GHz • Cores: 1</div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

function getPhaseDescription(phase: string, instruction: Instruction): string {
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
