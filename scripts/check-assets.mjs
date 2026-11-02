import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../public/vendor/',import.meta.url);
const entries=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
for(const entry of entries){const data=await readFile(new URL(entry.name,root));if(data.length!==entry.bytes||createHash('sha256').update(data).digest('hex')!==entry.sha256)throw new Error(`Asset mismatch: ${entry.name}`);}
console.log(`Asset integrity OK: ${entries.length} files`);
