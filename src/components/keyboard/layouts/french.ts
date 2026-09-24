import { KeyboardLayout } from './index';

export const frenchNormalLayout: KeyboardLayout = [
  // Row 1
  [
    { label: 'a', action: 'char' },
    { label: 'z', action: 'char' },
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
    { label: 'q', action: 'char' },
    { label: 's', action: 'char' },
    { label: 'd', action: 'char' },
    { label: 'f', action: 'char' },
    { label: 'g', action: 'char' },
    { label: 'h', action: 'char' },
    { label: 'j', action: 'char' },
    { label: 'k', action: 'char' },
    { label: 'l', action: 'char' },
    { label: 'm', action: 'char' },
  ],
  // Row 3
  [
    { label: '⇧', action: 'shift', flex: 1.25 },
    { label: 'w', action: 'char' },
    { label: 'x', action: 'char' },
    { label: 'c', action: 'char' },
    { label: 'v', action: 'char' },
    { label: 'b', action: 'char' },
    { label: 'n', action: 'char' },
    { label: 'é', action: 'char' },
    { label: 'è', action: 'char' },
    { label: '⌫', action: 'backspace', flex: 1.25 },
  ],
  // Row 4
  [
    { label: '123', action: 'switch', value: 'numbers', flex: 1.3 },
    { label: 'EN', action: 'lang', flex: 1.1 },
    { label: 'à', action: 'char', flex: 0.9 },
    { label: 'espace', action: 'space', flex: 3.5 },
    { label: 'ç', action: 'char', flex: 0.9 },
    { label: '.', action: 'char', flex: 0.9 },
    { label: '⏎', action: 'enter', flex: 1.3 },
  ],
];

export const frenchShiftLayout: KeyboardLayout = [
  // Row 1
  [
    { label: 'A', action: 'char' },
    { label: 'Z', action: 'char' },
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
    { label: 'Q', action: 'char' },
    { label: 'S', action: 'char' },
    { label: 'D', action: 'char' },
    { label: 'F', action: 'char' },
    { label: 'G', action: 'char' },
    { label: 'H', action: 'char' },
    { label: 'J', action: 'char' },
    { label: 'K', action: 'char' },
    { label: 'L', action: 'char' },
    { label: 'M', action: 'char' },
  ],
  // Row 3
  [
    { label: '⇪', action: 'shift', flex: 1.25 },
    { label: 'W', action: 'char' },
    { label: 'X', action: 'char' },
    { label: 'C', action: 'char' },
    { label: 'V', action: 'char' },
    { label: 'B', action: 'char' },
    { label: 'N', action: 'char' },
    { label: 'É', action: 'char' },
    { label: 'È', action: 'char' },
    { label: '⌫', action: 'backspace', flex: 1.25 },
  ],
  // Row 4
  [
    { label: '123', action: 'switch', value: 'numbers', flex: 1.3 },
    { label: 'EN', action: 'lang', flex: 1.1 },
    { label: 'À', action: 'char', flex: 0.9 },
    { label: 'espace', action: 'space', flex: 3.5 },
    { label: 'Ç', action: 'char', flex: 0.9 },
    { label: '.', action: 'char', flex: 0.9 },
    { label: '⏎', action: 'enter', flex: 1.3 },
  ],
];
