import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readStaticGLB} from '../public/hashida-loader.js';
const bytes=await readFile(new URL('../public/models/hashida.glb',import.meta.url));
const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
test('supplied GLB has complete geometry and its three embedded texture maps',()=>{
 const {json,geometry,bytes:bufferView}=readStaticGLB(buffer);
 assert.equal(geometry.attributes.position.count,41198);assert.equal(geometry.index.count,214596);
 assert.equal(geometry.attributes.normal.count,41198);assert.equal(geometry.attributes.uv.count,41198);
 assert.equal(json.images.length,3);for(const image of json.images){const data=new Uint8Array(bufferView(image.bufferView));assert.equal(data[0],0xff);assert.equal(data[1],0xd8);}
 assert.ok(geometry.boundingBox.max.y-geometry.boundingBox.min.y>1.8);geometry.dispose();
});
test('truncated GLB fails instead of creating partial geometry',()=>{assert.throws(()=>readStaticGLB(buffer.slice(0,100)),/GLB/);});

