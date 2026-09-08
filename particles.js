import {sectionAt} from './physics.js';

// A travel-time coordinate keeps a steady stream of tracers across repeated
// transits. Its derivative is 1/local velocity, so one shared phase speed
// preserves the continuity speed ratio without Euler drift or clumping.
export class ParticleField {
  constructor(state, count=720) {
    this.offset=0;
    this.configure(state,count);
  }

  configure(state, count=this.particles.length) {
    this.state={...state};
    const key=[state.D1,state.D2,state.rho1,state.rho2,count].join(',');
    if(key===this.key)return;
    this.key=key;
    this.samples=1024;
    this.time=new Float64Array(this.samples+1);
    const unitFlow={...state,V1:1};
    let previous=1/sectionAt(unitFlow,0).velocity;
    for(let i=1;i<=this.samples;i++){
      const weight=1/sectionAt(unitFlow,i/this.samples).velocity;
      this.time[i]=this.time[i-1]+(previous+weight)/(2*this.samples);
      previous=weight;
    }
    this.totalTime=this.time[this.samples];
    this.particles=Array.from({length:count},(_,i)=>({
      phase:(i+.5)/count,
      lane:2*((i*.618033988749895+.5)%1)-1,
      t:0
    }));
    this.place();
  }

  position(phase) {
    const target=((phase%1)+1)%1*this.totalTime;
    let low=0,high=this.samples;
    while(high-low>1){
      const mid=(low+high)>>1;
      if(this.time[mid]>target)high=mid;else low=mid;
    }
    const fraction=(target-this.time[low])/(this.time[high]-this.time[low]);
    return (low+fraction)/this.samples;
  }

  place() {
    for(const particle of this.particles)particle.t=this.position(particle.phase+this.offset);
  }

  get phaseSpeed() {
    const peak=Math.max(this.state.V1,sectionAt(this.state,1).velocity);
    const scale=.028*Math.min(1,8/(peak||1));
    return this.state.V1*scale/this.totalTime;
  }

  advance(seconds) {
    if(seconds<=0||this.state.V1===0)return;
    this.offset=(this.offset+seconds*this.phaseSpeed)%1;
    this.place();
  }
}
