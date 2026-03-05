import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for jsdom environment (jsdom does not expose them as globals)
import { TextDecoder, TextEncoder } from 'util';
Object.assign(global, { TextDecoder, TextEncoder });
