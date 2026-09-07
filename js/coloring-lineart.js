/* 涂色画工坊 —— 线稿提取与填充算法（纯函数，无 DOM 依赖除 canvas 参数）
 *
 * 去色留线采用 DoG（高斯差分）+ 软阈值：对"颜料浓度"信号 s = 0.55·min通道 + 0.45·亮度
 * 做两次不同 σ 的高斯模糊，g2 - g1 > t 处即为颜色边界 → 画黑线。
 * 阈值作用在差分信号而非亮度本身，平涂区域（无论原色深浅）一律留白，
 * 这是涂色画与普通"素描化"的本质区别。
 */
(function () {
  "use strict";

  var DOG_RATIO = 1.6;
  var BOX_PASSES = 3;
  /* min 通道权重高：平涂彩色图里 min（颜料浓度）在不同颜色间反差远大于亮度 */
  var SIGNAL_MIN_WEIGHT = 0.7;
  var WHITE_SNAP = 0.93;
  var BLACK_SNAP = 0.07;

  function boxBlurH(src, dst, w, h, r) {
    var win = 2 * r + 1;
    for (var y = 0; y < h; y++) {
      var row = y * w;
      var acc = src[row] * (r + 1);
      var x;
      for (x = 1; x <= r; x++) acc += src[row + Math.min(x, w - 1)];
      for (x = 0; x < w; x++) {
        dst[row + x] = acc / win;
        acc += src[row + Math.min(x + r + 1, w - 1)] - src[row + Math.max(x - r, 0)];
      }
    }
  }

  function boxBlurV(src, dst, w, h, r) {
    var win = 2 * r + 1;
    for (var x = 0; x < w; x++) {
      var acc = src[x] * (r + 1);
      var y;
      for (y = 1; y <= r; y++) acc += src[Math.min(y, h - 1) * w + x];
      for (y = 0; y < h; y++) {
        dst[y * w + x] = acc / win;
        acc += src[Math.min(y + r + 1, h - 1) * w + x] - src[Math.max(y - r, 0) * w + x];
      }
    }
  }

  function blurApprox(data, w, h, sigma) {
    var r = Math.max(1, Math.round(sigma * 1.5));
    var tmp = new Float32Array(data.length);
    for (var p = 0; p < BOX_PASSES; p++) {
      boxBlurH(data, tmp, w, h, r);
      boxBlurV(tmp, data, w, h, r);
    }
    return data;
  }

  function pigmentSignal(pixels, n) {
    var sig = new Float32Array(n);
    for (var i = 0, j = 0; i < n; i++, j += 4) {
      var r = pixels[j], g = pixels[j + 1], b = pixels[j + 2];
      var mn = Math.min(r, g, b) / 255;
      var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      sig[i] = SIGNAL_MIN_WEIGHT * mn + (1 - SIGNAL_MIN_WEIGHT) * lum;
    }
    return sig;
  }

  /* 输入任意彩色 canvas，返回白底黑线的 ImageData */
  function extractLines(srcCanvas, params) {
    var w = srcCanvas.width, h = srcCanvas.height, n = w * h;
    var pixels = srcCanvas.getContext("2d").getImageData(0, 0, w, h).data;
    var sig = pigmentSignal(pixels, n);
    var g1 = blurApprox(Float32Array.from(sig), w, h, params.sigma);
    var g2 = blurApprox(sig, w, h, params.sigma * DOG_RATIO);
    var out = srcCanvas.getContext("2d").createImageData(w, h);
    var o = out.data;
    var phi = params.phi;
    for (var i = 0, j = 0; i < n; i++, j += 4) {
      var e = g2[i] - g1[i];
      var v = 1 - Math.tanh(phi * (e - params.t));
      if (v > WHITE_SNAP) v = 1;
      else if (v < BLACK_SNAP) v = 0;
      var c = Math.round(v * 255);
      o[j] = o[j + 1] = o[j + 2] = c;
      o[j + 3] = 255;
    }
    return out;
  }

  /* 由线稿像素生成边界掩码并膨胀。阈值放宽到 215（含 tanh 软膝部的灰线），
   * 配合膨胀封闭形状交汇处的缺口，防止油漆桶漏色。 */
  function boundaryMask(lineData, dilateTimes) {
    var w = lineData.width, h = lineData.height, n = w * h;
    var p = lineData.data;
    var bm = new Uint8Array(n);
    for (var i = 0, j = 0; i < n; i++, j += 4) {
      if (Math.max(p[j], p[j + 1], p[j + 2]) < 215) bm[i] = 1;
    }
    for (var d = 0; d < dilateTimes; d++) {
      var next = new Uint8Array(n);
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var k = y * w + x;
          if (
            bm[k] ||
            (x > 0 && bm[k - 1]) ||
            (x < w - 1 && bm[k + 1]) ||
            (y > 0 && bm[k - w]) ||
            (y < h - 1 && bm[k + w])
          ) {
            next[k] = 1;
          }
        }
      }
      bm = next;
    }
    return bm;
  }

  function colorClose(p, j, tr, tg, tb, ta, tolSq) {
    if (p[j + 3] < 16 && ta < 16) return true;
    if (p[j + 3] < 16 || ta < 16) return false;
    var dr = p[j] - tr, dg = p[j + 1] - tg, db = p[j + 2] - tb;
    return dr * dr + dg * dg + db * db <= tolSq;
  }

  /* 扫描线洪水填充：返回填充像素数（调用方据此判断泄漏并回滚）。
   * paintData 为画布当前 ImageData，直接就地修改；bm 为边界掩码。 */
  function floodFill(paintData, bm, sx, sy, rgba, tolSq) {
    var w = paintData.width, h = paintData.height;
    var p = paintData.data;
    var seed = (sy * w + sx) * 4;
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return 0;
    var tr = p[seed], tg = p[seed + 1], tb = p[seed + 2], ta = p[seed + 3];
    var fr = rgba[0] - tr, fg = rgba[1] - tg, fb = rgba[2] - tb;
    if (fr * fr + fg * fg + fb * fb <= tolSq) return 0;

    function fillable(i) {
      return !bm[i] && colorClose(p, i * 4, tr, tg, tb, ta, tolSq);
    }

    var count = 0;
    var stack = [sx, sy];
    while (stack.length) {
      var y = stack.pop(), x = stack.pop();
      if (!fillable(y * w + x)) continue;
      var lx = x, rx = x;
      while (lx > 0 && fillable(y * w + lx - 1)) lx--;
      while (rx < w - 1 && fillable(y * w + rx + 1)) rx++;
      for (var xx = lx; xx <= rx; xx++) {
        var k = (y * w + xx) * 4;
        p[k] = rgba[0];
        p[k + 1] = rgba[1];
        p[k + 2] = rgba[2];
        p[k + 3] = 255;
        count++;
      }
      for (var d = -1; d <= 1; d += 2) {
        var yy = y + d;
        if (yy < 0 || yy >= h) continue;
        var inRun = false;
        for (var cx = lx; cx <= rx; cx++) {
          var f = fillable(yy * w + cx);
          if (f && !inRun) stack.push(cx, yy);
          inRun = f;
        }
      }
    }
    return count;
  }

  window.ColoringLineart = {
    extractLines: extractLines,
    boundaryMask: boundaryMask,
    floodFill: floodFill,
  };
})();
