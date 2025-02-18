# JS-Peer Refactoring Project

This document outlines the step-by-step plan to refactor the js-peer codebase into smaller, more maintainable modules while preserving functionality.

## Stage 1: Core Library & Message Handling
### Direct Message System
- [ ] Create new directory structure:
  ```
  src/lib/messages/
    ├── index.ts         # Facade
    ├── types.ts         # Shared types
    ├── encoder.ts       # Message encoding logic
    ├── decoder.ts       # Message decoding logic
    ├── validation.ts    # Message validation
    └── handlers/        # Message-specific handlers
  ```
- [ ] Refactor protobuf integration:
  - [ ] Move from `src/lib/protobuf/direct-message.ts` (385 lines) to modular structure
  - [ ] Split protocol buffer definitions into separate files by message type
  - [ ] Create specialized encoders/decoders for each message type

### LibP2P Integration
- [ ] Reorganize `src/lib/libp2p/start.ts` (130 lines):
  - [ ] Extract network initialization logic
  - [ ] Separate peer discovery handling
  - [ ] Create dedicated connection management module
  - [ ] Move stream handling to its own module

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
- [ ] Create organized component structure:
  ```
  src/components/
    ├── forms/          # Form controls
    ├── navigation/     # Nav components
    ├── layout/        # Layout components
    └── common/        # Shared utilities
  ```
- [ ] Refactor form controls:
  - [ ] Move switch.tsx (222 lines) to forms/
  - [ ] Split button.tsx (217 lines) into button variants
  - [ ] Reorganize listbox.tsx (208 lines)
  - [ ] Simplify dropdown.tsx (194 lines)
  - [ ] Extract shared logic from checkbox.tsx (175 lines) and radio.tsx (157 lines)

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

## Progress Tracking
- [ ] Stage 1 - Core Library (0%)
- [ ] Stage 2 - State Management (0%)
- [ ] Stage 3 - Component Library (0%)
- [ ] Stage 4 - Pages & Routing (0%)
- [ ] Stage 5 - Testing & Documentation (0%)

## Notes
- Each stage can be worked on independently
- Priority should be given to most used/critical components
- Regular benchmarking should be done to ensure performance is maintained
- Documentation should be updated as changes are made