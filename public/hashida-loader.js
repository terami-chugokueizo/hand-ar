// A deliberately bounded loader for the supplied uncompressed, static GLB.
// Unsupported glTF features fail visibly rather than rendering an incomplete model.
import * as THREE from './vendor/three.module.js';
export function readStaticGLB(buffer){
 const v=new DataView(buffer);
 if(v.byteLength<20||v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==v.byteLength)throw new Error('GLB 2.0ファイルが不正です。');
 let json,bin;
 for(let offset=12;offset+8<=v.byteLength;){const length=v.getUint32(offset,true),type=v.getUint32(offset+4,true);offset+=8;if(offset+length>v.byteLength)throw new Error('GLBのデータが途中で切れています。');if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,offset,length)));if(type===0x004e4942)bin=buffer.slice(offset,offset+length);offset+=length;}
 if(!json||!bin||json.asset?.version!=='2.0')throw new Error('GLBのJSONまたはバイナリがありません。');
 if(json.extensionsUsed?.length||json.animations?.length||json.skins?.length||json.buffers?.length!==1||json.buffers[0].uri)throw new Error('このデモは内蔵テクスチャ付き・非圧縮・静止GLBに対応しています。');
 if(json.meshes?.length!==1||json.nodes?.length!==1||json.nodes[0].mesh!==0||json.nodes[0].children?.length||json.meshes[0].primitives.length!==1)throw new Error('このGLBはhashidaモデル用の構成と異なります。');
 const primitive=json.meshes[0].primitives[0];
 if((primitive.mode??4)!==4||primitive.targets||primitive.extensions||Object.keys(primitive.attributes).some(k=>!['POSITION','NORMAL','TEXCOORD_0'].includes(k)))throw new Error('未対応のGLBメッシュ形式です。');
 function bytes(index){const b=json.bufferViews?.[index];if(!b||b.buffer!==0||b.byteStride||b.extensions)throw new Error('未対応のGLBバッファ形式です。');const start=b.byteOffset??0;if(start+b.byteLength>bin.byteLength)throw new Error('GLBバッファが範囲外です。');return bin.slice(start,start+b.byteLength);}
 function attribute(index,type){const a=json.accessors?.[index];if(!a||a.sparse||a.normalized||a.type!==type)throw new Error('未対応のGLB属性形式です。');const C={5126:Float32Array,5125:Uint32Array,5123:Uint16Array}[a.componentType],n={SCALAR:1,VEC2:2,VEC3:3}[type];if(!C||(type!=='SCALAR'&&C!==Float32Array))throw new Error('未対応のGLB数値型です。');const data=bytes(a.bufferView),offset=a.byteOffset??0;if(offset+a.count*n*C.BYTES_PER_ELEMENT>data.byteLength)throw new Error('GLB属性が範囲外です。');return new THREE.BufferAttribute(new C(data,offset,a.count*n),n);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',attribute(primitive.attributes.POSITION,'VEC3'));
 if(primitive.attributes.NORMAL!==undefined)geometry.setAttribute('normal',attribute(primitive.attributes.NORMAL,'VEC3'));else geometry.computeVertexNormals();
 if(primitive.attributes.TEXCOORD_0!==undefined)geometry.setAttribute('uv',attribute(primitive.attributes.TEXCOORD_0,'VEC2'));
 if(primitive.indices!==undefined)geometry.setIndex(attribute(primitive.indices,'SCALAR'));
 geometry.computeBoundingBox();
 return {json,geometry,bytes,primitive};
}
export function disposeModel(root){root?.traverse(obj=>{obj.geometry?.dispose();for(const material of obj.material?(Array.isArray(obj.material)?obj.material:[obj.material]):[]){for(const value of Object.values(material))if(value?.isTexture)value.dispose();material.dispose();}});}
export async function loadHashida(url,signal){
 const r=await fetch(url,{signal});if(!r.ok)throw new Error(`キャラクターを読み込めません：${url} (HTTP ${r.status})`);
 const {json,geometry,bytes,primitive}=readStaticGLB(await r.arrayBuffer());
 const textures=[];
 try{
 const textureCache=new Map();
 async function texture(info,color=false){
 if(!info)return null;if((info.texCoord??0)!==0||info.extensions)throw new Error('未対応のGLBテクスチャ座標です。');
 const key=info.index+':'+color;if(textureCache.has(key))return textureCache.get(key);
 const t=json.textures?.[info.index],image=json.images?.[t?.source];if(!image||image.uri||image.bufferView===undefined)throw new Error('GLBに内蔵された画像が必要です。');
 const blob=new Blob([bytes(image.bufferView)],{type:image.mimeType});const objectURL=URL.createObjectURL(blob);let tex;
 try{tex=await new THREE.TextureLoader().loadAsync(objectURL);}finally{URL.revokeObjectURL(objectURL);}
 textures.push(tex);tex.flipY=false;tex.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;
 const sampler=json.samplers?.[t.sampler]??{};
 const wraps={10497:THREE.RepeatWrapping,33071:THREE.ClampToEdgeWrapping,33648:THREE.MirroredRepeatWrapping};
 const filters={9728:THREE.NearestFilter,9729:THREE.LinearFilter,9984:THREE.NearestMipmapNearestFilter,9985:THREE.LinearMipmapNearestFilter,9986:THREE.NearestMipmapLinearFilter,9987:THREE.LinearMipmapLinearFilter};
 tex.wrapS=wraps[sampler.wrapS??10497];tex.wrapT=wraps[sampler.wrapT??10497];tex.magFilter=filters[sampler.magFilter??9729];tex.minFilter=filters[sampler.minFilter??9987];tex.needsUpdate=true;textureCache.set(key,tex);return tex;
 }
 const m=json.materials?.[primitive.material]??{},p=m.pbrMetallicRoughness??{},factor=p.baseColorFactor??[1,1,1,1];
 if(m.extensions||m.occlusionTexture||m.emissiveTexture)throw new Error('このモデル用ローダーでは未対応の材質です。');
 const map=await texture(p.baseColorTexture,true),mr=await texture(p.metallicRoughnessTexture),normal=await texture(m.normalTexture);
 if(signal?.aborted)throw new Error('キャラクターの読み込みを中断しました。');
 const material=new THREE.MeshStandardMaterial({color:new THREE.Color().setRGB(...factor.slice(0,3)),opacity:factor[3],map,metalness:p.metallicFactor??1,roughness:p.roughnessFactor??1,metalnessMap:mr,roughnessMap:mr,normalMap:normal,normalScale:new THREE.Vector2(m.normalTexture?.scale??1,m.normalTexture?.scale??1),side:m.doubleSided?THREE.DoubleSide:THREE.FrontSide,transparent:m.alphaMode==='BLEND',alphaTest:m.alphaMode==='MASK'?(m.alphaCutoff??0.5):0});
 const mesh=new THREE.Mesh(geometry,material),node=json.nodes[0];
 if(node.matrix)mesh.applyMatrix4(new THREE.Matrix4().fromArray(node.matrix));else{if(node.translation)mesh.position.fromArray(node.translation);if(node.rotation)mesh.quaternion.fromArray(node.rotation);if(node.scale)mesh.scale.fromArray(node.scale);}
 const content=new THREE.Group();content.add(mesh);content.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(content),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 if(!Number.isFinite(size.y)||size.y<=0)throw new Error('キャラクターの高さが不正です。');
 // A separate parent preserves authored transforms while placing feet at y=0.
 const normalized=new THREE.Group();normalized.add(content);content.position.set(-center.x,-bounds.min.y,-center.z);normalized.scale.setScalar(2/size.y);
 normalized.name='hashida';normalized.userData.modelInfo={vertices:geometry.attributes.position.count,triangles:geometry.index?geometry.index.count/3:geometry.attributes.position.count/3,textures:textures.length,height:size.y};
 return normalized;
 }catch(error){geometry.dispose();textures.forEach(t=>t.dispose());throw error;}
}
