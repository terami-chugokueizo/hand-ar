// Use the same object-fit: contain mapping for the video and all landmarks.
export function mapPoint(p,vw,vh,w,h,mirror=false) {
 const s=Math.min(w/vw,h/vh),dw=vw*s,dh=vh*s;
 return {x:(w-dw)/2+(mirror?1-p.x:p.x)*dw,y:(h-dh)/2+p.y*dh};
}
export function palmPose(landmarks,vw,vh,w,h,mirror=false) {
 const pts=landmarks.map(p=>mapPoint(p,vw,vh,w,h,mirror));
 const ids=[0,5,9,13,17];
 const center=ids.reduce((a,i)=>({x:a.x+pts[i].x/5,y:a.y+pts[i].y/5}),{x:0,y:0});
 const wrist=pts[0],middle=pts[9];
 return {center,width:Math.hypot(pts[5].x-pts[17].x,pts[5].y-pts[17].y),angle:Math.atan2(middle.x-wrist.x,wrist.y-middle.y),pts};
}
