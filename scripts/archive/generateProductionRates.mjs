import fs from 'fs';
const content = fs.readFileSync('./Helpful_info/Anno1800Calculator-master/js/params.js','utf8');
const regex = /"name"\s*:\s*"([^"]+)"[\s\S]*?"tpmin"\s*:\s*([\d\.eE+-]+)/g;
const map = {};
let m; let count=0;
while((m = regex.exec(content))!==null){
  const name = m[1];
  const tpmin = parseFloat(m[2]);
  if(!isNaN(tpmin)){
    map[name] = tpmin;
    count++;
  }
}
console.log('captured', count, 'entries');
const outPath = './data/productionRates.ts';
const lines = ['// Auto-generated from params.js','export const PRODUCTION_RATES: Record<string, number> = {'];
Object.entries(map).forEach(([name,rate])=>{
  lines.push(`  ${JSON.stringify(name)}: ${rate},`);
});
lines.push('};\n');
fs.writeFileSync(outPath, lines.join('\n'));
console.log('written', outPath);
