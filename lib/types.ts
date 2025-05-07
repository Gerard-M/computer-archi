export interface Instruction {
  id: number
  mnemonic: string
  description: string
  type: "arithmetic" | "logical" | "data" | "control" | "io"
  operands: number
  beginner_explanation?: string
}

export interface RegisterState {
  AX: number
  BX: number
  CX: number
  DX: number
  PC: number
  SP: number
  FLAGS: number
  [key: string]: number
}

export interface CPUState {
  registers: RegisterState
  memory: number[]
  currentInstruction: Instruction | null
  executionPhase: "idle" | "fetch" | "decode" | "execute" | "memory" | "writeback"
  executionSteps: ExecutionStep[]
  currentStep: number
  isAnimating: boolean
}

export interface ExecutionStep {
  phase: "fetch" | "decode" | "execute" | "memory" | "writeback"
  description: string
  registerChanges?: Partial<RegisterState>
  memoryChanges?: Record<string, number>
}
