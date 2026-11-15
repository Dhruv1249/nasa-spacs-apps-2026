export interface RadarMorphCanvasOptions {
  bounds: [[number, number], [number, number]];
  opacity: number;
  durationMs?: number;
}

export class RadarMorphCanvas {
  private map: any;
  private L: any;
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private bounds: [[number, number], [number, number]];
  private durationMs: number;
  private opacity: number;

  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texA: WebGLTexture | null = null;
  private texB: WebGLTexture | null = null;
  private uProgressLoc: WebGLUniformLocation | null = null;
  private uTexALoc: WebGLUniformLocation | null = null;
  private uTexBLoc: WebGLUniformLocation | null = null;

  private currentImg: HTMLImageElement | null = null;
  private targetImg: HTMLImageElement | null = null;
  private animFrameId: number | null = null;
  private isAnimating = false;
  private imageCache = new Map<string, HTMLImageElement>();

  private onMapMoveHandler: () => void;

  constructor(map: any, L: any, options: RadarMorphCanvasOptions) {
    this.map = map;
    this.L = L;
    this.bounds = options.bounds;
    this.opacity = options.opacity;
    this.durationMs = options.durationMs || 450;

    // Create persistent canvas element inside Leaflet overlayPane
    this.canvas = document.createElement("canvas");
    this.canvas.className = "leaflet-radar-morph-canvas";
    this.canvas.width = 512;
    this.canvas.height = 439;
    this.canvas.style.position = "absolute";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.opacity = this.opacity.toString();
    this.canvas.style.zIndex = "350";
    this.canvas.style.transition = "opacity 150ms ease";

    const overlayPane = map.getPanes().overlayPane;
    overlayPane.appendChild(this.canvas);

    // Initialize WebGL with fallback to 2D
    this.initWebGL();

    // Bind map movement handlers
    this.onMapMoveHandler = () => this.reposition();
    map.on("viewreset zoom move moveend zoomend", this.onMapMoveHandler);

    this.reposition();
  }

  private initWebGL() {
    try {
      this.gl = this.canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: true,
      });
    } catch {
      this.gl = null;
    }

    if (!this.gl) {
      this.ctx2d = this.canvas.getContext("2d");
      return;
    }

    const gl = this.gl;

    const vsSource = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = vec2((a_pos.x + 1.0) * 0.5, (1.0 - a_pos.y) * 0.5);
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    // Smooth energy-conserving radar morph shader (zero spatial distortion or wave ripples)
    const fsSource = `
      precision highp float;
      varying vec2 v_uv;
      uniform sampler2D u_texA;
      uniform sampler2D u_texB;
      uniform float u_progress;

      void main() {
        vec4 colA = texture2D(u_texA, v_uv);
        vec4 colB = texture2D(u_texB, v_uv);

        // Smoothstep S-curve for natural temporal acceleration and deceleration
        float t = smoothstep(0.0, 1.0, u_progress);

        // Energy-conserving quadratic radiometric blend (eliminates midpoint dimming and double-exposure ghosting)
        // In optical remote sensing, sqrt(mix(A^2, B^2, t)) preserves perceived luminous power and backscatter saturation
        vec3 colA_sq = colA.rgb * colA.rgb;
        vec3 colB_sq = colB.rgb * colB.rgb;
        vec3 blended = sqrt(mix(colA_sq, colB_sq, t));

        float alpha = mix(colA.a, colB.a, t);
        gl_FragColor = vec4(blended, alpha);
      }
    `;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      this.gl = null;
      this.ctx2d = this.canvas.getContext("2d");
      return;
    }

    this.program = prog;
    gl.useProgram(prog);

    // Quad covering [-1, 1]
    const quad = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    this.uProgressLoc = gl.getUniformLocation(prog, "u_progress");
    this.uTexALoc = gl.getUniformLocation(prog, "u_texA");
    this.uTexBLoc = gl.getUniformLocation(prog, "u_texB");

    gl.uniform1i(this.uTexALoc, 0);
    gl.uniform1i(this.uTexBLoc, 1);
  }

  private createGLTexture(img: HTMLImageElement): WebGLTexture | null {
    if (!this.gl) return null;
    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) return null;

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    return tex;
  }

  public reposition() {
    if (!this.map || !this.canvas || !this.bounds) return;
    const [min_lat, min_lon] = this.bounds[0];
    const [max_lat, max_lon] = this.bounds[1];

    const nw = this.map.latLngToLayerPoint(this.L.latLng(max_lat, min_lon));
    const se = this.map.latLngToLayerPoint(this.L.latLng(min_lat, max_lon));

    const width = Math.max(1, Math.round(se.x - nw.x));
    const height = Math.max(1, Math.round(se.y - nw.y));

    // Native Leaflet positioner strictly locks the canvas to geographic coordinates
    this.L.DomUtil.setPosition(this.canvas, nw);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  public setBounds(bounds: [[number, number], [number, number]]) {
    this.bounds = bounds;
    this.reposition();
  }

  public setOpacity(opacity: number) {
    this.opacity = opacity;
    this.canvas.style.opacity = opacity.toString();
  }

  public setDuration(durationMs: number) {
    this.durationMs = durationMs;
  }

  public transitionToUrl(url: string, durationMs?: number) {
    const dur = durationMs ?? this.durationMs;

    if (this.imageCache.has(url)) {
      const cached = this.imageCache.get(url)!;
      this.executeTransition(cached, dur);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      this.imageCache.set(url, img);
      this.executeTransition(img, dur);
    };
    img.src = url;
  }

  private executeTransition(newImg: HTMLImageElement, durationMs: number) {
    // If first image ever loaded, draw directly with zero transition
    if (!this.currentImg) {
      this.currentImg = newImg;
      if (this.canvas.width !== newImg.naturalWidth && newImg.naturalWidth > 0) {
        this.canvas.width = newImg.naturalWidth;
        this.canvas.height = newImg.naturalHeight;
      }
      this.renderFrame(1.0);
      return;
    }

    if (this.currentImg === newImg) {
      return;
    }

    // Cancel any active animation frame
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.targetImg = newImg;

    if (this.gl && this.program) {
      const gl = this.gl;
      if (this.texA) gl.deleteTexture(this.texA);
      if (this.texB) gl.deleteTexture(this.texB);

      this.texA = this.createGLTexture(this.currentImg);
      this.texB = this.createGLTexture(newImg);
    }

    const startTime = performance.now();
    this.isAnimating = true;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);

      this.renderFrame(progress);

      if (progress < 1.0) {
        this.animFrameId = requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        this.animFrameId = null;
        this.currentImg = newImg;
        this.targetImg = null;
      }
    };

    this.animFrameId = requestAnimationFrame(animate);
  }

  private renderFrame(progress: number) {
    if (this.gl && this.program && this.texA && this.texB) {
      const gl = this.gl;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(this.program);
      gl.uniform1f(this.uProgressLoc, progress);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texA);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.texB);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      return;
    }

    // 2D Canvas Fallback: smooth cross-dissolve with zero background flash
    if (this.ctx2d && this.currentImg) {
      const ctx = this.ctx2d;
      const w = this.canvas.width;
      const h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!this.targetImg || progress >= 1.0) {
        ctx.globalAlpha = 1.0;
        ctx.drawImage(this.targetImg || this.currentImg, 0, 0, w, h);
      } else {
        // Base image at solid 100% (ensures no transparency dip to the basemap)
        ctx.globalAlpha = 1.0;
        ctx.drawImage(this.currentImg, 0, 0, w, h);

        // Target image fades in directly over the base image
        const t = progress * progress * (3.0 - 2.0 * progress);
        ctx.globalAlpha = t;
        ctx.drawImage(this.targetImg, 0, 0, w, h);
      }
    }
  }

  public destroy() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.map.off("viewreset zoom move moveend zoomend", this.onMapMoveHandler);

    if (this.gl) {
      if (this.texA) this.gl.deleteTexture(this.texA);
      if (this.texB) this.gl.deleteTexture(this.texB);
      if (this.positionBuffer) this.gl.deleteBuffer(this.positionBuffer);
      if (this.program) this.gl.deleteProgram(this.program);
    }

    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.imageCache.clear();
  }
}
