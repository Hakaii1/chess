# 🎮 Battle Chess

A web-based Battle Chess game built with TypeScript, React, and Canvas. Features single-player mode with an AI opponent and is architected to support future multiplayer functionality.

## 🚀 Features

- **Battle Chess Mechanics**: Pieces have HP, ATK, DEF stats; combat auto-resolves with damage calculation
- **Single-Player Mode**: Play against an AI opponent with move evaluation
- **Canvas-Based Rendering**: Smooth, responsive game board with piece selection and move highlighting
- **Combat Log**: Real-time display of all combat events and moves
- **Clean Architecture**: Fully separated game logic from UI for easy future multiplayer support
- **TypeScript**: Full type safety throughout the codebase

## 📦 Project Structure

```
src/
├── core/                  # Pure game logic (no UI dependencies)
│   ├── PieceStats.ts     # Piece type definitions and stats
│   ├── Piece.ts          # Individual piece class
│   ├── Board.ts          # Game board state management
│   ├── MoveValidator.ts  # Move validation rules
│   ├── CombatSystem.ts   # Combat mechanics
│   ├── GameEngine.ts     # Main game logic orchestrator
│   ├── AI.ts             # AI opponent logic
│   └── index.ts          # Core exports
├── client/               # React UI components
│   ├── App.tsx           # Main app component
│   ├── ChessboardCanvas.tsx  # Canvas renderer
│   ├── Sidebar.tsx       # Game info sidebar
│   ├── CombatLog.tsx     # Event log display
│   ├── GameUIState.ts    # React hooks for game state
│   ├── *.module.css      # Component styles
│   └── index.ts          # Client exports
├── network/              # Multiplayer networking (placeholder)
│   ├── EventTypes.ts     # Network event definitions
│   ├── NetworkClient.ts  # WebSocket client (stub)
│   └── index.ts          # Network exports
├── main.tsx             # React entry point
└── index.css            # Global styles
```

## 🏁 Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

The game will open at `http://localhost:5173`

### Build

```bash
npm run build
```

## 🎮 How to Play

1. **Select a Piece**: Click on any white piece to select it
2. **View Valid Moves**:
   - 🟢 Green circles = movement squares
   - 🔴 Red squares = attack targets
3. **Execute a Move**: Click on a valid destination
4. **Combat**: Automatically resolves when attacking
   - Attacker deals: max(ATK - DEF, 1) damage
   - Defender counter-attacks if alive
5. **Win**: When opponent's King dies, you win!

## 📊 Piece Stats

| Piece  | HP  | ATK | DEF | RNG | Special |
|--------|-----|-----|-----|-----|---------|
| Pawn   | 20  | 5   | 1   | 1   | —       |
| Knight | 35  | 15  | 5   | 1   | —       |
| Bishop | 30  | 12  | 3   | 3   | Ranged  |
| Rook   | 45  | 18  | 8   | 1   | —       |
| Queen  | 60  | 25  | 10  | 3   | Ranged  |
| King   | 50  | 10  | 10  | 1   | Heals allies +5 HP/turn |

## 🧠 AI Behavior

The AI evaluates all possible moves and selects the best one based on:

- Damage dealt (weighted 2x)
- Damage taken (penalty)
- Piece value (bonus for capturing valuable pieces)
- Board position (prefers moving toward threats)
- Safety (avoids suicide moves)

## 🔮 Future Multiplayer

The architecture is designed for easy multiplayer integration:

1. **NetworkClient** is fully stubbed and ready for WebSocket implementation
2. **GameEngine** is 100% independent of UI, making it easy to sync over network
3. **Move events** are serializable and ready for transmission
4. **Board state** can be easily serialized for state synchronization

To add multiplayer:
1. Implement WebSocket in `NetworkClient.ts`
2. Create a multiplayer mode in `GameEngine`
3. Sync moves and board state between clients
4. No changes needed to core game logic!

## 🛠️ Technology Stack

- **Language**: TypeScript
- **Framework**: React 18
- **Build Tool**: Vite
- **Rendering**: HTML5 Canvas
- **Styling**: CSS Modules

## 📝 Code Style

- Classes for game entities (Piece, Board, GameEngine)
- Pure functions for calculations (CombatSystem, MoveValidator)
- React hooks for UI state management
- Comprehensive comments on complex logic
- Type-safe interfaces throughout

## 🎯 Design Principles

1. **Separation of Concerns**: Core logic completely isolated from UI
2. **Reusability**: Components are modular and independently testable
3. **Scalability**: Easy to extend with new pieces, abilities, game modes
4. **Maintainability**: Clean code with clear naming conventions
5. **Type Safety**: Full TypeScript coverage for fewer runtime errors

## 🚦 Current Limitations

- Single-player only (multiplayer in progress)
- No piece promotion (pawns don't upgrade to other pieces)
- No special move rules (castling, en passant not implemented)
- Basic AI (not using full minimax tree)

## 📄 License

MIT

---

**Made with ⚔️ for chess lovers**
