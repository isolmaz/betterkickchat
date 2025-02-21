# Tech Stack Document: Kick.com Chat Enhancement Extension

## Core Technologies

### Frontend Framework
- **Primary**: React 18
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS with custom theme variables
- **Component Library**: Custom components with Radix UI primitives
- **Icons**: Phosphor Icons

### Extension Architecture
- **Manifest Version**: V3 (Chrome Extensions)
- **Background Service**: Service Worker
- **Content Scripts**: TypeScript-based injection
- **Storage**: Chrome Storage API (sync & local)
- **Network**: Fetch API with custom retry logic

### Build System
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with Airbnb config
- **Testing**: Jest + React Testing Library
- **CI/CD**: GitHub Actions

## Detailed Stack Breakdown

### Frontend Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| UI Framework | React 18 | Component-based UI rendering |
| Hooks | Custom React Hooks | Chat interaction and API connectivity |
| Styling | Tailwind + CSS Modules | Scoped styling with utility classes |
| Animations | Framer Motion | Smooth transitions and indicators |
| Virtualization | react-window | Efficient rendering of long chat lists |
| Forms | React Hook Form | Settings and configuration inputs |
| Tooltips | Floating UI | Contextual help and guidance |

### Extension Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| Manifest | JSON (V3 spec) | Extension configuration |
| Background | Service Worker | Persistent processes and listeners |
| Content Scripts | TypeScript | DOM manipulation and integration |
| Popup | React SPA | Quick controls interface |
| Options | React SPA | Full settings dashboard |
| Storage | Chrome Storage API | User settings and cache |
| Cross-tab | BroadcastChannel API | Multi-window synchronization |

### Data Management

| Component | Technology | Purpose |
|-----------|------------|---------|
| State | Redux Toolkit | Global state management |
| Persistence | redux-persist | Settings save/restoration |
| Caching | IndexedDB | Chat history and user data |
| API Client | Axios | Communication with Kick.com API |
| WebSocket | Custom wrapper | Real-time chat connection |
| Schema | Zod | Runtime type validation |
| Logging | debug.js | Development and error tracking |

## External Dependencies

### APIs Consumed
- Kick.com Chat WebSocket API
- Kick.com REST API for user data
- Custom emote providers (similar architecture to BTTV/FFZ)

### Third-Party Services
- Chat statistics analytics (self-hosted)
- Emote CDN fallback
- Version checking endpoint

## Development Environment

### Required Tools
- Node.js 18+
- pnpm 8+
- Chrome/Chromium browser
- VSCode with recommended extensions

### Development Workflow
1. Local development server with hot reload
2. Component storybook for isolated UI development
3. Mock WebSocket server for offline development
4. Chrome extension loading from dist folder

## Security Considerations

### Implementation Details
- Content Security Policy implementation
- XSS prevention through React's escaping
- Sanitization of user-generated content
- CORS handling for API requests
- Limited permission scope (only Kick.com domains)

### Data Handling
- Encryption for sensitive stored data
- Clear data retention policies
- Optional anonymous usage statistics
- No tracking or fingerprinting

## Performance Budget

| Metric | Target |
|--------|--------|
| Initial Load Size | <200KB (compressed) |
| Memory Usage | <75MB during normal operation |
| CPU Impact | <5% additional usage |
| Storage Usage | <10MB per channel (configurable) |
| Animation FPS | Maintain 60fps during scrolling |