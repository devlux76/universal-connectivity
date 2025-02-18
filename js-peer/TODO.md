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
- [x] Break down `src/context/chat-ctx.tsx` (301 lines):
  ```
  src/context/chat/
    ├── index.tsx        # Main provider & context
    ├── types.ts         # Type definitions
    ├── reducers/        # State reducers
    ├── actions.ts       # Action creators
    └── hooks.ts         # Custom hooks
  ```
  - [x] Extract state management logic into reducers
  - [x] Create specialized hooks for common operations
  - [x] Implement proper error boundaries

## Stage 3: Component Library [SKIP - Pending React 19 Migration]
...

## Stage 4: Pages & Routing
### Pages Refactoring
- [ ] Refactor `src/pages/index.tsx` (currently 5.5KB):
  ```
  src/pages/
    ├── index/
      ├── index.tsx           # Main page component
      ├── components/         # Page-specific components
        ├── PeerInfo.tsx      # PeerID and addresses display
        ├── ConnectForm.tsx   # Multiaddr connection form
        └── ConnectionList.tsx # Active connections display
      ├── hooks/
        ├── useConnections.ts # Connection management
        └── useAddresses.ts   # Listen addresses management
  ```
  - [ ] Extract peer info display logic
  - [ ] Create dedicated connection form component
  - [ ] Move connection list to separate component
  - [ ] Extract connection management hooks
  - [ ] Extract address management hooks
  - [ ] Implement proper error handling

- [x] Review `src/pages/chat.tsx`:
  - [x] Already well-structured at 24 lines
  - [x] Uses proper component composition
  - [x] No immediate refactoring needed

- [x] Review app configuration:
  - [x] `_app.tsx` is minimal (15 lines)
  - [x] `_document.tsx` is minimal (11 lines)
  - [x] No refactoring needed

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
- [x] Next: Chat Context refactoring

### 2024-01-xx - Chat Context Refactor
- [x] Created modular structure for chat context
- [x] Extracted all type definitions to types.ts
- [x] Implemented state management with reducers
- [x] Created action creators for type-safe updates
- [x] Added specialized hooks for common operations:
  - [x] useMessageHandling
  - [x] useFileHandling  
  - [x] useRoomManagement
  - [x] useUnreadManagement
- [x] Migrated to immer for immutable state updates
- [x] Updated main context provider to use new structure
- [x] Next: Testing infrastructure setup

### 2025-02-18 - Pages Assessment
- [x] Analyzed current pages structure
- [x] Identified index.tsx as main refactoring target (5.5KB)
- [x] Confirmed chat.tsx is well-structured
- [x] Verified app configuration files are minimal
- [ ] Next: Begin index.tsx refactoring

Note: Testing infrastructure work is postponed until after pages refactoring

### Memory Log
- Direct Message System Refactor (Complete)
  - Split protocol buffer definitions into dedicated files
  - Created specialized encoders/decoders
  - Implemented facade pattern for backward compatibility
  
- LibP2P Integration Refactor (Complete)
  - Extracted node initialization into node-creation.ts
  - Separated peer discovery into peer-discovery.ts
  - Created connection management in connection.ts
  - Implemented stream handling in stream.ts
  - Unified all components through main facade in index.ts

- Chat Context Refactor (Complete)
  - Split into modular files (types, reducers, actions, hooks)
  - Implemented immutable updates with immer
  - Created specialized hooks for common operations
  - Maintained backward compatibility through context provider