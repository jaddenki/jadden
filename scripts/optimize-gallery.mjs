import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, join } from 'node:path';
import sharp from 'sharp';

// Originals stay intact. Requires ffmpeg with libvpx-vp9; Sharp encodes posters.
// Run after changing src/data/projects.json or replacing an original video.
const root = fileURLToPath(new URL('../', import.meta.url));
const projects = JSON.parse(readFileSync(join(root, 'src/data/projects.json'), 'utf8'));
const output = join(root, 'public/img/front/optimized');
mkdirSync(output, { recursive: true });

function run(args) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`ffmpeg exited with ${result.status}`);
}

let originalBytes = 0;
let optimizedBytes = 0;
let posterBytes = 0;
for (const project of projects) {
  const input = join(root, 'public', project.src);
  const video = join(output, basename(project.src));
  const poster = video.replace(/\.webm$/, '.webp');
  // 2x the desktop gallery width. Never upscale; preserve source cadence/duration.
  const scale = "scale=w='min(800,iw)':h=-2:flags=lanczos";
  run(['-i', input, '-map', '0:v:0', '-an', '-vf', scale,
    '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-deadline', 'good',
    '-cpu-used', '3', '-row-mt', '1', '-threads', '4', '-pix_fmt', 'yuv420p', video]);
  // Tiny sources can already beat a re-encode. Remux those without audio instead.
  if (statSync(video).size > statSync(input).size) {
    run(['-i', input, '-map', '0:v:0', '-an', '-c:v', 'copy', video]);
  }
  const frame = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error',
    '-ss', String(project.posterTime), '-i', input, '-frames:v', '1',
    '-vf', scale, '-f', 'image2pipe', '-c:v', 'png', 'pipe:1'], { maxBuffer: 10 * 1024 * 1024 });
  if (frame.error) throw frame.error;
  if (frame.status !== 0) throw new Error(frame.stderr.toString());
  await sharp(frame.stdout).webp({ quality: 78 }).toFile(poster);
  originalBytes += statSync(input).size;
  optimizedBytes += statSync(video).size;
  posterBytes += statSync(poster).size;
  console.log(`${basename(video)}: ${(statSync(input).size / 1e6).toFixed(2)} → ${(statSync(video).size / 1e6).toFixed(2)} MB`);
}
console.log(`Videos: ${(originalBytes / 1e6).toFixed(2)} → ${(optimizedBytes / 1e6).toFixed(2)} MB (${(100 * (1 - optimizedBytes / originalBytes)).toFixed(1)}% smaller)`);
console.log(`Posters: ${(posterBytes / 1e3).toFixed(0)} KB total`);
