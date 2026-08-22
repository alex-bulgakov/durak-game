import { Card } from '../src/core/Card.js';
import { Deck } from '../src/core/Deck.js';
import { Rules } from '../src/core/Rules.js';
import { BotStrategy } from '../src/ai/BotStrategy.js';
import { SUITS } from '../src/utils/helpers.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('🧪 Starting Durak Engine Tests...\n');

// Test 1: Deck
console.log('1. Deck Initialization & Dealing:');
const deck = new Deck();
assert(deck.remaining === 36, 'Deck should contain 36 cards');
assert(deck.trumpCard !== null, 'Trump card should be selected');
assert(Object.values(SUITS).includes(deck.trumpSuit), 'Trump suit is valid');

const dealt = deck.deal(6);
assert(dealt.length === 6, 'Should deal exactly 6 cards');
assert(deck.remaining === 30, 'Remaining count should be 30');

// Test 2: Rules - Defending
console.log('\n2. Defense Rules:');
const trumpSuit = SUITS.SPADES;

const cardHearts6 = new Card(SUITS.HEARTS, '6');
const cardHearts7 = new Card(SUITS.HEARTS, '7');
const cardHeartsAce = new Card(SUITS.HEARTS, 'A');
const cardDiamondsKing = new Card(SUITS.DIAMONDS, 'K');
const cardSpades6 = new Card(SUITS.SPADES, '6');
const cardSpades10 = new Card(SUITS.SPADES, '10');

// Non-trump vs Non-trump same suit
assert(Rules.canDefend(cardHearts6, cardHearts7, trumpSuit) === true, '7 of Hearts beats 6 of Hearts');
assert(Rules.canDefend(cardHearts7, cardHearts6, trumpSuit) === false, '6 of Hearts cannot beat 7 of Hearts');
assert(Rules.canDefend(cardHearts6, cardDiamondsKing, trumpSuit) === false, 'Different non-trump suit cannot beat');

// Trump vs Non-trump
assert(Rules.canDefend(cardHeartsAce, cardSpades6, trumpSuit) === true, '6 of Trumps beats Ace of Hearts');

// Trump vs Trump
assert(Rules.canDefend(cardSpades6, cardSpades10, trumpSuit) === true, '10 of Trumps beats 6 of Trumps');
assert(Rules.canDefend(cardSpades10, cardSpades6, trumpSuit) === false, '6 of Trumps cannot beat 10 of Trumps');

// Test 3: Rules - Attacking
console.log('\n3. Attack Rules:');
const emptyTable = [];
assert(Rules.canAttack(cardHearts6, emptyTable, 6) === true, 'Any card can attack empty table');

const tableOnePair = [{ attack: cardHearts6, defense: cardHearts7 }];
assert(Rules.canAttack(cardSpades6, tableOnePair, 5) === true, 'Card with matching rank (6) can attack');
assert(Rules.canAttack(cardDiamondsKing, tableOnePair, 5) === false, 'Card with non-matching rank cannot attack');

// Test 4: Bot Strategy
console.log('\n4. Bot Strategy:');
const botHand = [cardHearts7, cardSpades6, cardDiamondsKing];
botHand.forEach(c => c.setTrump(c.suit === trumpSuit));

const botDefense = BotStrategy.decideDefense(botHand, [{ attack: cardHearts6, defense: null }], trumpSuit, 24);
assert(botDefense.action === 'DEFEND', 'Bot should decide to defend');
assert(botDefense.card.id === cardHearts7.id, 'Bot should choose lowest valid non-trump card (7 Hearts)');

const botDefenseImpossible = BotStrategy.decideDefense([cardDiamondsKing], [{ attack: cardHearts6, defense: null }], trumpSuit, 24);
assert(botDefenseImpossible.action === 'TAKE', 'Bot should take when no card can defend');

console.log(`\n================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
