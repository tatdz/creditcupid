// src/types/circomlibjs.d.ts
declare module 'circomlibjs' {
  export function poseidon(inputs: (number | bigint)[]): bigint;
  export function buildPoseidon(): Promise<any>;
  // Add other exports as needed
}