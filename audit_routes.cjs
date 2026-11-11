const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) res = res.concat(walk(p));
    else if (f.endsWith('.controller.ts')) res.push(p);
  }
  return res;
}

const files = walk('backend/src/modules');
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  const baseMatch = c.match(/@Controller\(['"]?(.*?)['"]?\)/);
  const base = baseMatch ? baseMatch[1] : '';
  console.log(`\n=== ${path.basename(f)} (Base: /api/v1/${base}) ===`);
  const lines = c.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/@(Get|Post|Put|Delete|Patch)\((?:['"](.*?)['"])?\)/);
    if (m) {
      const verb = m[1].toUpperCase();
      const sub = m[2] || '';
      // Find method name
      let method = '';
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const fnMatch = lines[j].match(/(?:async\s+)?(\w+)\s*\(/);
        if (fnMatch) {
          method = fnMatch[1];
          break;
        }
      }
      console.log(`  ${verb.padEnd(6)} /${sub.padEnd(35)} -> ${method}`);
    }
  }
}

