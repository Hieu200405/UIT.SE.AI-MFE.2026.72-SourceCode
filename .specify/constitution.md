# Project Constitution: Micro Frontend AI Agent UI (UIT.SE.AI-MFE)

## Core Directive
This document establishes the immutable technical principles, architectural rules, and quality gates for the project. All AI Coding Agents and developers **MUST** strictly adhere to these rules when generating code, planning features, or reviewing implementations. Violation of these principles will cause architecture failure.

1. Architectural Principles (Micro Frontend & Host-Remote)
Module Federation Standard: The project uses Webpack 5 Module Federation.

Singleton Dependencies: React, ReactDOM, and core shared global libraries MUST be configured as singleton: true in Module Federation settings to prevent hook errors and state mismatch:

shared: {
  react: { singleton: true, requiredVersion: deps.react },
  "react-dom": { singleton: true, requiredVersion: deps["react-dom"] }
}

Independent Execution: Every Remote App (Chat, Dashboard, Config) must be fully capable of running independently on its own port for local development and testing.

Fault Isolation (Error Boundaries): Every Remote App imported into the Host Shell MUST be wrapped inside a robust React ErrorBoundary. If a remote module crashes, it must not take down the entire Host application.

2. Tech Stack & Version Constraints
UI Framework: React (v18+) with functional components and custom hooks.

Language: TypeScript strict mode enabled ("strict": true). Avoid using any types unless absolutely necessary and documented.

Styling & Isolation: Tailwind CSS is required. To prevent style collisions across MFE boundaries, scoped styling, CSS Modules, or tailwind prefixing must be respected.

State Management & Real-time:

Distributed/Global state managed via Zustand or Custom Events where appropriate.

Real-time AI streaming responses must handle Server-Sent Events (SSE) or WebSockets cleanly with proper cleanup on component unmount.

3. Code Quality & Engineering Standards
Component Design: Keep components modular, highly cohesive, and loosely coupled. Single Responsibility Principle (SRP) applies to all MFE modules.

Clean Code: Meaningful naming conventions, clear file structures, and comprehensive comments for complex asynchronous logic (especially AI stream parsers, markdown renderers, and code-block highlighters).

Error Handling: Graceful degradation for network failures, LLM stream interruptions, or remote module loading failures (Network/Script load errors).

4. Testing & Verification Requirements
Unit & Integration Tests: Critical business logic, custom hooks, and state stores must include unit tests.

Build Verification: All micro apps must successfully build with zero bundling/TypeScript compilation errors before opening a pull request or merging code.

5. Git & Workflow Governance (Spec-Driven Development)
Specification First: No code or implementation task shall be executed without a verified spec.md, plan.md, and tasks.md inside the corresponding specs/ directory.

Atomic Tasks: Coding agents must execute tasks sequentially as defined in tasks.md, respecting dependencies (T001, T002, etc.).

Git as Source of Truth: Code changes must map directly back to specification requirements and pass all quality gates.
