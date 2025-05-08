"use client"

import type React from "react"

import { useDrag } from "react-dnd"
import {
  ArrowRight,
  Plus,
  Minus,
  X,
  Divide,
  Move,
  Binary,
  CornerDownRight,
  Upload,
  Download,
  Scale,
  PlusCircle,
  Code,
  ChevronDown,
  ChevronUp,
  Calculator,
  Cpu,
  HardDrive,
  Workflow,
  Zap,
} from "lucide-react"
import type { Instruction } from "@/lib/types"
import { instructionsByType } from "@/lib/instructions"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { useState, useCallback, memo } from "react"

export default function InstructionPanel() {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    arithmetic: true,
    logical: false,
    data: false,
    control: false,
    io: false,
  })

  const toggleCategory = useCallback((category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }, [])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "arithmetic":
        return <Calculator className="h-5 w-5 mr-2" />
      case "logical":
        return <Binary className="h-5 w-5 mr-2" />
      case "data":
        return <HardDrive className="h-5 w-5 mr-2" />
      case "control":
        return <Workflow className="h-5 w-5 mr-2" />
      case "io":
        return <Zap className="h-5 w-5 mr-2" />
      default:
        return <Code className="h-5 w-5 mr-2" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "arithmetic":
        return "Math Operations"
      case "logical":
        return "Logical Operations"
      case "data":
        return "Data Movement"
      case "control":
        return "Program Flow"
      case "io":
        return "Input/Output"
      default:
        return category.charAt(0).toUpperCase() + category.slice(1)
    }
  }

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case "arithmetic":
        return "Instructions for basic math like addition and subtraction"
      case "logical":
        return "Instructions for comparing and manipulating bits"
      case "data":
        return "Instructions for moving data between registers and memory"
      case "control":
        return "Instructions for changing the flow of program execution"
      case "io":
        return "Instructions for interacting with external devices"
      default:
        return ""
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-indigo-200">
      <h2 className="text-xl font-bold mb-4 text-indigo-700 flex items-center">
        <Cpu className="mr-2 h-5 w-5" />
        CPU Instructions
      </h2>
      <p className="text-sm text-slate-600 mb-5">
        Drag an instruction to the CPU to see how it works. Click a category to see more instructions.
      </p>

      <div className="space-y-3">
        {Object.entries(instructionsByType).map(([category, instructions]) => (
          <div key={category} className="border border-indigo-100 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-3 bg-white hover:bg-indigo-50 transition-colors rounded-t-lg"
              onClick={() => toggleCategory(category)}
              aria-expanded={openCategories[category]}
              aria-controls={`category-${category}`}
            >
              <div className="flex items-center">
                {getCategoryIcon(category)}
                <span className="font-medium text-indigo-700">{getCategoryLabel(category)}</span>
                <Badge className="ml-2 bg-indigo-100 text-indigo-700 border-indigo-200">{instructions.length}</Badge>
              </div>
              {openCategories[category] ? (
                <ChevronUp className="h-5 w-5 text-indigo-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-indigo-500" />
              )}
            </button>

            {openCategories[category] && (
              <div className="p-2 bg-indigo-50/50">
                <p className="text-xs text-slate-600 mb-2 px-2">{getCategoryDescription(category)}</p>
                <AnimatePresence>
                  {instructions.map((instruction, index) => (
                    <motion.div
                      key={instruction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="mb-2"
                    >
                      <DraggableInstruction instruction={instruction} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const DraggableInstruction = memo(({ instruction }: { instruction: Instruction }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "INSTRUCTION",
    item: instruction,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  const [showExplanation, setShowExplanation] = useState(false)

  // Get the appropriate icon based on instruction type and mnemonic
  const getInstructionIcon = () => {
    const iconProps = { className: "h-5 w-5 mr-2 flex-shrink-0" }

    if (instruction.mnemonic.startsWith("MOV")) return <Move {...iconProps} />
    if (instruction.mnemonic.startsWith("ADD")) return <Plus {...iconProps} />
    if (instruction.mnemonic.startsWith("SUB")) return <Minus {...iconProps} />
    if (instruction.mnemonic.startsWith("MUL")) return <X {...iconProps} />
    if (instruction.mnemonic.startsWith("DIV")) return <Divide {...iconProps} />
    if (
      instruction.mnemonic.startsWith("AND") ||
      instruction.mnemonic.startsWith("OR") ||
      instruction.mnemonic.startsWith("XOR") ||
      instruction.mnemonic.startsWith("NOT")
    )
      return <Binary {...iconProps} />
    if (
      instruction.mnemonic.startsWith("JMP") ||
      instruction.mnemonic.startsWith("JE") ||
      instruction.mnemonic.startsWith("JNE")
    )
      return <CornerDownRight {...iconProps} />
    if (instruction.mnemonic.startsWith("PUSH")) return <Upload {...iconProps} />
    if (instruction.mnemonic.startsWith("POP")) return <Download {...iconProps} />
    if (instruction.mnemonic.startsWith("CMP")) return <Scale {...iconProps} />
    if (instruction.mnemonic.startsWith("INC")) return <PlusCircle {...iconProps} />

    return <ArrowRight {...iconProps} />
  }

  // Get background color based on instruction type
  const getTypeColor = () => {
    switch (instruction.type) {
      case "arithmetic":
        return "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-md"
      case "logical":
        return "bg-gradient-to-r from-violet-50 to-violet-100 border-violet-200 hover:bg-violet-100 hover:border-violet-300 hover:shadow-md"
      case "data":
        return "bg-gradient-to-r from-sky-50 to-sky-100 border-sky-200 hover:bg-sky-100 hover:border-sky-300 hover:shadow-md"
      case "control":
        return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 hover:bg-amber-100 hover:border-amber-300 hover:shadow-md"
      case "io":
        return "bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 hover:bg-rose-100 hover:border-rose-300 hover:shadow-md"
      default:
        return "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 hover:bg-slate-100 hover:border-slate-300 hover:shadow-md"
    }
  }

  const toggleExplanation = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowExplanation(!showExplanation)
  }

  return (
    <div className="relative">
      <motion.div
        ref={drag}
        className={`p-3 ${getTypeColor()} border rounded-xl cursor-move transition-all ${
          isDragging ? "opacity-50 scale-95" : "opacity-100"
        }`}
        whileHover={{ scale: 1.03, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        onClick={toggleExplanation}
        aria-expanded={showExplanation}
      >
        <div className="font-mono font-medium flex items-center">
          {getInstructionIcon()}
          {instruction.mnemonic}
        </div>
        <div className="text-sm text-slate-600 ml-7 mt-1">{instruction.description}</div>

        {instruction.beginner_explanation && (
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 ml-7 text-xs text-indigo-600 font-medium"
              >
                <div className="bg-indigo-50 p-2 rounded-md border border-indigo-100">
                  {instruction.beginner_explanation}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {instruction.beginner_explanation && (
          <button
            className="absolute bottom-2 right-2 text-xs text-indigo-500 hover:text-indigo-700 bg-white/80 px-2 py-0.5 rounded-full"
            onClick={toggleExplanation}
            aria-label={showExplanation ? "Hide explanation" : "Show explanation"}
          >
            {showExplanation ? "Hide" : "Explain"}
          </button>
        )}
      </motion.div>
    </div>
  )
})

DraggableInstruction.displayName = "DraggableInstruction"
