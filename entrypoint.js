// Import required polyfills first - ORDER MATTERS!
import 'react-native-get-random-values';
import '@ethersproject/shims';
import 'fast-text-encoding';

// Configure crypto polyfill properly
import { v4 as uuidv4 } from 'uuid';

// Set up crypto polyfill for React Native
if (typeof global.crypto === 'undefined') {
  global.crypto = {};
}

if (typeof global.crypto.randomUUID === 'undefined') {
  global.crypto.randomUUID = uuidv4;
}

// Ensure getRandomValues is available
if (typeof global.crypto.getRandomValues === 'undefined') {
  const { getRandomValues } = require('react-native-get-random-values');
  global.crypto.getRandomValues = getRandomValues;
}

// Then import the expo router
import 'expo-router/entry';