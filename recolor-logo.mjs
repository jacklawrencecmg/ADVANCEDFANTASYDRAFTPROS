import { Jimp } from 'jimp';
import { readFileSync, writeFileSync } from 'fs';

function hslToRgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [Math.round(f(h + 1/3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1/3) * 255)];
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

async function recolor(inFile, outFile) {
  const buf = readFileSync(inFile);
  const img = await Jimp.fromBuffer(buf);
  const { width, height, data } = img.bitmap;

  for (let i = 0; i < width * height * 4; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a < 20) continue;

    const [h, s, l] = rgbToHsl(r, g, b);

    // Dark navy bg → near-black #0d0d14
    if (h >= 195 && h <= 230 && s > 0.25 && l < 0.18) {
      data[i] = 13; data[i+1] = 13; data[i+2] = 20;
    }
    // Deep navy (dark shield areas) → dark violet
    else if (h >= 200 && h <= 238 && s > 0.35 && l >= 0.18 && l < 0.30) {
      const [x, y, z] = hslToRgb(262/360, 0.42, l * 0.55);
      data[i] = x; data[i+1] = y; data[i+2] = z;
    }
    // Medium blue (stripes, inner shield) → mid violet
    else if (h >= 205 && h <= 242 && s > 0.40 && l >= 0.30 && l < 0.48) {
      const [x, y, z] = hslToRgb(262/360, 0.58, l * 0.62);
      data[i] = x; data[i+1] = y; data[i+2] = z;
    }
    // Light blue text & highlights → electric violet #9f5ff5
    else if (h >= 183 && h <= 222 && s > 0.40 && l >= 0.48) {
      const newL = Math.min(0.80, l * 0.94);
      const [x, y, z] = hslToRgb(265/360, 0.80, newL);
      data[i] = x; data[i+1] = y; data[i+2] = z;
    }
  }

  const out = await img.getBuffer('image/png');
  writeFileSync(outFile, out);
  console.log('Saved', outFile);
}

const desktop = 'C:\\Users\\jlawrence\\OneDrive - cmgfi\\Desktop';

await recolor(`${desktop}\\FDP2.png`, `${desktop}\\FDP2_midnight.png`);
await recolor(`${desktop}\\FDP1.png`, `${desktop}\\FDP1_midnight.png`);
console.log('Done!');
