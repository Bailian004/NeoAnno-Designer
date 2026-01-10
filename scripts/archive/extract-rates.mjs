import fs from 'fs';

// Read params.js
const paramsContent = fs.readFileSync('./Helpful_info/Anno1800Calculator-master/js/params.js', 'utf8');

// Extract lines with "name" and "tpmin" 
const lines = paramsContent.split('\n');
const rates = {};
let currentName = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Match name: "Something"
    const nameMatch = line.match(/"name":\s*"([^"]+)"/);
    if (nameMatch) {
        currentName = nameMatch[1];
    }
    
    // Match tpmin: number
    const tpminMatch = line.match(/"tpmin":\s*([\d.]+)/);
    if (tpminMatch && currentName) {
        const tpmin = parseFloat(tpminMatch[1]);
        // Only save if it's a production building (has tpmin)
        rates[currentName] = tpmin;
        currentName = null; // Reset after finding tpmin
    }
}

// Output as JSON
console.log(JSON.stringify(rates, null, 2));
