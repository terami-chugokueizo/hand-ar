import {mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base = new URL('../public/vendor/', import.meta.url);
const mp = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/';
const entries = [
 ['three.module.js','https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js'],
 ['THREE-LICENSE.txt','https://cdn.jsdelivr.net/npm/three@0.170.0/LICENSE'],
 ['vision_bundle.mjs',mp+'vision_bundle.mjs'],
 ['MEDIAPIPE-LICENSE.txt','https://raw.githubusercontent.com/google-ai-edge/mediapipe/v0.10.21/LICENSE'],
 ...['vision_wasm_internal.js','vision_wasm_internal.wasm','vision_wasm_nosimd_internal.js','vision_wasm_nosimd_internal.wasm'].map(n=>['wasm/'+n,mp+'wasm/'+n]),
 ['hand_landmarker.task','https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'],
];
const manifest=[];
for (const [name,url] of entries) {
 const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
 if(!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
 const data=Buffer.from(await response.arrayBuffer());
 if(data.length<100) throw new Error(`${name}: unexpected empty asset`);
 const path=new URL(name,base); await mkdir(new URL('.',path),{recursive:true}); await writeFile(path,data);
 manifest.push({name,url,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
 console.log(`${name}: ${data.length} bytes`);
}
await writeFile(new URL('manifest.json',base),JSON.stringify(manifest,null,2)+'\n');

