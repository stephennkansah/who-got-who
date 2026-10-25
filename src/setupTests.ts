// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// React Router 7 uses these browser APIs; CRA's older jsdom does not provide them.
Object.assign(globalThis, { TextEncoder, TextDecoder });
