export const DEFAULTS = Object.freeze({D1:0.30,D2:0.15,V1:1.5,rho1:1000,rho2:1000});
export const LIMITS = Object.freeze({D1:[0.05,1],D2:[0.05,1],V1:[0,6],rho1:[0.5,1200],rho2:[0.5,1200]});
export const area = diameter => Math.PI * diameter ** 2 / 4;

export function validInput(key, raw) {
  const value=Number(raw), limits=LIMITS[key];
  return Boolean(limits && String(raw).trim()!=='' && Number.isFinite(value) && value>=limits[0] && value<=limits[1]);
}

export function calculateFlow(state) {
  for (const key of Object.keys(LIMITS)) {
    if (!validInput(key,state[key])) throw new RangeError(`Invalid ${key}`);
  }
  const A1=area(state.D1), A2=area(state.D2);
  const Q1=state.V1*A1, massIn=state.rho1*Q1;
  const V2=massIn/(state.rho2*A2), Q2=V2*A2, massOut=state.rho2*Q2;
  const accumulation=Math.abs(massIn-massOut)<Math.max(1,massIn)*1e-12 ? 0 : massIn-massOut;
  return {A1,A2,Q1,Q2,V2,massIn,massOut,accumulation,
    inletFlux:-massIn,outletFlux:massOut,wallFlux:0};
}

// Uniform end sections with a smooth transition, shared by geometry and tracers.
export function sectionAt(state, position) {
  const t=Math.max(0,Math.min(1,(position-0.20)/0.60));
  const blend=t*t*(3-2*t);
  const diameter=state.D1+(state.D2-state.D1)*blend;
  const density=state.rho1+(state.rho2-state.rho1)*blend;
  const velocity=state.rho1*state.V1*area(state.D1)/(density*area(diameter));
  return {diameter,density,velocity};
}

export function makeQuestion(random=Math.random) {
  const rounded=(min,max)=>Number((min+random()*(max-min)).toFixed(3));
  const state={D1:rounded(.12,.55),D2:rounded(.09,.45),V1:rounded(.6,3),rho1:1000,rho2:1000};
  return {state,answer:calculateFlow(state).V2};
}

export function correctAnswer(raw, expected) {
  if (String(raw).trim()==='') return false;
  const value=Number(raw);
  return Number.isFinite(value) && Math.abs(value-expected)<=Math.max(.01,Math.abs(expected)*.01);
}
