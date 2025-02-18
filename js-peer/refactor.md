# Files to Refactor (More Than 100 Lines)

385 - ./src/lib/protobuf/direct-message.ts
301 - ./src/context/chat-ctx.tsx
296 - ./src/components/chat.tsx
251 - ./src/components/chat-peer-list.tsx
222 - ./src/components/switch.tsx
217 - ./src/components/button.tsx
208 - ./src/components/listbox.tsx
201 - ./src/lib/direct-message.ts
194 - ./src/components/dropdown.tsx
175 - ./src/components/checkbox.tsx
157 - ./src/components/radio.tsx
146 - ./src/pages/index.tsx
145 - ./src/components/table.tsx
145 - ./src/components/nav.tsx
130 - ./src/lib/libp2p/start.ts

## Refactoring Strategy

The goal is to refactor each file into smaller, more focused modules while maintaining the existing interface through facade patterns. This approach allows for incremental refactoring without breaking existing functionality.

### 1. Context & State Management
**Files:**  
- `./src/context/chat-ctx.tsx`

**Suggestions:**  
- Extract common context logic (e.g., state reducers, provider setup, initial states) into smaller files
- Place helper functions in a separate "hooks" or "utils" file to simplify the core provider component

### 2. Core Library & Protobuf
**Files:**  
- `./src/lib/protobuf/direct-message.ts`  
- `./src/lib/direct-message.ts`  
- `./src/lib/libp2p/start.ts`

**Suggestions:**  
- Consolidate repeated "direct message" logic in a shared module
- Create dedicated utility files/functions (e.g., message encoding/decoding helpers)
- Refactor large logic blocks into smaller specialized modules (e.g., one for network initialization, one for message flow, etc.)

### 3. Components – UI & Controls
**Files:**  
- `./src/components/chat.tsx` | `./src/components/chat-peer-list.tsx`  
- `./src/components/switch.tsx` | `./src/components/button.tsx`  
- `./src/components/listbox.tsx` | `./src/components/dropdown.tsx`  
- `./src/components/checkbox.tsx` | `./src/components/radio.tsx`
- `./src/components/table.tsx` | `./src/components/nav.tsx`

**Suggestions:**  
- Break large components into smaller, more specific pieces (e.g., separate the table header, rows, cells)
- Group related UI elements into their own folders (e.g., "forms" for checkbox, radio, listbox; "navigation" for nav, dropdown)
- Separate complex components (like chat) into specialized subcomponents: message list, user input, peer list, etc.
- Standardize helper utilities (e.g., formatting functions, validation checks) to avoid duplication

### 4. Pages & Routing
**Files:**  
- `./src/pages/index.tsx`

**Suggestions:**  
- Break out large sections (e.g., top navigation, sidebars, main layouts) into smaller components
- Offload shared logic for data fetching or state handling to custom hooks or context providers

### 5. Common Steps for Each File
1. Create a new directory matching the original file name
2. Split the file into smaller, focused modules
3. Create an index file that maintains the original interface
4. Update imports to point to the new facade
5. Add tests for each extracted module
6. Validate functionality is preserved

### 6. Implementation Approach
- Use facade pattern to maintain backward compatibility
- Each file will be replaced by a directory containing:
  - `index.ts` - maintains original interface
  - `types.ts` - shared types and interfaces
  - Multiple smaller, focused implementation files
  - Unit tests for each module
- Follow the example of `ljs-peer/src/lib/ibp2p.ts` where functionality is encapsulated in modules and fronted through the facade
