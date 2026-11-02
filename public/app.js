import {palmPose} from './geometry.js';
clearTimeout(window.__bootWatch);
const $=id=>document.getElementById(id);
const status=$('status'),video=$('video'),view=$('viewer'),overlay=$('overlay'),debug=$('debug'),ctx=debug.getContext('2d');
let THREE,renderer,scene,camera,pal,detector,stream,frame=0,run=0,busy=false,mode='idle',lastVideo=-1,lastFrameAt=0,lastDetect=0,seen=false;
let smooth={x:0,y:0,size:1,angle:0},lastTimestamp=0;
function log(text){$('log').textContent+=`${new Date().toLocaleTimeString()} ${text}\n`;}
function message(text,error=false){status.textContent=text;status.classList.toggle('error',error);log(text);}
function deadline(promise,label,ms=20000,lateCleanup=()=>{}){
 let expired=false,timer;
 const observed=Promise.resolve(promise).then(value=>{if(expired)lateCleanup(value);return value;});
 return Promise.race([observed,new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(new Error(`${label}：${ms/1000}秒でタイムアウト。通信・ファイル配置を確認し、ページを再読み込みしてください。`));},ms);})]).finally(()=>clearTimeout(timer));
}
function setControls(){ $('start').disabled=busy||mode==='camera';$('preview').disabled=busy||mode==='camera';$('blanktest').disabled=busy||mode==='camera';$('stop').disabled=!busy&&mode==='idle';$('facing').disabled=busy||mode==='camera'; }
function stop(silent=false){
 run++;busy=false;mode='idle';cancelAnimationFrame(frame);stream?.getTracks().forEach(t=>t.stop());stream=null;video.pause();video.srcObject=null;
 if(pal)pal.visible=false;if(renderer)renderer.clear();ctx.clearRect(0,0,debug.width,debug.height);$('guide').hidden=false;$('fps').textContent='—';seen=false;setControls();if(!silent)message('停止しました。もう一度開始できます。');
}
function fail(error){stop(true);const hints={NotAllowedError:'カメラが許可されていません。ブラウザーと端末のカメラ権限を許可してください。',NotFoundError:'カメラが見つかりません。',NotReadableError:'カメラを開けません。他のアプリで使用していないか確認してください。',OverconstrainedError:'このカメラ設定は端末に対応していません。別のカメラを選んでください。'};message(hints[error.name]||error.message||String(error),true);}
let threeInit, detectorInit;
function prepare3D(){return threeInit ||= create3D().finally(()=>{threeInit=null;});}
function prepareDetector(){return detectorInit ||= createDetector().finally(()=>{detectorInit=null;});}
async function create3D(){
 if(renderer&&pal)return;
 message('1/4 · Three.jsを読み込んでいます…');
 THREE=await deadline(import('./vendor/three.module.js'),'Three.jsの読み込み');
 if(!renderer){renderer=new THREE.WebGLRenderer({canvas:overlay,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.setClearColor(0,0);scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-1,1,1,-1,0.1,3000);camera.position.z=1000;
 scene.add(new THREE.HemisphereLight(0xffffff,0x315943,2.5));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-100,250,500);scene.add(light);
 resize();overlay.addEventListener('webglcontextlost',event=>{event.preventDefault();fail(new Error('3D描画が中断されました。ページを再読み込みしてください。'));});
 }
 message('1/4 · hashida.glbを読み込んでいます…');
 const {loadHashida,disposeModel}=await deadline(import('./hashida-loader.js'),'GLB読み込み機能');
 const controller=new AbortController();
 try{pal=await deadline(loadHashida('./models/hashida.glb',controller.signal),'キャラクターの読み込み',30000,disposeModel);}catch(e){controller.abort();throw e;}
 pal.visible=false;scene.add(pal);resize();
 log('hashida.glb 読み込み完了 · '+pal.userData.modelInfo.vertices+'頂点 / '+pal.userData.modelInfo.triangles+'三角形 / テクスチャ'+pal.userData.modelInfo.textures+'枚');
}
async function createDetector(){
 if(detector)return;
 message('2/4 · 手の認識ライブラリ・WASMを読み込んでいます…');
 const {FilesetResolver,HandLandmarker}=await deadline(import('./vendor/vision_bundle.mjs'),'認識ライブラリ');
 const files=await deadline(FilesetResolver.forVisionTasks('./vendor/wasm'),'WASMの設定');
 message('3/4 · 手の認識モデルを初期化しています…');
 detector=await deadline(HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'./vendor/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:0.5,minHandPresenceConfidence:0.5,minTrackingConfidence:0.5}),'認識モデルの初期化',45000,d=>d.close());
}
function resize(){const w=view.clientWidth,h=view.clientHeight;debug.width=w;debug.height=h;if(!renderer)return;renderer.setSize(w,h,false);camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(view);
function timestamp(){return lastTimestamp=Math.max(performance.now(),lastTimestamp+0.01);}
function drawPoints(pts){ctx.clearRect(0,0,debug.width,debug.height);if(!$('points').checked)return;ctx.fillStyle='#d0ff8e';for(const p of pts){ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();}}
function place(landmarks){
 const w=view.clientWidth,h=view.clientHeight;
 const p=palmPose(landmarks,video.videoWidth,video.videoHeight,w,h,$('mirror').checked);drawPoints(p.pts);
 const target={x:p.center.x-w/2,y:h/2-p.center.y,size:Math.max(8,p.width*0.65),angle:p.angle};
 if(!seen)smooth={...target};else {const a=0.4;for(const key of ['x','y','size'])smooth[key]+=(target[key]-smooth[key])*a;smooth.angle+=Math.atan2(Math.sin(target.angle-smooth.angle),Math.cos(target.angle-smooth.angle))*a;}
 seen=true;pal.visible=true;pal.position.set(smooth.x,smooth.y,0);pal.scale.setScalar(smooth.size);pal.rotation.set(0,-0.12,-smooth.angle);$('guide').hidden=true;
}
function tick(now){
 if(mode==='idle')return;
 try {
 if(mode==='preview'){pal.visible=true;pal.position.set(0,-view.clientHeight*0.28,0);pal.scale.setScalar(Math.min(view.clientWidth*0.18,95));pal.rotation.set(0,Math.sin(now/1800)*0.35,0);}
 else {
 if(now-lastFrameAt>10000)throw new Error('カメラの映像が10秒間更新されません。停止して再試行してください。');
 if(video.readyState>=2&&video.currentTime!==lastVideo){lastVideo=video.currentTime;lastFrameAt=now;
 if(now-lastDetect>=66){const began=performance.now();const result=detector.detectForVideo(video,timestamp());lastDetect=now;
 if(result.landmarks.length){place(result.landmarks[0]);status.textContent='追従中 · 手をゆっくり動かしてください';}else{seen=false;pal.visible=false;ctx.clearRect(0,0,debug.width,debug.height);$('guide').hidden=false;status.textContent='手を探しています · 手の全体を映してください';}
 $('fps').textContent=`推論 ${Math.round(performance.now()-began)} ms`;}}
 }
 renderer.render(scene,camera);frame=requestAnimationFrame(tick);
 }catch(error){fail(error);}
}
async function start(){
 stop(true);busy=true;const token=run;setControls();
 try{
 if(!isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error('カメラにはHTTPSが必要です。公開URLをSafari / Chromeで直接開いてください。');
 await prepare3D();if(token!==run)return;await prepareDetector();if(token!==run)return;
 message('4/4 · カメラの許可を待っています（30秒以内）…');
 const s=await deadline(navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:$('facing').value},width:{ideal:640},height:{ideal:480}}}),'カメラの許可',30000,s=>s.getTracks().forEach(t=>t.stop()));
 if(token!==run){s.getTracks().forEach(t=>t.stop());return;}stream=s;video.srcObject=s;
 await deadline(video.play(),'カメラの再生',15000);if(token!==run)return;
 for(const track of s.getVideoTracks())track.addEventListener('ended',()=>{if(mode==='camera')fail(new Error('カメラが切断されました。再試行してください。'));});
 busy=false;mode='camera';seen=false;lastVideo=-1;lastDetect=0;lastFrameAt=performance.now();setControls();message('認識を開始しました · 手を映してください');frame=requestAnimationFrame(tick);
 }catch(error){if(token===run)fail(error);}
}
$('start').onclick=start;$('stop').onclick=()=>stop();$('reload').onclick=()=>location.reload();
$('mirror').onchange=()=>{video.classList.toggle('mirrored',$('mirror').checked);seen=false;};
$('facing').onchange=()=>{$('mirror').checked=$('facing').value==='user';video.classList.toggle('mirrored',$('mirror').checked);};
$('preview').onclick=async()=>{stop(true);busy=true;const token=run;setControls();try{await prepare3D();if(token!==run)return;busy=false;mode='preview';setControls();message('3D表示の確認中 · これは手の認識テストではありません');$('guide').hidden=true;frame=requestAnimationFrame(tick);}catch(e){if(token===run)fail(e);}};
$('blanktest').onclick=async()=>{stop(true);busy=true;const token=run;setControls();try{await prepare3D();if(token!==run)return;await prepareDetector();if(token!==run)return;const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const c=canvas.getContext('2d');c.fillStyle='#888';c.fillRect(0,0,640,480);const t=performance.now();const result=detector.detectForVideo(canvas,timestamp());busy=false;setControls();message(`認識エンジン検査OK · 空画像の検出数 ${result.landmarks.length} / 推論 ${Math.round(performance.now()-t)} ms。実際の手の追従はカメラで確認してください。`);}catch(e){if(token===run)fail(e);}};
window.addEventListener('pagehide',()=>stop(true));document.addEventListener('visibilitychange',()=>{if(document.hidden&&(busy||mode!=='idle'))stop();});
window.addEventListener('error',event=>fail(new Error(`実行エラー：${event.message}`)));window.addEventListener('unhandledrejection',event=>fail(event.reason||new Error('非同期処理に失敗しました')));
log('起動完了 · v2 hashida / Three.js 0.170.0 / MediaPipe 0.10.21');
setControls();

