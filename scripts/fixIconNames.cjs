const fs = require('fs');
const path = require('path');

const annoDataPath = path.join(__dirname, '..', 'data', 'annoData.ts');
let content = fs.readFileSync(annoDataPath, 'utf8');

const fixes = [
  {
    "wrong": "A7_pub.png",
    "correct": "A7_Pub.png"
  },
  {
    "wrong": "A7_school.png",
    "correct": "A7_School.png"
  },
  {
    "wrong": "A7_church.png",
    "correct": "A7_Church.png"
  },
  {
    "wrong": "A7_hospital.png",
    "correct": "A7_Hospital.png"
  },
  {
    "wrong": "A7_university.png",
    "correct": "A7_University.png"
  },
  {
    "wrong": "A7_bank.png",
    "correct": "A7_Bank.png"
  },
  {
    "wrong": "A7_potatoes.png",
    "correct": "A7_Potatoes.png"
  },
  {
    "wrong": "A7_wool.png",
    "correct": "A7_Wool.png"
  },
  {
    "wrong": "A7_bricks.png",
    "correct": "A7_Bricks.png"
  },
  {
    "wrong": "A7_steel.png",
    "correct": "A7_Steel.png"
  },
  {
    "wrong": "A7_bread.png",
    "correct": "A7_Bread.png"
  },
  {
    "wrong": "A7_pigs.png",
    "correct": "A7_Pigs.png"
  },
  {
    "wrong": "A7_warehouse.png",
    "correct": "A7_Warehouse.png"
  }
];

console.log('Applying icon name fixes...');
let changeCount = 0;

fixes.forEach(({ wrong, correct }) => {
  const searchStr = 'IconFileName:"' + wrong + '"';
  const replaceStr = 'IconFileName:"' + correct + '"';
  const beforeLength = content.length;
  content = content.split(searchStr).join(replaceStr);
  const afterLength = content.length;
  if (beforeLength !== afterLength) {
    const occurrences = (beforeLength - afterLength) / (searchStr.length - replaceStr.length);
    console.log('  ✓ Fixed: ' + wrong + ' → ' + correct + ' (' + occurrences + ' occurrence' + (occurrences > 1 ? 's' : '') + ')');
    changeCount += occurrences;
  }
});

fs.writeFileSync(annoDataPath, content, 'utf8');
console.log('\nSuccessfully applied ' + changeCount + ' fixes to annoData.ts');
