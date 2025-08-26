export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: number;
  name: string;
}

export class CardGameService {
  private deck: Card[] = [];
  private playerHands: Map<string, Card[]> = new Map();

  constructor() {
    this.initializeDeck();
  }

  private initializeDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
    const values = [
      { value: 1, name: 'A' },
      { value: 2, name: '2' },
      { value: 3, name: '3' },
      { value: 4, name: '4' },
      { value: 5, name: '5' },
      { value: 6, name: '6' },
      { value: 7, name: '7' },
      { value: 8, name: '8' },
      { value: 9, name: '9' },
      { value: 10, name: '10' },
      { value: 10, name: 'J' },
      { value: 10, name: 'Q' },
      { value: 10, name: 'K' }
    ];

    this.deck = [];
    for (const suit of suits) {
      for (const { value, name } of values) {
        this.deck.push({ suit, value, name });
      }
    }
  }

  private shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  startGame(playerId: string): Card[] {
    this.initializeDeck();
    this.shuffleDeck();
    const initialHand = this.deck.splice(0, 3);
    this.playerHands.set(playerId, initialHand);
    return initialHand;
  }

  drawCard(playerId: string): Card | null {
    const hand = this.playerHands.get(playerId);
    if (!hand || this.deck.length === 0) return null;

    const card = this.deck.pop()!;
    hand.push(card);
    return card;
  }

  getHand(playerId: string): Card[] | null {
    return this.playerHands.get(playerId) || null;
  }

  calculateScore(hand: Card[]): number {
    let score = 0;
    let aces = 0;

    for (const card of hand) {
      if (card.name === 'A') {
        aces++;
        score += 11;
      } else {
        score += card.value;
      }
    }

    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }

    return score;
  }

  endGame(playerId: string) {
    this.playerHands.delete(playerId);
  }
} 