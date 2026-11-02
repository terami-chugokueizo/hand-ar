import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapPoint,palmPose} from '../public/geometry.js';
test('portrait screen letterboxes landscape video without anchor drift',()=>{
 assert.deepEqual(mapPoint({x:0,y:0},640,480,400,800),{x:0,y:250});
 assert.deepEqual(mapPoint({x:1,y:1},640,480,400,800),{x:400,y:550});
 assert.deepEqual(mapPoint({x:0.2,y:0.5},640,480,400,800,true),{x:320,y:400});
});
test('palm follows translation and scale; mirror changes position and tilt together',()=>{
 const hand=Array.from({length:21},()=>({x:0.5,y:0.5}));
 hand[0]={x:0.45,y:0.8};hand[9]={x:0.55,y:0.2};hand[5]={x:0.3,y:0.4};hand[17]={x:0.7,y:0.4};
 const p=palmPose(hand,400,800,400,800), m=palmPose(hand,400,800,400,800,true);
 assert.equal(p.width,160);assert.equal(m.width,p.width);assert.ok(Math.abs(p.angle+m.angle)<1e-10);
 const moved=palmPose(hand.map(p=>({x:p.x+0.1,y:p.y+0.1})),400,800,400,800);
 assert.ok(Math.abs(moved.center.x-p.center.x-40)<1e-8);assert.ok(Math.abs(moved.center.y-p.center.y-80)<1e-8);
});
