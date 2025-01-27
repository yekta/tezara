import { atom } from "jotai";

export const previousPathAtom = atom<string | null>(null);
export const yearGteKeyAtom = atom<number>(0);
export const yearLteKeyAtom = atom<number>(0);
