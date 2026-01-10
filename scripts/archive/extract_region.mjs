import fs from 'fs';
const content = fs.readFileSync('./Helpful_info/Anno1800Calculator-master/js/params.js','utf8');
// crude split by "tpmin"
const blocks = content.split('"tpmin"').map((b,i)=>({i,txt:b}));
const targetRegion = process.argv[2] || '160001';
const results=[];
for(const {txt} of blocks){
  // look back for name and region
  const nameMatch = txt.match(/"name"\s*:\s*"([^"]+)"/);
  const regionMatch = txt.match(/"region"\s*:\s*(\d+)/);
  const tpMatch = txt.match(/:\s*([\d\.]+)\s*[,\n\r]/);
  if(tpMatch && nameMatch && regionMatch && regionMatch[1]===targetRegion){
    results.push({name:nameMatch[1], tpmin:parseFloat(tpMatch[1])});
  }
}
console.log(results);
