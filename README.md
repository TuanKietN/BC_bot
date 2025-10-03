# BauCua Bot Mezon

A Mezon SDK bot implementing a Bau Cua game

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory and add your bot token:
```
BOT_TOKEN=your_bot_token_here
```

3. Build the project:
```bash
npm run build
```

4. Start the bot:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Commands

- `*bc` - Start a new game
- `*bcbet` - Bet result of current game
- `*bchistory` - Dice result of 5 nearest game
- `*kttk` - Check money
- `*rut` - Withdraw money

## Development

The project is written in TypeScript and uses:
- mezon-sdk for bot functionality
- Node.js for runtime
- TypeScript for type safety

## License

ISC 
