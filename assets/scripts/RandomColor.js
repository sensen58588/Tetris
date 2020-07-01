function hslToRgb(H, S, L) {
    var R, G, B;
    if (+S === 0) {
      R = G = B = L; // 饱和度为0 为灰色
    } else {
      var hue2Rgb = function(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      var Q = L < 0.5 ? L * (1 + S) : L + S - L * S;
      var P = 2 * L - Q;
      // H = H/360;
      R = hue2Rgb(P, Q, H + 1 / 3);
      G = hue2Rgb(P, Q, H);
      B = hue2Rgb(P, Q, H - 1 / 3);
    }
    return [Math.round(R * 255), Math.round(G * 255), Math.round(B * 255)];
}

function getRandomColor(){
    var HSL = [];
    var hslLength = 34; // 获取数量
    for (var i = 0; i < hslLength; i++) {
      // 获取随机HSL
      var H = Math.random();
      var S = Math.random();
      var L = Math.random();
      var ret = [H, S, L];
      // 颜色相邻颜色差异须大于 0.5
      if (i > 0 && Math.abs(ret[0] - HSL[i - 1][0]) < 0.28) {
        i--;
        continue; // 重新获取随机色
      }
      ret[1] = 0.7 + ret[1] * 0.2; // [0.7 - 0.9] 排除过灰颜色
      ret[2] = 0.4 + ret[2] * 0.4; // [0.4 - 0.8] 排除过亮过暗色

      // 数据转化到小数点后两位
      ret = ret.map(function(item) {
        return parseFloat(item.toFixed(2));
      });
      HSL.push(ret);
    }
    let _hsl = HSL[Math.floor(Math.random()*HSL.length)];
    return hslToRgb(_hsl[0],_hsl[1],_hsl[2]);
}

export{getRandomColor};