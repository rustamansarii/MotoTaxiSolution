import { KeyboardLayout } from './index';

export const numbersGeneralLayout: KeyboardLayout = [
  // Row 1
  [
    { label: '1', action: 'char' },
    { label: '2', action: 'char' },
    { label: '3', action: 'char' },
    { label: '4', action: 'char' },
    { label: '5', action: 'char' },
    { label: '6', action: 'char' },
    { label: '7', action: 'char' },
    { label: '8', action: 'char' },
    { label: '9', action: 'char' },
    { label: '0', action: 'char' },
  ],
  // Row 2
  [
    { label: '-', action: 'char' },
    { label: '/', action: 'char' },
    { label: ':', action: 'char' },
    { label: ';', action: 'char' },
    { label: '(', action: 'char' },
    { label: ')', action: 'char' },
    { label: '€', action: 'char' },
    { label: '$', action: 'char' },
    { label: '&', action: 'char' },
    { label: '@', action: 'char' },
  ],
  // Row 3
  [
    { label: '#+=', action: 'switch', value: 'symbols', flex: 1.3 },
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
    { label: 'space', action: 'space', flex: 4 },
    { label: ',', action: 'char', flex: 1 },
    { label: '.', action: 'char', flex: 1 },
    { label: '⏎', action: 'enter', flex: 1.4 },
  ],
];

export const numericOnlyLayout: KeyboardLayout = [
  [
    { label: '1', action: 'char' },
    { label: '2', action: 'char' },
    { label: '3', action: 'char' },
  ],
  [
    { label: '4', action: 'char' },
    { label: '5', action: 'char' },
    { label: '6', action: 'char' },
  ],
  [
    { label: '7', action: 'char' },
    { label: '8', action: 'char' },
    { label: '9', action: 'char' },
  ],
  [
    { label: '.', action: 'char' },
    { label: '0', action: 'char' },
    { label: '⌫', action: 'backspace' },
  ],
];
