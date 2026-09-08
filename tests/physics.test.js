import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,calculateFlow,sectionAt,makeQuestion,correctAnswer,validInput} from '../physics.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-10,`${a} != ${b}`);
test('narrowing the diameter by half increases velocity fourfold',()=>{
  const flow=calculateFlow(DEFAULTS);
  close(flow.V2,6);close(flow.Q1,Math.PI*.3**2/4*1.5);close(flow.Q1,flow.Q2);
  close(flow.massIn,flow.massOut);assert.equal(flow.accumulation,0);
});
test('unequal densities conserve mass but not volume flow',()=>{
  const flow=calculateFlow({...DEFAULTS,rho2:500});
  close(flow.V2,12);close(flow.Q2,2*flow.Q1);close(flow.massOut,flow.massIn);
  close(flow.inletFlux+flow.outletFlux+flow.wallFlux,0);assert.equal(flow.inletFlux<0,true);
});
test('wall has no normal flux and zero flow remains stationary',()=>{
  const state={...DEFAULTS,V1:0},flow=calculateFlow(state);
  for(const key of ['V2','Q1','Q2','massIn','massOut','accumulation','wallFlux'])assert.equal(flow[key],0);
  close(sectionAt(state,.5).velocity,0);
});
test('local velocity uses the same area and density as the displayed pipe',()=>{
  for(const state of [DEFAULTS,{...DEFAULTS,D1:.1,D2:.8,rho1:500,rho2:1100}]){
    const mass=calculateFlow(state).massIn;
    for(const pos of [0,.1,.2,.35,.5,.7,.8,.9,1]){
      const local=sectionAt(state,pos);
      close(local.density*local.velocity*Math.PI*local.diameter**2/4,mass);
    }
    close(sectionAt(state,.1).diameter,state.D1);close(sectionAt(state,.9).diameter,state.D2);
  }
});
test('invalid edits never enter the physics model',()=>{
  for(const value of ['',NaN,Infinity,'abc',-.1])assert.equal(validInput('V1',value),false);
  assert.equal(validInput('V1',0),true);
  assert.equal(validInput('D1',0),false);
  assert.throws(()=>calculateFlow({...DEFAULTS,D2:0}),RangeError);
});
test('quiz solutions use exactly the shown rounded givens',()=>{
  for(const r of [0,.012345,.5,.987654,1]){
    const q=makeQuestion(()=>r);
    for(const k of ['D1','D2','V1'])assert.equal(q.state[k],Number(q.state[k].toFixed(3)));
    close(q.answer,calculateFlow(q.state).V2);
    assert.equal(correctAnswer(q.answer,q.answer),true);
    assert.equal(correctAnswer(q.answer+Math.max(.01,q.answer*.01)*1.01,q.answer),false);
  }
  assert.equal(correctAnswer('',0),false);assert.equal(correctAnswer('no',1),false);
});
