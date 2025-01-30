import { atom } from "jotai";

export const routeHistoryAtom = atom<string[]>([]);
export const yearGteKeyAtom = atom<number>(0);
export const yearLteKeyAtom = atom<number>(0);
