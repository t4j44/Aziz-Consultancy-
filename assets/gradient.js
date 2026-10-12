/* Hero background: a slow, silky three-colour gradient.
 *
 * Adapted from ShaderGradient (https://github.com/ruucm/shadergradient, MIT, ruucm and stone-skipper).
 * Two parts of its shaders are used here:
 *   - the Perlin noise that displaces its plane (cnoise, from glsl-noise, MIT), and
 *   - its colour mix:  mix(mix(c1, c2, smoothstep(-3.0, 3.0, x)), c3, z)
 * ShaderGradient renders a displaced mesh with React Three Fiber. Here the same noise and colour
 * mix run in one full-screen fragment pass on a plain WebGL canvas, so it works on phones with no
 * React or three.js. The surface normal is taken from the noise to light it like silk.
 *
 * Runs on any element marked data-gradient. Draws at reduced resolution (it is a soft gradient),
 * at about 30 fps, only while on screen. With reduced motion it draws a single still frame. */
(function () {
  'use strict';

  var hosts = document.querySelectorAll('[data-gradient]');
  if (!hosts.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 uRes;',
    'uniform float uTime;',

    // Classic Perlin noise 3D, from glsl-noise (hughsk), after Stefan Gustavson / Ashima Arts. MIT.
    'vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }',
    'vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }',
    'vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }',
    'float cnoise(vec3 P) {',
    '  vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);',
    '  Pi0 = mod289(Pi0); Pi1 = mod289(Pi1);',
    '  vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);',
    '  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);',
    '  vec4 iy = vec4(Pi0.yy, Pi1.yy);',
    '  vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;',
    '  vec4 ixy = permute(permute(ix) + iy);',
    '  vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);',
    '  vec4 gx0 = ixy0 * (1.0 / 7.0);',
    '  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;',
    '  gx0 = fract(gx0);',
    '  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);',
    '  vec4 sz0 = step(gz0, vec4(0.0));',
    '  gx0 -= sz0 * (step(0.0, gx0) - 0.5); gy0 -= sz0 * (step(0.0, gy0) - 0.5);',
    '  vec4 gx1 = ixy1 * (1.0 / 7.0);',
    '  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;',
    '  gx1 = fract(gx1);',
    '  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);',
    '  vec4 sz1 = step(gz1, vec4(0.0));',
    '  gx1 -= sz1 * (step(0.0, gx1) - 0.5); gy1 -= sz1 * (step(0.0, gy1) - 0.5);',
    '  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x); vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);',
    '  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z); vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);',
    '  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x); vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);',
    '  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z); vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);',
    '  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));',
    '  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;',
    '  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));',
    '  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;',
    '  float n000 = dot(g000, Pf0);',
    '  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));',
    '  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));',
    '  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));',
    '  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));',
    '  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));',
    '  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));',
    '  float n111 = dot(g111, Pf1);',
    '  vec3 fade_xyz = fade(Pf0);',
    '  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);',
    '  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);',
    '  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);',
    '  return 2.2 * n_xyz;',
    '}',

    // Brand colours: deep navy, royal navy, and a little gold at the crests.
    'const vec3 C1 = vec3(0.0157, 0.0588, 0.1686);',  // #040F2B
    'const vec3 C2 = vec3(0.0392, 0.1647, 0.4196);',  // #0A2A6B
    'const vec3 C3 = vec3(0.7961, 0.5294, 0.0667);',  // #CB8711

    'float field(vec2 p, float t) { return cnoise(vec3(p * 0.43 * 1.1, t)); }',

    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / uRes;',
    '  vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 6.0;',   // roughly the -3..3 range of their plane
    '  float t = uTime * 0.075;',
    '  float h = field(p, t) * 1.15;',
    // silk shading from the noise surface normal
    '  float e = 0.03;',
    '  float hx = field(p + vec2(e, 0.0), t) * 1.15 - h;',
    '  float hy = field(p + vec2(0.0, e), t) * 1.15 - h;',
    '  vec3 n = normalize(vec3(-hx / e, -hy / e, 1.0));',
    '  float light = dot(n, normalize(vec3(-0.45, 0.65, 0.75)));',
    // ShaderGradient colour mix, with the crest weight kept low so text stays readable
    '  float z = clamp(h * 0.5 + 0.5, 0.0, 1.0);',
    '  vec3 col = mix(mix(C1, C2, smoothstep(-3.0, 3.0, p.x + h * 1.6)), C3, smoothstep(0.66, 1.0, z) * 0.34);',
    '  col *= 0.72 + 0.46 * light;',
    // keep the edges deep so copy and the header stay legible
    '  float vig = smoothstep(1.35, 0.15, length((uv - vec2(0.62, 0.5)) * vec2(1.0, 1.15)));',
    '  col = mix(C1 * 0.62, col, vig);',
    // still film grain (a scroll-craft depth tool)
    '  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);',
    '  col += (g - 0.5) * 0.035;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      var info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(info || 'shader compile failed');
    }
    return shader;
  }

  function mount(host) {
    var canvas = document.createElement('canvas');
    canvas.className = 'gradient-canvas';
    canvas.setAttribute('aria-hidden', 'true');

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;

    var program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link failed');
    } catch (e) {
      return; // keep the CSS gradient behind it
    }
    gl.useProgram(program);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(program, 'uRes');
    var uTime = gl.getUniformLocation(program, 'uTime');

    host.insertBefore(canvas, host.firstChild);

    // A soft gradient needs few pixels: half resolution on desktop, less on phones.
    var scale = window.matchMedia('(min-width: 960px)').matches ? 0.5 : 0.4;

    function resize() {
      var w = Math.max(2, Math.round(host.clientWidth * scale));
      var h = Math.max(2, Math.round(host.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    var start = performance.now();
    function draw(now) {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduce ? 6.0 : (now - start) / 1000 + 6.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    resize();
    draw(performance.now());
    canvas.classList.add('is-live');

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function () { resize(); draw(performance.now()); }).observe(host);
    }

    if (reduce) return; // one still frame

    var running = false;
    var visible = true;
    var last = 0;
    var raf = 0;

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      draw(now);
    }
    function play() {
      if (running || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function pause() {
      running = false;
      cancelAnimationFrame(raf);
    }

    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) play(); else pause();
    }, { threshold: 0.01 }).observe(host);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause(); else play();
    });

    play();
  }

  hosts.forEach(mount);
})();
