import type { Instruction, RegisterState, ExecutionStep } from "./types"

export function executeInstruction(
  instruction: Instruction,
  registers: RegisterState,
  memory: number[],
): ExecutionStep[] {
  const steps: ExecutionStep[] = []

  // Fetch phase
  steps.push({
    phase: "fetch",
    description: "Fetching instruction from memory",
    registerChanges: {
      PC: registers.PC + 1,
    },
  })

  // Decode phase
  steps.push({
    phase: "decode",
    description: `Decoding instruction: ${instruction.mnemonic}`,
  })

  // Execute phase (specific to each instruction)
  switch (instruction.mnemonic) {
    case "MOV AX, 42":
      steps.push({
        phase: "execute",
        description: "Moving value 42 to register AX",
        registerChanges: {
          AX: 42,
        },
      })
      break

    case "MOV BX, AX":
      steps.push({
        phase: "execute",
        description: "Copying value from AX to BX",
        registerChanges: {
          BX: registers.AX,
        },
      })
      break

    case "ADD AX, BX":
      steps.push({
        phase: "execute",
        description: "Adding BX to AX",
        registerChanges: {
          AX: registers.AX + registers.BX,
          FLAGS: registers.AX + registers.BX === 0 ? 1 : 0, // Set zero flag if result is 0
        },
      })
      break

    case "SUB CX, DX":
      steps.push({
        phase: "execute",
        description: "Subtracting DX from CX",
        registerChanges: {
          CX: registers.CX - registers.DX,
          FLAGS: registers.CX - registers.DX === 0 ? 1 : 0,
        },
      })
      break

    case "MUL BX":
      steps.push({
        phase: "execute",
        description: "Multiplying AX by BX",
        registerChanges: {
          AX: registers.AX * registers.BX,
          FLAGS: registers.AX * registers.BX === 0 ? 1 : 0,
        },
      })
      break

    case "DIV CX":
      if (registers.CX === 0) {
        steps.push({
          phase: "execute",
          description: "Error: Division by zero",
          registerChanges: {
            FLAGS: 1, // Set error flag
          },
        })
      } else {
        steps.push({
          phase: "execute",
          description: "Dividing AX by CX",
          registerChanges: {
            AX: Math.floor(registers.AX / registers.CX),
            DX: registers.AX % registers.CX, // Remainder goes to DX
            FLAGS: Math.floor(registers.AX / registers.CX) === 0 ? 1 : 0,
          },
        })
      }
      break

    case "AND AX, 0xFF":
      steps.push({
        phase: "execute",
        description: "Performing bitwise AND on AX with 0xFF",
        registerChanges: {
          AX: registers.AX & 0xff,
          FLAGS: (registers.AX & 0xff) === 0 ? 1 : 0,
        },
      })
      break

    case "OR BX, CX":
      steps.push({
        phase: "execute",
        description: "Performing bitwise OR on BX with CX",
        registerChanges: {
          BX: registers.BX | registers.CX,
          FLAGS: (registers.BX | registers.CX) === 0 ? 1 : 0,
        },
      })
      break

    case "XOR DX, DX":
      steps.push({
        phase: "execute",
        description: "Performing XOR on DX with itself",
        registerChanges: {
          DX: 0, // XOR with itself always results in 0
          FLAGS: 1, // Zero flag set
        },
      })
      break

    case "NOT AX":
      steps.push({
        phase: "execute",
        description: "Performing bitwise NOT on AX",
        registerChanges: {
          AX: ~registers.AX & 0xffff, // 16-bit NOT
          FLAGS: (~registers.AX & 0xffff) === 0 ? 1 : 0,
        },
      })
      break

    case "JMP 0x100":
      steps.push({
        phase: "execute",
        description: "Jumping to memory address 0x100",
        registerChanges: {
          PC: 0x100,
        },
      })
      break

    case "JE 0x200":
      steps.push({
        phase: "execute",
        description:
          registers.FLAGS === 1 ? "Equal flag is set, jumping to address 0x200" : "Equal flag is not set, no jump",
        registerChanges: registers.FLAGS === 1 ? { PC: 0x200 } : {},
      })
      break

    case "JNE 0x300":
      steps.push({
        phase: "execute",
        description:
          registers.FLAGS === 0 ? "Equal flag is not set, jumping to address 0x300" : "Equal flag is set, no jump",
        registerChanges: registers.FLAGS === 0 ? { PC: 0x300 } : {},
      })
      break

    case "PUSH AX":
      steps.push({
        phase: "execute",
        description: "Pushing AX onto the stack",
        registerChanges: {
          SP: registers.SP - 2, // Decrement stack pointer (assuming 16-bit values)
        },
        memoryChanges: {
          [(registers.SP - 2).toString()]: registers.AX,
        },
      })
      break

    case "POP BX":
      steps.push({
        phase: "execute",
        description: "Popping value from stack into BX",
        registerChanges: {
          BX: memory[registers.SP],
          SP: registers.SP + 2, // Increment stack pointer
        },
      })
      break

    case "XCHG AX, BX":
      steps.push({
        phase: "execute",
        description: "Exchanging values in AX and BX",
        registerChanges: {
          AX: registers.BX,
          BX: registers.AX,
        },
      })
      break

    case "MOV AX, [100]":
      steps.push({
        phase: "execute",
        description: "Loading value from memory address 100 into AX",
        registerChanges: {
          AX: memory[100] || 0,
        },
      })
      break

    case "MOV [200], BX":
      steps.push({
        phase: "execute",
        description: "Storing value of BX into memory address 200",
        memoryChanges: {
          "200": registers.BX,
        },
      })
      break

    case "CMP AX, BX":
      steps.push({
        phase: "execute",
        description: "Comparing AX with BX",
        registerChanges: {
          FLAGS: registers.AX === registers.BX ? 1 : 0, // Set zero flag if equal
        },
      })
      break

    case "INC CX":
      steps.push({
        phase: "execute",
        description: "Incrementing CX by 1",
        registerChanges: {
          CX: registers.CX + 1,
          FLAGS: registers.CX + 1 === 0 ? 1 : 0,
        },
      })
      break

    case "DEC BX":
      steps.push({
        phase: "execute",
        description: "Decrementing BX by 1",
        registerChanges: {
          BX: registers.BX - 1,
          FLAGS: registers.BX - 1 === 0 ? 1 : 0,
        },
      })
      break

    case "IN AX, 60h":
      steps.push({
        phase: "execute",
        description: "Reading input from port 60h into AX",
        registerChanges: {
          AX: 0x42, // Simulated input value
        },
      })
      break

    case "OUT 61h, AL":
      steps.push({
        phase: "execute",
        description: "Sending value in AL to output port 61h",
        // No register changes, just output
      })
      break

    case "CALL 0x400":
      steps.push({
        phase: "execute",
        description: "Calling subroutine at address 0x400",
        registerChanges: {
          SP: registers.SP - 2,
          PC: 0x400,
        },
        memoryChanges: {
          [(registers.SP - 2).toString()]: registers.PC,
        },
      })
      break

    case "RET":
      steps.push({
        phase: "execute",
        description: "Returning from subroutine",
        registerChanges: {
          PC: memory[registers.SP],
          SP: registers.SP + 2,
        },
      })
      break

    default:
      steps.push({
        phase: "execute",
        description: "Executing instruction",
      })
  }

  // Memory access phase (if needed)
  if (
    ["PUSH AX", "POP BX", "JMP 0x100", "MOV AX, [100]", "MOV [200], BX", "CALL 0x400", "RET"].includes(
      instruction.mnemonic,
    )
  ) {
    steps.push({
      phase: "memory",
      description: "Accessing memory",
    })
  }

  // Writeback phase
  steps.push({
    phase: "writeback",
    description: "Writing results back to registers",
  })

  return steps
}
