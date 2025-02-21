# Better Kick Chat

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
git clone https://github.com/isolmaz/betterkickchat.git
cd betterkickchat
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Kick.com OAuth credentials
   ```bash
   cp .env.example .env
   ```

4. Start development server:
```bash
npm run dev
# or
yarn dev
```

5. Build the extension:
```bash
npm run build
# or
yarn build
```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `dist` directory

### OAuth Setup

1. Create a Kick.com developer application at https://kick.com/developers
2. Set the OAuth callback URL to:
   ```
   https://[your-github-username].github.io/betterkickchat/callback
   ```
3. Copy the client ID and secret to your `.env` file

## Project Structure

```
betterkickchat/
├── src/
│   ├── background/     # Background service worker
│   ├── content/        # Content scripts
│   ├── popup/          # Extension popup
│   ├── components/     # Shared React components
│   ├── services/       # API and service layer
│   ├── hooks/          # React hooks
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript type definitions
├── docs/              # GitHub Pages (OAuth callback)
├── public/            # Public assets
└── scripts/          # Build and utility scripts
```

## Security

This extension uses:
- PKCE OAuth flow for secure authentication
- Secure storage for tokens
- CSRF protection
- Content Security Policy
- No sensitive data in public code

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