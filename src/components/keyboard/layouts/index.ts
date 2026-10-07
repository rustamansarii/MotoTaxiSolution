export type KeyboardKeyAction =
  | 'char'
  | 'space'
  | 'backspace'
  | 'shift'
  | 'switch'
  | 'lang'
  | 'page'
  | 'enter'
  | 'hide'
  | 'cursor_left'
  | 'cursor_right';

export interface KeyboardKeyConfig {
  label: string;
  value?: string;
  action: KeyboardKeyAction;
  flex?: number;
}

export type KeyboardLayout = KeyboardKeyConfig[][];

export { englishNormalLayout, englishShiftLayout } from './english';
export { frenchNormalLayout, frenchShiftLayout } from './french';
export { numbersGeneralLayout, numericOnlyLayout } from './numbers';
export { symbolsPage1Layout, symbolsPage2Layout } from './symbols';
