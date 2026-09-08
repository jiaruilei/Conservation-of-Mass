import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS} from '../physics.js';
import {ParticleField} from '../particles.js';
const near=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
const transitAt=(field,t)=>{
  const i=Math.min(field.samples-1,Math.floor(t*field.samples));
  return field.time[i]+(field.time[i+1]-field.time[i])*(t*field.samples-i);
};

test('particle endpoint speeds follow diameter squared and density ratios',()=>{
  for(const [changes,ratio] of [[{},4],[{D1:.15,D2:.3},.25],[{rho2:500},8],[{D2:.3,rho2:500},2]]){
    const f=new ParticleField({...DEFAULTS,...changes});
    const step=.001*Math.min(f.time[1]*f.samples,(f.time[f.samples]-f.time[f.samples-1])*f.samples);
    const d1=f.position((transitAt(f,.1)+step)/f.totalTime)-.1;
    const d2=f.position((transitAt(f,.9)+step)/f.totalTime)-.9;
    near(d2/d1,ratio);
  }
});

test('steady dot coverage does not clump after repeated transits',()=>{
  for(const changes of [{},{D1:.15,D2:.3},{rho2:500},{D1:1,D2:.05},{D1:.05,D2:1,rho1:1200,rho2:.5}]){
    const field=new ParticleField({...DEFAULTS,...changes},800);
    for(const cycles of [0,.13,.37,.61,.99,20]){
      field.offset=cycles%1;field.place();
      for(let i=0;i<5;i++){
        const a=i/5,b=(i+1)/5;
        const expected=800*(transitAt(field,b)-transitAt(field,a))/field.totalTime;
        const actual=field.particles.filter(p=>p.t>=a&&p.t<b).length;
        assert.ok(Math.abs(actual-expected)<=1.001,`${actual} vs ${expected} in bin ${i}`);
      }
    }
    field.offset=0;field.place();const original=field.particles.map(p=>p.t);
    field.advance(20/field.phaseSpeed);
    field.particles.forEach((p,i)=>near(p.t,original[i]));
  }
});

test('zero flow freezes particles and velocity edits preserve their positions',()=>{
  const field=new ParticleField(DEFAULTS,360);field.advance(2);
  const before=field.particles.map(p=>p.t),oldRate=field.phaseSpeed;
  field.configure({...DEFAULTS,V1:0});field.advance(300);
  assert.deepEqual(field.particles.map(p=>p.t),before);
  field.configure({...DEFAULTS,V1:.75});
  assert.deepEqual(field.particles.map(p=>p.t),before);near(field.phaseSpeed,oldRate/2);
  field.advance(.1);assert.notDeepEqual(field.particles.map(p=>p.t),before);
});

test('staggered lanes fill the pipe without five repeated rows',()=>{
  const field=new ParticleField(DEFAULTS,720);
  assert.equal(new Set(field.particles.map(p=>p.lane)).size,720);
  for(const p of field.particles)assert.ok(p.lane>=-1&&p.lane<=1&&p.t>=0&&p.t<1);
  for(let i=0;i<10;i++){
    const count=field.particles.filter(p=>p.lane>=-1+i*.2&&p.lane< -1+(i+1)*.2).length;
    assert.ok(Math.abs(count-72)<=2);
  }
});
