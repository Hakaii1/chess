/**
 * EventTypes.ts
 * Defines all network event types for multiplayer communication
 * This structure allows easy integration with WebSockets later
 */

export interface Position {
  x: number;
  y: number;
}

/**
 * Game Events that can be sent over network
 */
export interface MoveEvent {
  type: 'move';
  playerId: string;
  from: Position;
  to: Position;
  timestamp: number;
}

export interface CombatEvent {
  type: 'combat';
  attackerId: string;
  defenderId: string;
  damage: number;
  counterDamage: number;
  defenderAlive: boolean;
  timestamp: number;
}

export interface GameStateEvent {
  type: 'game-state';
  boardState: any; // Serialized board state
  currentTurn: string;
  timestamp: number;
}

export interface PlayerJoinedEvent {
  type: 'player-joined';
  playerId: string;
  color: 'white' | 'black';
  timestamp: number;
}

export interface GameOverEvent {
  type: 'game-over';
  winner: string;
  loser: string;
  timestamp: number;
}

export type NetworkEvent = 
  | MoveEvent 
  | CombatEvent 
  | GameStateEvent 
  | PlayerJoinedEvent 
  | GameOverEvent;

/**
 * Message wrapper for network transmission
 */
export interface NetworkMessage {
  id: string;
  event: NetworkEvent;
  sessionId: string;
}
