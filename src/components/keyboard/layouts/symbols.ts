import { KeyboardLayout } from './index';

export const symbolsPage1Layout: KeyboardLayout = [
  // Row 1
  [
    { label: '[', action: 'char' },
    { label: ']', action: 'char' },
    { label: '{', action: 'char' },
    { label: '}', action: 'char' },
    { label: '#', action: 'char' },
    { label: '%', action: 'char' },
    { label: '^', action: 'char' },
    { label: '*', action: 'char' },
    { label: '+', action: 'char' },
    { label: '=', action: 'char' },
  ],
  // Row 2
  [
    { label: '_', action: 'char' },
    { label: '\\', action: 'char' },
    { label: '|', action: 'char' },
    { label: '~', action: 'char' },
    { label: '<', action: 'char' },
    { label: '>', action: 'char' },
    { label: '€', action: 'char' },
    { label: '£', action: 'char' },
    { label: '¥', action: 'char' },
    { label: '•', action: 'char' },
  ],
  // Row 3
  [
    { label: '1/2', action: 'page', value: 'page2', flex: 1.3 },
    { label: '.', action: 'char' },
    { label: ',', action: 'char' },
    { label: '?', action: 'char' },
    { label: '!', action: 'char' },
    { label: "'", action: 'char' },
    { label: '"', action: 'char' },
    { label: '⌫', action: 'backspace', flex: 1.3 },
  ],
  // Row 4
  [
    { label: 'ABC', action: 'switch', value: 'alpha', flex: 1.4 },
    { label: '123', action: 'switch', value: 'numbers', flex: 1.3 },
    { label: 'space', action: 'space', flex: 3.5 },
    { label: '.', action: 'char', flex: 1 },
    { label: '⏎', action: 'enter', flex: 1.4 },
  ],
];

export const symbolsPage2Layout: KeyboardLayout = [
  // Row 1: French extended accents and special letters
  [
    { label: 'ê', action: 'char' },
    { label: 'ë', action: 'char' },
    { label: 'î', action: 'char' },
    { label: 'ï', action: 'char' },
    { label: 'ô', action: 'char' },
    { label: 'ö', action: 'char' },
    { label: 'ù', action: 'char' },
    { label: 'û', action: 'char' },
    { label: 'ü', action: 'char' },
    { label: 'œ', action: 'char' },
  ],
  // Row 2: French quotes and extra punctuation
  [
    { label: '«', action: 'char' },
    { label: '»', action: 'char' },
    { label: '“', action: 'char' },
    { label: '”', action: 'char' },
    { label: '…', action: 'char' },
    { label: '¿', action: 'char' },
    { label: '¡', action: 'char' },
    { label: '§', action: 'char' },
    { label: '±', action: 'char' },
    { label: '°', action: 'char' },
  ],
  // Row 3
  [
    { label: '2/2', action: 'page', value: 'page1', flex: 1.3 },
    { label: '©', action: 'char' },
    { label: '®', action: 'char' },
    { label: '™', action: 'char' },
    { label: '✓', action: 'char' },
    { label: '✕', action: 'char' },
    { label: '`', action: 'char' },
    { label: '⌫', action: 'backspace', flex: 1.3 },
  ],
  // Row 4
  [
    { label: 'ABC', action: 'switch', value: 'alpha', flex: 1.4 },
    { label: '123', action: 'switch', value: 'numbers', flex: 1.3 },
    { label: 'space', action: 'space', flex: 3.5 },
    { label: '.', action: 'char', flex: 1 },
    { label: '⏎', action: 'enter', flex: 1.4 },
  ],
];
