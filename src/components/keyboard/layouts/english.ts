import { KeyboardLayout } from './index';

export const englishNormalLayout: KeyboardLayout = [
  // Row 1
  [
    { label: 'q', action: 'char' },
    { label: 'w', action: 'char' },
    { label: 'e', action: 'char' },
    { label: 'r', action: 'char' },
    { label: 't', action: 'char' },
    { label: 'y', action: 'char' },
    { label: 'u', action: 'char' },
    { label: 'i', action: 'char' },
    { label: 'o', action: 'char' },
    { label: 'p', action: 'char' },
  ],
  // Row 2
  [
    { label: 'a', action: 'char' },
    { label: 's', action: 'char' },
    { label: 'd', action: 'char' },
    { label: 'f', action: 'char' },
    { label: 'g', action: 'char' },
    { label: 'h', action: 'char' },
    { label: 'j', action: 'char' },
    { label: 'k', action: 'char' },
    { label: 'l', action: 'char' },
  ],
  // Row 3
  [
    { label: '⇧', action: 'shift', flex: 1.3 },
    { label: 'z', action: 'char' },
    { label: 'x', action: 'char' },
    { label: 'c', action: 'char' },
    { label: 'v', action: 'char' },
    { label: 'b', action: 'char' },
    { label: 'n', action: 'char' },
    { label: 'm', action: 'char' },
    { label: '⌫', action: 'backspace', flex: 1.3 },
  ],
  // Row 4
  [
    { label: '?123', action: 'switch', value: 'numbers', flex: 1.3 },
    { label: 'FR', action: 'lang', flex: 1.1 },
    { label: 'space', action: 'space', flex: 4.2 },
    { label: '.', action: 'char', flex: 1 },
    { label: '⏎', action: 'enter', flex: 1.4 },
  ],
];

export const englishShiftLayout: KeyboardLayout = [
  // Row 1
  [
    { label: 'Q', action: 'char' },
    { label: 'W', action: 'char' },
    { label: 'E', action: 'char' },
    { label: 'R', action: 'char' },
    { label: 'T', action: 'char' },
    { label: 'Y', action: 'char' },
    { label: 'U', action: 'char' },
    { label: 'I', action: 'char' },
    { label: 'O', action: 'char' },
    { label: 'P', action: 'char' },
  ],
  // Row 2
  [
    { label: 'A', action: 'char' },
    { label: 'S', action: 'char' },
    { label: 'D', action: 'char' },
    { label: 'F', action: 'char' },
    { label: 'G', action: 'char' },
    { label: 'H', action: 'char' },
    { label: 'J', action: 'char' },
    { label: 'K', action: 'char' },
    { label: 'L', action: 'char' },
  ],
  // Row 3
  [
    { label: '⇪', action: 'shift', flex: 1.3 },
    { label: 'Z', action: 'char' },
    { label: 'X', action: 'char' },
    { label: 'C', action: 'char' },
    { label: 'V', action: 'char' },
    { label: 'B', action: 'char' },
    { label: 'N', action: 'char' },
    { label: 'M', action: 'char' },
    { label: '⌫', action: 'backspace', flex: 1.3 },
  ],
  // Row 4
  [
    { label: '?123', action: 'switch', value: 'numbers', flex: 1.3 },
    { label: 'FR', action: 'lang', flex: 1.1 },
    { label: 'space', action: 'space', flex: 4.2 },
    { label: '.', action: 'char', flex: 1 },
    { label: '⏎', action: 'enter', flex: 1.4 },
  ],
];
