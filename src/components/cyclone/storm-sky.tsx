import { useEffect, useRef } from "react";
import { viewMeta } from "@/lib/cyclone/views";
import type { ViewId } from "@/lib/cyclone/types";

const VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
const FS = `precision highp float;
uniform sampler2D uTex; uniform vec2 uRes,uMouse; uniform float uAsp,uTime,uPhase,uSwirl,uZoom,uFlash,uRain,uAmt; uniform vec3 uTint; uniform vec3 uL[5];
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec2 rot(vec2 v,float a){float c=cos(a),s=sin(a);return vec2(c*v.x-s*v.y,s*v.x+c*v.y);}
vec3 tex(vec2 q){return texture2D(uTex,clamp(q,0.001,0.999)).rgb;}
void main(){
  vec2 uv=vec2(gl_FragCoord.x/uRes.x,1.-gl_FragCoord.y/uRes.y);
  float sa=uRes.x/uRes.y; vec2 p=uv-.5;
  if(sa>uAsp)p.y*=uAsp/sa; else p.x*=sa/uAsp;
  p=p/uZoom+.5+uMouse*.012;
  p.x+=sin(uTime*1.1+p.y*9.)*.0014*smoothstep(.4,.6,p.y)*(1.-smoothstep(.75,.85,p.y));
  vec2 c=vec2(.53,.42); vec2 A=vec2(uAsp,1.);
  vec2 d=(p-c)*A; float r=length(d);
  float m=(1.-smoothstep(.42,.74,p.y))*smoothstep(.03,.2,r);
  m*=1.-(1.-smoothstep(.05,.11,abs(p.x-.55)))*smoothstep(.45,.55,p.y);
  float amp=.24*uSwirl*m*exp(-r*1.5);
  float ph1=uPhase,ph2=fract(uPhase+.5),w=1.-abs(2.*uPhase-1.);
  vec3 col=mix(tex(c+rot(d,-ph2*amp)/A),tex(c+rot(d,-ph1*amp)/A),w);
  float g=0.; for(int i=0;i<5;i++){vec2 e=(p-uL[i].xy)*A; g+=exp(-dot(e,e)*34.)*uL[i].z;}
  float lum=dot(col,vec3(.3,.59,.11));
  col+=vec3(.62,.78,1.)*g*(.22+lum*1.7);
  col+=vec3(.5,.65,1.)*uFlash*(.04+lum*.55)*(1.15-p.y*.6);
  vec2 q=vec2(uv.x*sa*46.+uv.y*7.,uv.y*2.4-uTime*2.6); vec2 f=fract(q),id=floor(q);
  float st=step(.9,h(id))*smoothstep(.42,.5,f.x)*smoothstep(.58,.5,f.x)*smoothstep(0.,.5,f.y)*(1.-f.y);
  col+=vec3(.7,.8,1.)*st*.16*uRain;
  col=mix(col,col*uTint*1.5,uAmt);
  col*=1.-.5*pow(length(uv-.5)*1.3,2.2);
  col+=(h(uv*uRes+uTime)-.5)*.035;
  gl_FragColor=vec4(col,1.);
}`;

const LIGHTS = [
  [0.46, 0.58],
  [0.63, 0.63],
  [0.9, 0.5],
  [0.1, 0.47],
  [0.53, 0.46],
];

type Props = { view: ViewId; flashKey: number };

export function StormSky({ view, flashKey }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef(view);
  const flashRef = useRef(0);
  viewRef.current = view;

  useEffect(() => {
    flashRef.current = Math.max(flashRef.current, 0.7);
  }, [flashKey, view]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const el = canvas;
    const gl = el.getContext("webgl", {
      antialias: false,
      powerPreference: "high-performance",
    });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!gl) {
      el.style.display = "none";
      document.body.style.backgroundImage = "url(/storm.jpg)";
      document.body.style.backgroundSize = "cover";
      return;
    }
    const gfx = gl;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U: Record<string, WebGLUniformLocation | null> = {};
    for (const n of [
      "uTex",
      "uRes",
      "uMouse",
      "uAsp",
      "uTime",
      "uPhase",
      "uSwirl",
      "uZoom",
      "uFlash",
      "uRain",
      "uAmt",
      "uTint",
      "uL",
    ]) {
      U[n] = gl.getUniformLocation(program, n);
    }

    const lp = new Float32Array(15);
    LIGHTS.forEach((l, i) => {
      lp[i * 3] = l[0];
      lp[i * 3 + 1] = l[1];
    });

    let aspect = 1.79;
    let ready = false;
    const photo = new Image();
    photo.crossOrigin = "anonymous";
    photo.onload = () => {
      aspect = photo.width / photo.height;
      const t = gfx.createTexture();
      gfx.bindTexture(gfx.TEXTURE_2D, t);
      gfx.texImage2D(gfx.TEXTURE_2D, 0, gfx.RGB, gfx.RGB, gfx.UNSIGNED_BYTE, photo);
      gfx.texParameteri(gfx.TEXTURE_2D, gfx.TEXTURE_MIN_FILTER, gfx.LINEAR);
      gfx.texParameteri(gfx.TEXTURE_2D, gfx.TEXTURE_MAG_FILTER, gfx.LINEAR);
      gfx.texParameteri(gfx.TEXTURE_2D, gfx.TEXTURE_WRAP_S, gfx.CLAMP_TO_EDGE);
      gfx.texParameteri(gfx.TEXTURE_2D, gfx.TEXTURE_WRAP_T, gfx.CLAMP_TO_EDGE);
      ready = true;
    };
    photo.src = "/storm.jpg";

    const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / innerWidth - 0.5;
      mouse.y = e.clientY / innerHeight - 0.5;
    };
    addEventListener("pointermove", onMove);

    const cur = { swirl: 1, speed: 1, zoom: 1.04, rain: 0.5, amt: 0.1, sev: 1, tint: [0.75, 0.92, 1] };
    let phase = 0;
    let nextStrike = 3;
    let last = performance.now();
    let running = true;
    const root = document.documentElement.style;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 1.5);
      el.width = (innerWidth * dpr) | 0;
      el.height = (innerHeight * dpr) | 0;
      gfx.viewport(0, 0, el.width, el.height);
    };
    resize();
    addEventListener("resize", resize);

    const strike = (power: number) => {
      const n = 1 + Math.floor(Math.random() * 3);
      const set = () => {
        for (let k = 0; k < n; k++) lp[((Math.random() * 5) | 0) * 3 + 2] = power * (0.7 + Math.random() * 0.5);
        lp[14] = Math.max(lp[14], power * 0.8);
        flashRef.current = Math.max(flashRef.current, power * 0.5);
      };
      set();
      window.setTimeout(set, 90 + Math.random() * 80);
      root.setProperty("--pulse", "1");
      window.setTimeout(() => root.setProperty("--pulse", "0"), 180);
    };

    const vis = () => {
      running = !document.hidden;
      if (running) {
        last = performance.now();
        requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", vis);

    function frame(now: number) {
      if (!running) return;
      requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const T = viewMeta(viewRef.current);
      const k = 1 - Math.exp(-2 * dt);
      cur.swirl += (T.swirl - cur.swirl) * k;
      cur.speed += (T.speed - cur.speed) * k;
      cur.zoom += (T.zoom - cur.zoom) * k;
      cur.rain += (T.rain - cur.rain) * k;
      cur.amt += (T.amt - cur.amt) * k;
      cur.sev += (T.sev - cur.sev) * k;
      for (let i = 0; i < 3; i++) cur.tint[i] += (T.tint[i] - cur.tint[i]) * k;
      mouse.sx += (mouse.x - mouse.sx) * k;
      mouse.sy += (mouse.y - mouse.sy) * k;
      phase = (phase + dt * cur.speed * (reduced ? 0.25 : 1) / 18) % 1;
      if (!reduced) {
        nextStrike -= dt;
        if (nextStrike <= 0) {
          strike(0.55 + cur.sev * 0.15);
          nextStrike = (5 + Math.random() * 6) / (1 + (cur.sev - 1) * 0.9);
        }
      }
      const dec = Math.exp(-dt * 7);
      for (let i = 0; i < 5; i++) lp[i * 3 + 2] *= dec;
      flashRef.current *= Math.exp(-dt * 6);
      if (!ready) return;
      gfx.uniform1i(U.uTex, 0);
      gfx.uniform2f(U.uRes, el.width, el.height);
      gfx.uniform2f(U.uMouse, mouse.sx, mouse.sy);
      gfx.uniform1f(U.uAsp, aspect);
      gfx.uniform1f(U.uTime, now / 1000);
      gfx.uniform1f(U.uPhase, phase);
      gfx.uniform1f(U.uSwirl, cur.swirl);
      gfx.uniform1f(U.uZoom, cur.zoom * (1 + Math.sin(now / 6000) * 0.008));
      gfx.uniform1f(U.uFlash, flashRef.current);
      gfx.uniform1f(U.uRain, cur.rain);
      gfx.uniform1f(U.uAmt, cur.amt);
      gfx.uniform3fv(U.uTint, cur.tint);
      gfx.uniform3fv(U.uL, lp);
      gfx.drawArrays(gfx.TRIANGLE_STRIP, 0, 4);
    }
    requestAnimationFrame(frame);

    return () => {
      running = false;
      removeEventListener("pointermove", onMove);
      removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="sky"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
