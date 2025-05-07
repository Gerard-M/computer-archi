"use client"

import { useDrop } from "react-dnd"
import { Cpu, ArrowRight, RotateCcw, Info, Zap, Sparkles, HelpCircle, ChevronUp, ChevronDown } from "lucide-react"
import type { Instruction, CPUState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
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
  const [showHistory, setShowHistory] = useState(true)

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

  const handleCloseSummary = () => {
    setShowSummary(false)
  }

  const resetSimulation = () => {
    setCPUState((prev) => ({
      ...prev,
      currentInstruction: null,
      executionPhase: "idle",
      executionSteps: [],
      currentStep: -1,
      isAnimating: false,
    }))
    setInstructionHistory([])
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 relative">
      <div className="flex justify-between items-center mb-8">
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

      {/* Execution Status - Now floating in top right when active */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CPU Diagram - Now full width and larger */}
        <div className="lg:col-span-3">
          <div
            ref={drop}
            className={`relative border-2 ${
              isOver ? "border-indigo-500 bg-indigo-50" : "border-slate-200"
            } rounded-xl p-6 h-[550px] transition-all duration-300 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden`}
          >
            {isOver && (
              <div className="absolute inset-0 bg-indigo-500 opacity-10 z-10 pointer-events-none">
                {[...Array(20)].map((_, i) => (
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
                className="text-center text-slate-500"
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
                  <Cpu className="mx-auto h-20 w-20 mb-4 text-indigo-400" />
                </motion.div>
                <p className="text-lg font-medium">Drag an instruction here to start</p>
                <p className="text-sm text-slate-400 mt-2">Watch the CPU process it step by step</p>
              </motion.div>
            ) : (
              <>
                <CPUDiagram cpuState={cpuState} instructionHistory={instructionHistory} />

                {/* Replace the Instruction History List section with this: */}
                {/* Current Instruction */}
                {currentInstruction && (
                  <motion.div
                    className="absolute top-4 left-4 transform -translate-y-1/2 bg-white px-4 py-2 border border-indigo-300 rounded-lg shadow-md z-20"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 10,
                    }}
                  >
                    <span className="font-mono font-medium text-sm text-indigo-600">{currentInstruction.mnemonic}</span>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Registers and Memory - Now collapsible */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden mb-4">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 transition-colors"
              onClick={() => setShowRegisters(!showRegisters)}
              aria-expanded={showRegisters}
              aria-controls="registers-panel"
            >
              <h3 className="font-bold text-indigo-700 flex items-center">
                <Badge variant="outline" className="mr-2 bg-indigo-100 text-indigo-700 border-indigo-200">
                  CPU Registers
                </Badge>
                <span className="text-xs text-slate-500 ml-2">(Think of these as the CPU's built-in memory boxes)</span>
              </h3>
              {showRegisters ? (
                <ChevronUp className="h-5 w-5 text-indigo-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-indigo-500" />
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
                  <div className="p-4 pt-0">
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(registers).map(([name, value]) => (
                        <motion.div
                          key={name}
                          className="flex justify-between bg-white p-3 rounded-lg shadow-sm border border-indigo-100"
                          whileHover={{ scale: 1.03 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <span className="font-mono font-bold text-indigo-600">{name}:</span>
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
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-purple-50 transition-colors"
              onClick={() => setShowMemory(!showMemory)}
              aria-expanded={showMemory}
              aria-controls="memory-panel"
            >
              <h3 className="font-bold text-purple-700 flex items-center">
                <Badge variant="outline" className="mr-2 bg-purple-100 text-purple-700 border-purple-200">
                  Memory
                </Badge>
                <span className="text-xs text-slate-500 ml-2">(Storage for data and programs)</span>
              </h3>
              {showMemory ? (
                <ChevronUp className="h-5 w-5 text-purple-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-purple-500" />
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
                  <div className="p-4 pt-0">
                    <div className="grid grid-cols-4 gap-2">
                      {memory.slice(0, 16).map((value, index) => (
                        <motion.div
                          key={index}
                          className="text-center bg-white p-2 rounded-lg shadow-sm border border-purple-100"
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <div className="text-xs text-purple-500 font-medium">
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
                          <span className="font-mono">{value.toString(16).padStart(4, "0").toUpperCase()}</span>
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
                          <span className="font-mono">{value.toString(16).padStart(4, "0").toUpperCase()}</span>
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
}: {
  cpuState: CPUState
  instructionHistory: Instruction[]
}) {
  const { executionPhase, currentInstruction } = cpuState

  // Different components will be highlighted based on the current phase
  const getHighlightClass = (component: string) => {
    if (executionPhase === "fetch" && component === "controlUnit")
      return "animate-pulse bg-gradient-to-r from-amber-100 to-amber-200 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
    if (executionPhase === "decode" && component === "decoder")
      return "animate-pulse bg-gradient-to-r from-emerald-100 to-emerald-200 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
    if (executionPhase === "execute" && component === "alu")
      return "animate-pulse bg-gradient-to-r from-rose-100 to-rose-200 border-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.5)]"
    if (executionPhase === "memory" && component === "memory")
      return "animate-pulse bg-gradient-to-r from-violet-100 to-violet-200 border-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.5)]"
    if (executionPhase === "writeback" && component === "registers")
      return "animate-pulse bg-gradient-to-r from-sky-100 to-sky-200 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]"

    // Default styling for components
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

  // Component descriptions for tooltips - now more beginner-friendly
  const getComponentDescription = (component: string) => {
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
  const getComponentEmoji = (component: string) => {
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
  const getSimpleLabel = (component: string) => {
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
        <div className="relative w-full h-full border-2 border-slate-400 rounded-xl p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-inner overflow-hidden">
          {/* Background circuit pattern */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-cyan-400"
                style={{
                  height: "1px",
                  width: `${20 + Math.random() * 80}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            ))}
            {[...Array(25)].map((_, i) => (
              <div
                key={i + 40}
                className="absolute rounded-full bg-cyan-400"
                style={{
                  height: "3px",
                  width: "3px",
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>

          {/* CPU Components */}
          <div className="absolute top-4 left-4 right-4 h-16 border-2 border-indigo-400 rounded-xl flex items-center justify-center font-bold text-lg bg-gradient-to-r from-indigo-800 to-violet-800 text-white shadow-lg">
            <Cpu className="mr-2 h-5 w-5" />
            Central Processing Unit (CPU)
          </div>

          {/* Control Unit */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className={`absolute top-28 left-6 w-40 h-32 border-2 rounded-xl flex items-center justify-center ${getHighlightClass("controlUnit")} shadow-md transition-all duration-300 cursor-help`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{getComponentEmoji("controlUnit")}</div>
                  <div className="font-bold text-base">Control Unit</div>
                  <div className="text-xs mt-1 text-slate-600">{getSimpleLabel("controlUnit")}</div>
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
                className={`absolute top-28 left-[calc(50%-70px)] w-40 h-32 border-2 rounded-xl flex items-center justify-center ${getHighlightClass("decoder")} shadow-md transition-all duration-300 cursor-help`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{getComponentEmoji("decoder")}</div>
                  <div className="font-bold text-base">Instruction Decoder</div>
                  <div className="text-xs mt-1 text-slate-600">{getSimpleLabel("decoder")}</div>
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs bg-emerald-50 border border-emerald-200">
              <p>{getComponentDescription("decoder")}</p>
            </TooltipContent>
          </Tooltip>

          {/* Registers */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className={`absolute top-[calc(50%+30px)] left-6 w-40 h-32 border-2 rounded-xl flex items-center justify-center ${getHighlightClass("registers")} shadow-md transition-all duration-300 cursor-help`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{getComponentEmoji("registers")}</div>
                  <div className="font-bold text-base">Registers</div>
                  <div className="text-xs mt-1 text-slate-600">{getSimpleLabel("registers")}</div>
                  <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                    <div className="bg-sky-200 px-1 rounded font-medium">AX</div>
                    <div className="bg-sky-200 px-1 rounded font-medium">BX</div>
                    <div className="bg-sky-200 px-1 rounded font-medium">CX</div>
                    <div className="bg-sky-200 px-1 rounded font-medium">DX</div>
                  </div>
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs bg-sky-50 border border-sky-200">
              <p>{getComponentDescription("registers")}</p>
            </TooltipContent>
          </Tooltip>

          {/* ALU */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className={`absolute top-[calc(50%+30px)] left-[calc(50%-70px)] w-40 h-32 border-2 rounded-xl flex items-center justify-center ${getHighlightClass("alu")} shadow-md transition-all duration-300 cursor-help`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{getComponentEmoji("alu")}</div>
                  <div className="font-bold text-base">ALU</div>
                  <div className="text-xs mt-1 text-slate-600">{getSimpleLabel("alu")}</div>
                  <div className="flex justify-center gap-2 mt-2 text-xs">
                    <div className="bg-rose-200 px-2 rounded font-medium">+</div>
                    <div className="bg-rose-200 px-2 rounded font-medium">-</div>
                    <div className="bg-rose-200 px-2 rounded font-medium">×</div>
                    <div className="bg-rose-200 px-2 rounded font-medium">÷</div>
                  </div>
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs bg-rose-50 border border-rose-200">
              <p>{getComponentDescription("alu")}</p>
            </TooltipContent>
          </Tooltip>

          {/* Cache */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className={`absolute top-28 right-[calc(25%+20px)] w-36 h-32 border-2 rounded-xl flex items-center justify-center ${getHighlightClass("cache")} shadow-md transition-all duration-300 cursor-help`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{getComponentEmoji("cache")}</div>
                  <div className="font-bold text-base">Cache</div>
                  <div className="text-xs mt-1 text-slate-600">{getSimpleLabel("cache")}</div>
                  <div className="flex justify-center gap-2 mt-2">
                    <div className="bg-orange-200 px-2 rounded font-medium text-xs">L1</div>
                    <div className="bg-orange-200 px-2 rounded font-medium text-xs">L2</div>
                  </div>
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs bg-orange-50 border border-orange-200">
              <p>{getComponentDescription("cache")}</p>
            </TooltipContent>
          </Tooltip>

          {/* Memory */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className={`absolute top-28 right-6 w-40 h-[calc(50%+24px)] border-2 rounded-xl flex items-center justify-center ${getHighlightClass("memory")} shadow-md transition-all duration-300 cursor-help`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{getComponentEmoji("memory")}</div>
                  <div className="font-bold text-base">Memory</div>
                  <div className="text-xs mt-1 text-slate-600">{getSimpleLabel("memory")}</div>
                  <div className="grid grid-cols-4 gap-1 mt-2 mx-2">
                    {Array(16)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="bg-violet-200 w-6 h-4 rounded"></div>
                      ))}
                  </div>
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs bg-violet-50 border border-violet-200">
              <p>{getComponentDescription("memory")}</p>
            </TooltipContent>
          </Tooltip>

          {/* Data Bus */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute bottom-8 left-8 right-8 h-12 border-2 border-slate-400 rounded-xl flex items-center justify-center bg-gradient-to-r from-slate-800 to-slate-700 shadow-inner cursor-help">
                <div className="font-bold text-base text-white flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-cyan-400 mr-2 animate-pulse"></span>
                  System Bus <span className="text-xs ml-2 text-slate-300">(Data Highway)</span>
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

          {/* Circuit traces and buses */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            {/* Control Unit to Decoder */}
            <path
              d="M46 44 L46 144 M46 144 L210 144 M210 144 L210 44"
              stroke="#FCD34D"
              strokeWidth="3"
              fill="none"
              strokeDasharray={executionPhase === "fetch" ? "6,6" : "0"}
              strokeOpacity={executionPhase === "fetch" ? "1" : "0.4"}
            />

            {/* Decoder to ALU */}
            <path
              d="M210 44 L210 144 M210 144 L210 250 M210 250 L210 270"
              stroke="#34D399"
              strokeWidth="3"
              fill="none"
              strokeDasharray={executionPhase === "decode" ? "6,6" : "0"}
              strokeOpacity={executionPhase === "decode" ? "1" : "0.4"}
            />

            {/* ALU to Registers */}
            <path
              d="M210 270 L210 290 M210 290 L46 290 M46 290 L46 270"
              stroke="#FB7185"
              strokeWidth="3"
              fill="none"
              strokeDasharray={executionPhase === "execute" ? "6,6" : "0"}
              strokeOpacity={executionPhase === "execute" ? "1" : "0.4"}
            />

            {/* Memory to Cache */}
            <path
              d="M454 44 L454 144 M454 144 L374 144"
              stroke="#A78BFA"
              strokeWidth="3"
              fill="none"
              strokeDasharray={executionPhase === "memory" ? "6,6" : "0"}
              strokeOpacity={executionPhase === "memory" ? "1" : "0.4"}
            />

            {/* Cache to ALU */}
            <path
              d="M374 144 L290 144 M290 144 L290 270 M290 270 L210 270"
              stroke="#A78BFA"
              strokeWidth="3"
              fill="none"
              strokeDasharray={executionPhase === "memory" ? "6,6" : "0"}
              strokeOpacity={executionPhase === "memory" ? "1" : "0.4"}
            />

            {/* Registers to System Bus */}
            <path
              d="M46 270 L46 350 M46 350 L210 350"
              stroke="#38BDF8"
              strokeWidth="3"
              fill="none"
              strokeDasharray={executionPhase === "writeback" ? "6,6" : "0"}
              strokeOpacity={executionPhase === "writeback" ? "1" : "0.4"}
            />

            {/* ALU to System Bus */}
            <path
              d="M210 270 L210 350"
              stroke="#38BDF8"
              strokeWidth="3"
              fill="none"
              strokeDasharray={executionPhase === "writeback" ? "6,6" : "0"}
              strokeOpacity={executionPhase === "writeback" ? "1" : "0.4"}
            />

            {/* Memory to System Bus */}
            <path
              d="M454 270 L454 350 M454 350 L210 350"
              stroke="#A78BFA"
              strokeWidth="3"
              fill="none"
              strokeOpacity="0.4"
            />

            {/* Additional connections */}
            <path d="M46 144 L46 270" stroke="#FCD34D" strokeWidth="3" fill="none" strokeOpacity="0.4" />

            <path d="M454 144 L454 270" stroke="#A78BFA" strokeWidth="3" fill="none" strokeOpacity="0.4" />

            {/* Data flow indicators */}
            <circle
              cx="46"
              cy="200"
              r="4"
              fill="#FCD34D"
              className={executionPhase === "fetch" ? "animate-ping" : ""}
              style={{ animationDuration: "1.5s" }}
            />

            <circle
              cx="210"
              cy="200"
              r="4"
              fill="#34D399"
              className={executionPhase === "decode" ? "animate-ping" : ""}
              style={{ animationDuration: "1.5s" }}
            />

            <circle
              cx="130"
              cy="290"
              r="4"
              fill="#FB7185"
              className={executionPhase === "execute" ? "animate-ping" : ""}
              style={{ animationDuration: "1.5s" }}
            />

            <circle
              cx="374"
              cy="144"
              r="4"
              fill="#A78BFA"
              className={executionPhase === "memory" ? "animate-ping" : ""}
              style={{ animationDuration: "1.5s" }}
            />

            <circle
              cx="130"
              cy="350"
              r="4"
              fill="#38BDF8"
              className={executionPhase === "writeback" ? "animate-ping" : ""}
              style={{ animationDuration: "1.5s" }}
            />
          </svg>

          {/* CPU Chip details */}
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-xs text-cyan-400 font-medium">
            CPU Model: x86-64 • Clock: 3.2 GHz • Cores: 1
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
