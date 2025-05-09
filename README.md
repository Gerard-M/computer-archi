# 🧠 CPU Simulator

**Learn how a CPU works by dragging instructions and watching them execute step by step!**  
🌐 Try it live: <https://computer-archi.vercel.app/>

![Screenshot](/public/CPU-Simulator.png)

## 🚀 What is This?

The **CPU Simulator** is an interactive educational tool that helps you understand how a CPU (Central Processing Unit) functions. It's perfect for students, educators, and curious learners to explore how instructions are processed in a computer.

## 🔍 How the CPU Works

A CPU processes instructions in a series of well-defined steps:

1. **Fetch** – Get the instruction from memory  
2. **Decode** – Figure out what the instruction means  
3. **Execute** – Perform the operation  
4. **Memory Access** – Access memory if needed  
5. **Writeback** – Save the results

## 🧩 CPU Components

Understand each part of the simulated CPU:

- 🕹️ **Control Unit** – Coordinates all CPU operations, like a conductor
- ➗ **ALU (Arithmetic Logic Unit)** – Performs math and logic operations (like a calculator)
- 📦 **Registers** – Small, fast storage locations (like small boxes for data)
- ⚡ **Cache** – Fast memory that stores frequently used data
- 💾 **Memory** – Stores programs and data the CPU is working with

## 🎮 How to Use the Simulator

1. **Choose an Instruction**  
   Select from categories like Math, Logic, Data Movement, Program Flow, and Input/Output.

2. **Drag & Drop**  
   Drag your instruction into the CPU visualization panel.

3. **Watch It Run**  
   See each phase: Decode → Execute → Writeback.

4. **Hover to Learn**  
   Hover over CPU components (like the ALU or Registers) to learn what it does.

5. **Get Explanations**  
   Click "Explain" to see a simple explanation of any instruction.

💡 *Tip: Try dragging a simple instruction like `MOV AX, 42` to see how the CPU handles it. Don't worry about making mistakes - you can reset and try again anytime!*

## 🎓 What You'll Learn

- How a CPU processes instructions
- What different parts of a CPU do
- How data moves between CPU components
- How registers and memory work together
- The basics of computer architecture

## 🧩 CPU Instructions

Instructions are grouped into categories:

- 🔢 **Math Operations** (`ADD`, `SUB`, `MUL`, `DIV`, `INC`, `DEC`)
- 🧠 **Logical Operations** (`AND`, `OR`, `XOR`, `NOT`, `CMP`)
- 📦 **Data Movement** (`MOV`, `PUSH`, `POP`, `XCHG`)
- 🔁 **Program Flow** (`JMP`, `JE`, `JNE`, `CALL`, `RET`)
- ⌨️ **Input/Output** (`IN`, `OUT`)

Drag any instruction to the visual area to see how it works in detail.

## 📚 Educational Use

This simulator is designed to help learners grasp foundational computing concepts:

- 👩‍🎓 **For Students**: Practice and visualize CPU instruction flow
- 👨‍🏫 **For Teachers**: Use in classroom demos or lectures
- 👨‍💻 **For Developers**: Explore low-level computing concepts without writing assembly code

## 🛠️ Installation & Setup

To run the simulator locally:

```bash
npm i -g pnpm      # Install pnpm globally
pnpm i             # Install dependencies
pnpm dev           # Start the local dev server
```

## 👨‍💻 Tech Stack

This project is built using modern frontend technologies:

- **Next.js** – A React framework for building server-side rendered and statically generated applications
- **React** – For building interactive user interfaces
- **Tailwind CSS** – Utility-first styling framework
- **Framer Motion** – For animations and interactions
- **Recharts** – For creating charts and data visualizations
- **PostCSS** – For transforming CSS with JavaScript plugins
- **TypeScript** – For static typing in JavaScript code

## 👥 Team Members

This project was created and maintained by:

- **Lecaroz, Diomael Francis S.**
- **Magbuhos, Mann Lester M.**
- **Malapote, Gerard Andrei M.** (Project Manager)
- **Manalo, Jett Mark C.**
- **Mendoza, Jofether S.**
- **Pinili, Kristhian O.**
- **Rosales, Marc Linus D.**
