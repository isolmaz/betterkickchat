# Frontend Guidelines Document: Kick.com Chat Enhancement Extension

## Design System

### Color Palette

#### Primary Colors
- **Primary**: `#00CCBB` - Main brand color
- **Secondary**: `#9146FF` - Action elements color (Kick purple)
- **Accent**: `#FFD600` - Highlight elements

#### Functional Colors
- **Success**: `#4CAF50` - Positive actions/states
- **Warning**: `#FF9800` - Caution indicators
- **Error**: `#F44336` - Error states
- **Info**: `#2196F3` - Informational elements

#### Neutral Colors
- **Background**: `#121212` - Main background
- **Surface**: `#1E1E1E` - Card/element backgrounds
- **Border**: `#333333` - Separators and borders
- **Text Primary**: `#FFFFFF` - Main text
- **Text Secondary**: `#B0B0B0` - Secondary text

### Typography

#### Font Family
- **Primary**: `Inter, -apple-system, BlinkMacSystemFont, sans-serif`
- **Monospace**: `JetBrains Mono, Consolas, monospace` (for code/commands)

#### Font Sizes
- **xs**: `0.75rem` (12px)
- **sm**: `0.875rem` (14px)
- **base**: `1rem` (16px)
- **lg**: `1.125rem` (18px)
- **xl**: `1.25rem` (20px)

#### Font Weights
- **Regular**: `400`
- **Medium**: `500`
- **Semi-Bold**: `600`
- **Bold**: `700`

### Spacing System
- **unit**: `4px`
- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)

### Component Design

#### Chat Message
```
+------------------------------------------+
| [Avatar] Username           [Time][Menu] |
| Message text that can wrap to            |
| multiple lines if needed                 |
+------------------------------------------+
```

#### User Badge System
- Moderator: Shield icon + green border
- Subscriber: Star icon + tier color
- VIP: Diamond icon + purple border
- Verified: Checkmark + blue accent

#### Animation Guidelines
- **Transitions**: 150ms ease-in-out for UI elements
- **Feedback**: 100ms scale transform for clicks
- **Loading**: Subtle pulse animation (opacity: 0.7 to 1)
- **No animation option**: For accessibility/performance

## Component Architecture

### Folder Structure
```
src/
├── components/
│   ├── common/           # Shared UI components
│   ├── chat/             # Chat-specific components
│   │   ├── Message.tsx
│   │   ├── UserBadge.tsx
│   │   └── ...
│   ├── settings/         # Settings UI components
│   ├── moderation/       # Moderation tools
│   └── layout/           # Layout containers
├── hooks/                # Custom React hooks
├── store/                # Redux store configuration
├── services/             # API and service integration
├── utils/                # Utility functions
├── styles/               # Global styles
└── types/                # TypeScript type definitions
```

### Component Patterns

#### Atomic Design Methodology
- **Atoms**: Buttons, inputs, badges, icons
- **Molecules**: Message bubbles, user cards, setting items
- **Organisms**: Chat feed, settings panel, moderation dashboard
- **Templates**: Page layouts, panel configurations
- **Pages**: Full extension views (popup, options)

#### Component Template
```tsx
// ChatMessage.tsx
import React from 'react';
import classNames from 'classnames';
import { Avatar } from '../common/Avatar';
import { Timestamp } from '../common/Timestamp';
import { useMessageActions } from '../../hooks/useMessageActions';
import type { MessageProps } from '../../types';

export const ChatMessage: React.FC<MessageProps> = ({
  user,
  content,
  timestamp,
  isHighlighted,
  badges,
}) => {
  const { handleDelete, handleTimeout } = useMessageActions(user.id);
  
  return (
    <div 
      className={classNames(
        "px-md py-sm flex flex-col",
        { "bg-surface-highlighted": isHighlighted }
      )}
    >
      {/* Component implementation */}
    </div>
  );
};
```

## State Management

### Redux Store Structure
```
store/
├── index.ts                # Store configuration
├── slices/
│   ├── chatSlice.ts        # Chat messages and state
│   ├── userSlice.ts        # User preferences
│   ├── appearanceSlice.ts  # Theme settings
│   ├── moderationSlice.ts  # Moderation tools state
│   └── systemSlice.ts      # Extension system state
└── middleware/
    ├── loggerMiddleware.ts
    └── storageMiddleware.ts
```

### Local Component State Guidelines
- Use local state for:
  - UI-only states (expanded/collapsed)
  - Form input temporary values
  - Animation states
- Lift to Redux for:
  - Shared data between components
  - Persisted user preferences
  - API response caching

## Code Quality Standards

### Naming Conventions
- **Components**: PascalCase (e.g., `ChatMessage`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useMessageFilter`)
- **Actions**: camelCase, verb-based (e.g., `filterMessages`)
- **Types/Interfaces**: PascalCase with descriptive names (e.g., `UserBadge`)
- **Files**: Same as the main export name (e.g., `ChatMessage.tsx`)

### Code Style
- Functional components with hooks
- Explicit type annotations (avoid `any`)
- Max line length: 100 characters
- Destructure props at function parameter level
- JSDoc comments for public APIs and complex functions

### Performance Guidelines
- Memoize expensive calculations with `useMemo`
- Optimize renders with `React.memo` for pure components
- Virtualize long lists (chat history)
- Debounce user inputs (search, filters)
- Lazy load features not needed immediately

## Accessibility Standards

### Requirements
- Minimum contrast ratio: 4.5:1 for all text
- Keyboard navigation for all interactive elements
- Screen reader compatible components
- Support for reduced motion preference
- Text zoom support up to 200%

### Implementation Practices
- Semantic HTML elements
- ARIA attributes where appropriate
- Focus management for modal dialogs
- Skip navigation for keyboard users
- Color not used as the only means of conveying information

## Testing Strategy

### Component Testing
- Unit tests for UI components with React Testing Library
- Snapshot tests for visual regression
- Interaction tests for complex components

### State Testing
- Unit tests for reducers
- Integration tests for action creators
- Mock service worker for API testing

### Test Coverage Targets
- Critical paths: 90%+
- UI Components: 75%+
- Utility functions: 95%+