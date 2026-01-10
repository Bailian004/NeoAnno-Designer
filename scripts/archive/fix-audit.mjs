#!/usr/bin/env node

import fs from 'fs';

const content = fs.readFileSync('/workspaces/NeoAnno-Designer/data/generatedProductionChains.ts', 'utf-8');

// Test workforce extraction with actual content
const sample = content.substring(100, 1000);
console.log('Sample content:');
console.log(sample);
console.log('\n--- Testing regex ---\n');

// Test the regex
const wfMatch = sample.match(/workforce:\s*\{([^}]*)\}/);
console.log('Workforce match:', wfMatch);

// Try with improved regex
const wfMatch2 = content.match(/workforce:\s*\{\s*type:\s*"([^"]*)"\s*,\s*amount:\s*(\d+)/);
console.log('Workforce match 2:', wfMatch2);

// Count all workforce occurrences
const allWf = content.match(/workforce:/g);
console.log(`Total workforce occurrences: ${allWf ? allWf.length : 0}`);
