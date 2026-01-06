/**
 * Parse Anno 1800 Building Reference Guide markdown and generate TypeScript data files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read input files
const guideText = fs.readFileSync('# Anno 1800 Building Reference Guid.txt', 'utf-8');
const presetsRaw = fs.readFileSync('presets.json', 'utf-8');
const wikiRaw = fs.readFileSync('wikiBuildingInfo.json', 'utf-8');

// Parse JSONs (strip comments from presets)
const presetsClean = presetsRaw.replace(/\/\*[\s\S]*?\*\//g, '');
const presets = JSON.parse(presetsClean);
const wikiClean = wikiRaw.replace(/^[\uFEFF]/, ''); // Strip BOM
const wiki = JSON.parse(wikiClean);

// Build lookup maps
const presetsByName = new Map();
presets.Buildings.filter(b => b.Header === '(A7) Anno 1800').forEach(b => {
  const name = b.Localization?.eng || '';
  if (name) presetsByName.set(name.toLowerCase(), b);
});

const wikiByName = new Map();
wiki.Infos.forEach(info => {
  const name = info.Name?.split('|')[0].trim() || '';
  if (name) {
    const key = name.toLowerCase();
    if (!wikiByName.has(key)) wikiByName.set(key, []);
    wikiByName.get(key).push(info);
  }
});

// Parse production notation: "1t / 30s" -> {amount: 1, time: 30}
function parseProduction(str) {
  if (!str || str === '-') return null;
  const match = str.match(/(\d+)t\s*\/\s*(\d+)s/);
  if (!match) return null;
  return { amount: parseInt(match[1]), time: parseInt(match[2]) };
}

// Parse workforce: "50 Workers" -> {type: 'Workers', amount: 50}
function parseWorkforce(str) {
  if (!str || str === '-') return null;
  const match = str.match(/(\d+)\s+(\w+)/);
  if (!match) return null;
  return { type: match[2], amount: parseInt(match[1]) };
}

// Parse size: "3x4" -> {x: 3, z: 4}
function parseSize(str) {
  if (!str || str === '-') return null;
  const match = str.match(/(\d+)x(\d+)/);
  if (!match) return null;
  return { x: parseInt(match[1]), z: parseInt(match[2]) };
}

// Parse inputs: "1 Flour, 2 Grain" -> [{product: 'Flour', amount: 1}, ...]
function parseInputs(str) {
  if (!str || str === '-') return [];
  return str.split(',').map(s => {
    const match = s.trim().match(/(\d+)\s+(.+)/);
    if (!match) return null;
    return { product: match[2].trim(), amount: parseInt(match[1]) };
  }).filter(Boolean);
}

// Parse modules: "72x (1x1) Fields" -> {type: 'Fields', count: 72, size: {x:1, z:1}}
function parseModules(str) {
  if (!str || str === '-') return null;
  const match = str.match(/(\d+)x\s*\((\d+)x(\d+)\)\s*(\w+)/);
  if (match) {
    return {
      type: match[4],
      count: parseInt(match[1]),
      size: { x: parseInt(match[2]), z: parseInt(match[3]) }
    };
  }
  // Try pasture format: "3x (3x3) Pastures" or just count
  const pastureMatch = str.match(/(\d+)x\s*\((\d+)x(\d+)\)/);
  if (pastureMatch) {
    return {
      type: 'Pastures',
      count: parseInt(pastureMatch[1]),
      size: { x: parseInt(pastureMatch[2]), z: parseInt(pastureMatch[3]) }
    };
  }
  return null;
}

// Parse service range: "Street: ~48 tiles" or "Radius: 15 tiles"
function parseRange(str) {
  if (!str || str === '-') return null;
  const streetMatch = str.match(/Street:\s*~?(\d+)\s*tiles/);
  if (streetMatch) return { type: 'street', range: parseInt(streetMatch[1]) };
  const radiusMatch = str.match(/Radius:\s*(\d+)(?:-(\d+))?\s*tiles/);
  if (radiusMatch) return { 
    type: 'radius', 
    range: parseInt(radiusMatch[1]),
    maxRange: radiusMatch[2] ? parseInt(radiusMatch[2]) : null
  };
  return null;
}

// Extract tables from markdown by section
function extractTables(text) {
  const sections = [];
  let currentRegion = null;
  let currentTier = null;
  
  const lines = text.split('\n');
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect region headers (e.g., "## 1\. The Old World")
    if (line.match(/^##\s+\d+\\/)) {
      if (tableRows.length > 0) {
        sections.push({ region: currentRegion, tier: currentTier, headers: tableHeaders, rows: tableRows });
        tableHeaders = [];
        tableRows = [];
      }
      currentRegion = line.replace(/^##\s+\d+\\\.\s*/, '').replace(/\(.*?\)/g, '').trim();
      currentTier = null;
      inTable = false;
      continue;
    }
    
    // Detect tier headers (e.g., "### Farmers (Tier 1)")
    if (line.match(/^###\s+/) && !line.includes('Infrastructure') && !line.includes('Legend')) {
      if (tableRows.length > 0) {
        sections.push({ region: currentRegion, tier: currentTier, headers: tableHeaders, rows: tableRows });
        tableHeaders = [];
        tableRows = [];
      }
      currentTier = line.replace(/^###\s*/, '').replace(/\s*\(Tier \d+\)/, '').trim();
      inTable = false;
      continue;
    }
    
    // Detect table start
    if (line.startsWith('|') && line.includes('**Building**')) {
      inTable = true;
      tableHeaders = line.split('|').map(h => h.trim().replace(/\*\*/g, '')).filter(Boolean);
      i++; // Skip separator line
      continue;
    }
    
    // Parse table rows
    if (inTable && line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (cells.length > 0 && !cells[0].includes('---')) {
        tableRows.push(cells);
      }
    } else if (inTable && !line.startsWith('|')) {
      // End of table
      if (tableRows.length > 0) {
        sections.push({ region: currentRegion, tier: currentTier, headers: tableHeaders, rows: tableRows });
      }
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }
  }
  
  // Push last table
  if (tableRows.length > 0) {
    sections.push({ region: currentRegion, tier: currentTier, headers: tableHeaders, rows: tableRows });
  }
  
  return sections;
}

// Convert table sections to structured data
function processBuildings(sections) {
  const buildings = [];
  
  sections.forEach(section => {
    const { region, tier, headers, rows } = section;
    
    rows.forEach(row => {
      const building = { region: region || 'Unknown', tier: tier || 'Unknown' };
      
      headers.forEach((header, idx) => {
        const value = (row[idx] || '').replace(/\*\*/g, '').trim();
        
        switch(header) {
          case 'Building':
            building.name = value;
            break;
          case 'Size':
            building.size = parseSize(value);
            break;
          case 'Type':
            building.type = value;
            break;
          case 'Function / Production':
          case 'Function':
            const prod = parseProduction(value);
            if (prod) {
              building.production = prod;
              // Infer output product from building name
              const nameParts = building.name.split(' ');
              building.outputProduct = nameParts[nameParts.length - 1];
            } else {
              building.function = value;
            }
            break;
          case 'Inputs':
            building.inputs = parseInputs(value);
            break;
          case 'Workforce':
            building.workforce = parseWorkforce(value);
            break;
          case 'Modules':
            building.modules = parseModules(value);
            break;
          case 'Service/Density Range':
            building.range = parseRange(value);
            break;
        }
      });
      
      // Enhance with preset data
      const presetKey = building.name.toLowerCase().replace(/\.$/, '');
      const preset = presetsByName.get(presetKey);
      if (preset) {
        building.identifier = preset.Identifier;
        building.icon = preset.IconFileName;
        building.guid = preset.Guid;
      }
      
      // Enhance with wiki data
      const wikiEntries = wikiByName.get(presetKey) || [];
      const wikiMatch = wikiEntries.find(w => 
        !region || !w.Region || w.Region.toLowerCase().includes(region.toLowerCase().split(' ')[0])
      );
      if (wikiMatch) {
        if (wikiMatch.ProductionInfos) {
          building.productionInfo = wikiMatch.ProductionInfos;
        }
        if (wikiMatch.SupplyInfos) {
          building.supplyInfo = wikiMatch.SupplyInfos;
        }
        if (wikiMatch.Radius && !building.range) {
          building.radiusString = wikiMatch.Radius;
        }
      }
      
      buildings.push(building);
    });
  });
  
  return buildings;
}

// Generate TypeScript files
function generateProductionChains(buildings) {
  const productionBuildings = buildings.filter(b => 
    b.type === 'Production' && b.production
  );
  
  let ts = `// Auto-generated from Anno 1800 Building Reference Guide\n`;
  ts += `// Generated: ${new Date().toISOString()}\n\n`;
  ts += `export interface ProductionChain {\n`;
  ts += `  name: string;\n`;
  ts += `  identifier?: string;\n`;
  ts += `  icon?: string;\n`;
  ts += `  region: string;\n`;
  ts += `  tier: string;\n`;
  ts += `  size: { x: number; z: number };\n`;
  ts += `  cycleTime: number; // seconds\n`;
  ts += `  outputAmount: number; // per cycle\n`;
  ts += `  outputProduct: string;\n`;
  ts += `  inputs: Array<{ product: string; amount: number }>;\n`;
  ts += `  workforce?: { type: string; amount: number };\n`;
  ts += `  modules?: { type: string; count: number; size: { x: number; z: number } };\n`;
  ts += `}\n\n`;
  ts += `export const productionChains: ProductionChain[] = [\n`;
  
  productionBuildings.forEach(b => {
    ts += `  {\n`;
    ts += `    name: ${JSON.stringify(b.name)},\n`;
    if (b.identifier) ts += `    identifier: ${JSON.stringify(b.identifier)},\n`;
    if (b.icon) ts += `    icon: ${JSON.stringify(b.icon)},\n`;
    ts += `    region: ${JSON.stringify(b.region)},\n`;
    ts += `    tier: ${JSON.stringify(b.tier)},\n`;
    ts += `    size: ${JSON.stringify(b.size)},\n`;
    ts += `    cycleTime: ${b.production.time},\n`;
    ts += `    outputAmount: ${b.production.amount},\n`;
    ts += `    outputProduct: ${JSON.stringify(b.outputProduct || 'Unknown')},\n`;
    ts += `    inputs: ${JSON.stringify(b.inputs || [])},\n`;
    if (b.workforce) ts += `    workforce: ${JSON.stringify(b.workforce)},\n`;
    if (b.modules) ts += `    modules: ${JSON.stringify(b.modules)},\n`;
    ts += `  },\n`;
  });
  
  ts += `];\n`;
  return ts;
}

function generateServiceBuildings(buildings) {
  const serviceBuildings = buildings.filter(b => 
    b.type === 'Public Service' || b.type === 'PublicService'
  );
  
  let ts = `// Auto-generated from Anno 1800 Building Reference Guide\n\n`;
  ts += `export interface ServiceBuilding {\n`;
  ts += `  name: string;\n`;
  ts += `  identifier?: string;\n`;
  ts += `  icon?: string;\n`;
  ts += `  region: string;\n`;
  ts += `  tier: string;\n`;
  ts += `  size: { x: number; z: number };\n`;
  ts += `  service: string;\n`;
  ts += `  range?: { type: 'street' | 'radius'; range: number; maxRange?: number };\n`;
  ts += `  supplyInfo?: any;\n`;
  ts += `}\n\n`;
  ts += `export const serviceBuildings: ServiceBuilding[] = [\n`;
  
  serviceBuildings.forEach(b => {
    ts += `  {\n`;
    ts += `    name: ${JSON.stringify(b.name)},\n`;
    if (b.identifier) ts += `    identifier: ${JSON.stringify(b.identifier)},\n`;
    if (b.icon) ts += `    icon: ${JSON.stringify(b.icon)},\n`;
    ts += `    region: ${JSON.stringify(b.region)},\n`;
    ts += `    tier: ${JSON.stringify(b.tier)},\n`;
    ts += `    size: ${JSON.stringify(b.size)},\n`;
    ts += `    service: ${JSON.stringify(b.function || b.name)},\n`;
    if (b.range) ts += `    range: ${JSON.stringify(b.range)},\n`;
    if (b.supplyInfo) ts += `    supplyInfo: ${JSON.stringify(b.supplyInfo)},\n`;
    ts += `  },\n`;
  });
  
  ts += `];\n`;
  return ts;
}

function generateResidenceData(buildings) {
  const residences = buildings.filter(b => b.type === 'Residence');
  
  let ts = `// Auto-generated from Anno 1800 Building Reference Guide\n\n`;
  ts += `export interface ResidenceBuilding {\n`;
  ts += `  name: string;\n`;
  ts += `  identifier?: string;\n`;
  ts += `  icon?: string;\n`;
  ts += `  region: string;\n`;
  ts += `  tier: string;\n`;
  ts += `  size: { x: number; z: number };\n`;
  ts += `}\n\n`;
  ts += `export const residenceBuildings: ResidenceBuilding[] = [\n`;
  
  residences.forEach(b => {
    ts += `  {\n`;
    ts += `    name: ${JSON.stringify(b.name)},\n`;
    if (b.identifier) ts += `    identifier: ${JSON.stringify(b.identifier)},\n`;
    if (b.icon) ts += `    icon: ${JSON.stringify(b.icon)},\n`;
    ts += `    region: ${JSON.stringify(b.region)},\n`;
    ts += `    tier: ${JSON.stringify(b.tier)},\n`;
    ts += `    size: ${JSON.stringify(b.size)},\n`;
    ts += `  },\n`;
  });
  
  ts += `];\n`;
  return ts;
}

// Main execution
console.log('Parsing Anno 1800 Building Reference Guide...');
const sections = extractTables(guideText);
console.log(`Found ${sections.length} table sections`);

const buildings = processBuildings(sections);
console.log(`Processed ${buildings.length} buildings`);

// Generate output files
const prodChains = generateProductionChains(buildings);
fs.writeFileSync('data/generatedProductionChains.ts', prodChains);
console.log('Generated data/generatedProductionChains.ts');

const services = generateServiceBuildings(buildings);
fs.writeFileSync('data/generatedServiceBuildings.ts', services);
console.log('Generated data/generatedServiceBuildings.ts');

const residences = generateResidenceData(buildings);
fs.writeFileSync('data/generatedResidences.ts', residences);
console.log('Generated data/generatedResidences.ts');

// Generate summary JSON for inspection
const summary = {
  totalBuildings: buildings.length,
  byType: {},
  byRegion: {},
  byTier: {}
};

buildings.forEach(b => {
  summary.byType[b.type] = (summary.byType[b.type] || 0) + 1;
  summary.byRegion[b.region] = (summary.byRegion[b.region] || 0) + 1;
  summary.byTier[b.tier] = (summary.byTier[b.tier] || 0) + 1;
});

fs.writeFileSync('data/generatedSummary.json', JSON.stringify({ summary, buildings }, null, 2));
console.log('Generated data/generatedSummary.json');

console.log('\nSummary:');
console.log('By Type:', summary.byType);
console.log('By Region:', summary.byRegion);
console.log('By Tier:', summary.byTier);
