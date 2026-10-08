import { mkdir } from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';

const io = new NodeIO();
await mkdir('public/models', { recursive: true });

const statue = await io.read('assets/source/statue.glb');
const statueMat = statue.getRoot().listMaterials()[0];
statueMat.setBaseColorFactor([0.08, 0.11, 0.2, 1]);
statueMat.setMetallicFactor(1);
statueMat.setRoughnessFactor(0.16);
await io.write('public/models/statue.glb', statue);

const curve = await io.read('assets/source/curve.glb');
const curveMat = curve.getRoot().listMaterials()[0];
curveMat.setBaseColorFactor([0.72, 0.28, 0.08, 1]);
curveMat.setMetallicFactor(1);
curveMat.setRoughnessFactor(0.2);
await io.write('public/models/curve.glb', curve);

console.log('wrote public/models/statue.glb and curve.glb');
