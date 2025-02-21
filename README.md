# Kick Chat Enhancer

A Chrome extension that enhances the chat experience on Kick.com with additional features and improvements.

## Features

- Enhanced chat interface
- Custom emote support
- Better message filtering
- Chat statistics and analytics
- Customizable themes
- Message highlighting
- User tagging
- Chat commands

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Chrome browser

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd kick-chat-enhancer
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start development server:
```bash
npm run dev
# or
yarn dev
```

4. Build the extension:
```bash
npm run build
# or
yarn build
```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `dist` directory

## Project Structure

```
kick-chat-enhancer/
├── src/
│   ├── background/     # Background service worker
│   ├── content/        # Content scripts
│   ├── popup/          # Extension popup
│   ├── components/     # Shared React components
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript type definitions
├── assets/            # Static assets and icons
├── public/            # Public assets
└── tests/            # Test files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Kick.com for their platform
- The streaming community
- All contributors to this project 