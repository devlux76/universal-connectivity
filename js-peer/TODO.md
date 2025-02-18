# JS-Peer Refactoring Project

This document outlines the step-by-step plan to refactor the js-peer codebase into smaller, more maintainable modules while preserving functionality.

## Stage 1: Core Library & Message Handling
### Direct Message System
- [x] Create new directory structure:
  ```
  src/lib/messages/
    ├── index.ts         # Facade
    ├── types.ts         # Shared types
    ├── encoder.ts       # Message encoding logic
    ├── decoder.ts       # Message decoding logic
    ├── validation.ts    # Message validation
    └── handlers/        # Message-specific handlers
  ```
- [x] Refactor protobuf integration:
  - [x] Move from `src/lib/protobuf/direct-message.ts` (385 lines) to modular structure
  - [x] Split protocol buffer definitions into separate files by message type
  - [x] Create specialized encoders/decoders for each message type

### LibP2P Integration
- [x] Reorganize `src/lib/libp2p/start.ts` (130 lines):
  ```
  src/lib/libp2p/
    ├── index.ts           # Main facade & exports
    ├── node-creation.ts   # Node initialization
    ├── peer-discovery.ts  # Discovery logic
    ├── connection.ts      # Connection management
    └── stream.ts         # Stream handling
  ```
  - [x] Extract network initialization logic
  - [x] Separate peer discovery handling
  - [x] Create dedicated connection management module
  - [x] Move stream handling to its own module

## Stage 2: State Management
### Chat Context Refactoring
- [ ] Break down `src/context/chat-ctx.tsx` (301 lines):
  ```
  src/context/chat/
    ├── index.tsx        # Main provider & context
    ├── types.ts         # Type definitions
    ├── reducers/        # State reducers
    ├── actions.ts       # Action creators
    └── hooks/           # Custom hooks
  ```
  - [ ] Extract state management logic into reducers
  - [ ] Create specialized hooks for common operations
  - [ ] Implement proper error boundaries

## Stage 3: Component Library
### Chat Components
- [ ] Refactor `src/components/chat.tsx` (296 lines):
  ```
  src/components/chat/
    ├── index.tsx        # Main component
    ├── message-list/    # Message display
    ├── input/          # Message input
    └── controls/       # Chat controls
  ```
- [ ] Split `chat-peer-list.tsx` (251 lines) into:
  - [ ] PeerList container
  - [ ] Individual peer items
  - [ ] Status indicators
  - [ ] Search/filter functionality

### UI Controls
- [x] Create organized component structure:
  ```
  src/components/
    ├── forms/          # Form controls
    ├── navigation/     # Nav components
    ├── layout/        # Layout components
    └── common/        # Shared utilities
  ```
- [x] Refactor form controls:
  - [x] Move switch.tsx (222 lines) to forms/
  - [x] Extract shared logic from checkbox.tsx (175 lines) and radio.tsx (157 lines)
  - [x] Split button.tsx (217 lines) into button variants
  - [ ] Reorganize listbox.tsx (208 lines)
  - [ ] Simplify dropdown.tsx (194 lines)

### Navigation & Tables
- [ ] Refactor table.tsx (145 lines):
  - [ ] Create separate header component
  - [ ] Extract row component
  - [ ] Make cell component configurable
- [ ] Split nav.tsx (145 lines) into:
  - [ ] Main navigation container
  - [ ] Nav items
  - [ ] Mobile/responsive handlers

## Stage 4: Pages & Routing
- [ ] Restructure index.tsx (146 lines):
  - [ ] Extract layout components
  - [ ] Move data fetching logic to hooks
  - [ ] Separate routing logic

## Stage 5: Testing & Documentation
- [ ] Set up testing infrastructure:
  - [ ] Unit tests for all new modules
  - [ ] Integration tests for key flows
  - [ ] E2E tests for critical paths
- [ ] Create documentation:
  - [ ] API documentation for each module
  - [ ] Usage examples
  - [ ] Migration guide for internal teams

## Implementation Guidelines
1. Each refactoring task should:
   - Create a new branch for the specific component/module
   - Maintain backward compatibility
   - Include tests before merging
   - Update documentation
   - Get code review

2. Testing Strategy:
   - Write tests before refactoring (if missing)
   - Ensure all existing tests pass
   - Add new tests for extracted modules
   - Maintain test coverage metrics

3. Migration Path:
   - Use facade pattern to maintain existing interfaces
   - Allow gradual adoption of new structure
   - Provide codemods where necessary
   - Support both old and new implementations during transition

## Progress Updates

### 2024-01-xx - Core Library Refactor
- [x] Created new messages/ directory structure
- [x] Migrated protobuf definitions to modular structure
- [x] Implemented facade pattern for direct message system
- [x] Validated backward compatibility
- [x] Added type definitions
- [x] Created specialized encoders/decoders
- [x] Completed LibP2P integration refactoring:
  - [x] Created modular structure for libp2p components
  - [x] Separated node creation logic
  - [x] Extracted peer discovery functionality
  - [x] Implemented connection management
  - [x] Added stream handling module
  - [x] Created unified facade
- [ ] Next: Chat Context refactoring

### 2024-01-xx - Form Controls Refactor
- [x] Created new forms/ directory structure
- [x] Extracted shared types and base components
- [x] Refactored checkbox and radio components to use shared logic
- [x] Reduced duplication in styling and layout code
- [x] Refactored switch component to use shared patterns
- [x] Split button component into modular structure:
  - [x] Separated types
  - [x] Extracted styles configuration
  - [x] Created reusable base styles
  - [x] Improved component organization
- [ ] Next: Listbox and Dropdown components