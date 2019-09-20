export function isValidstring(data: any): data is string {
    return typeof data === "string";
}
export function isValidnumber(data: any): data is number {
    return typeof data === "number";
}
export function isValidboolean(data: any): data is boolean {
    return typeof data === "boolean";
}
export function isValidany(data: any): data is undefined {
    return typeof data !== "undefined";
}
export function isValidnull(data: any): data is null {
    return data === null;
}
export function isValidEnum<T>(e: T, data: any): data is keyof T {
    return data in e || Object.values(e).includes(data);
}
export function isValidEnumArray<T>(e: T): (data: any) => data is keyof T {
    return (data: any): data is keyof T => {
        return data in e || Object.values(e).includes(data);
    };
}
import { auxA } from "./inAux";
import { auxauxA, auxauxB } from "./aux/auxinAux";
import { A, B, BB, D, E, F, G, H, HH, GG, GG2, GG3, I, J, JJ, K, L, M, N, O, P, PP, PPP, Q, QQ, R, RR, S, SS, T, TT, U, UU } from "./in";
export function isValidauxA(data: any): data is auxA {
    return typeof data !== "undefined" && data !== null && isValidstring(data.a);
}
export function isValidauxauxA(data: any): data is auxauxA {
    return typeof data !== "undefined" && data !== null && isValidstring(data.a);
}
export function isValidauxauxB(data: any): data is auxauxB {
    return typeof data !== "undefined" && data !== null && isValidauxA(data.a);
}
export function isValidA(data: any): data is A {
    return typeof data !== "undefined" && data !== null && isValidstring(data.str) && isValidnumber(data.num) && isValidboolean(data.bool) && isValidany(data.a);
}
export function isValidB(data: any): data is B {
    return typeof data !== "undefined" && data !== null && isValidstring(data.str) && (typeof data.a === "undefined" || isValidany(data.a));
}
export function isValidBB(data: any): data is BB {
    return typeof data !== "undefined" && data !== null && isValidB(data.b);
}
export function isValidD(data: any): data is D {
    return typeof data !== "undefined" && data !== null && isValidA(data.a) && (typeof data.b === "undefined" || isValidB(data.b)) && isValidnumber(data.c);
}
export function isValidE(data: any): data is E {
    return typeof data !== "undefined" && data !== null && isValidB(data.b) && isValidD(data.d);
}
export function isValidF(data: any): data is F {
    return typeof data !== "undefined" && data !== null && (typeof data.str === "undefined" || isValidstring(data.str)) && (typeof data.num === "undefined" || isValidnumber(data.num));
}
export function isValidH(data: any): data is H {
    return typeof data !== "undefined" && data !== null && isValidEnum<typeof G>(G, data.g);
}
export function isValidHH(data: any): data is HH {
    return typeof data !== "undefined" && data !== null && isValidEnum<typeof G>(G, data.g) && (typeof data.gg === "undefined" || isValidEnum<typeof G>(G, data.gg));
}
export function isValidI(data: any): data is I {
    return typeof data !== "undefined" && data !== null && isValidEnum<typeof GG>(GG, data.g) && isValidEnum<typeof GG2>(GG2, data.g2) && isValidEnum<typeof GG3>(GG3, data.g3);
}
export function isValidJ(data: any): data is J {
    return typeof data !== "undefined" && data !== null && (Array.isArray(data.a) && data.a.every((x: any) => isValidB(x)));
}
export function isValidJJ(data: any): data is JJ {
    return typeof data !== "undefined" && data !== null && (Array.isArray(data.a) && data.a.every((x: any) => Array.isArray(x) && x.every((x: any) => isValidB(x))));
}
export function isValidK(data: any): data is K {
    return typeof data !== "undefined" && data !== null && (Array.isArray(data.a) && data.a.every((x: any) => isValidEnum<typeof G>(G, x)));
}
export function isValidL(data: any): data is L {
    return typeof data !== "undefined" && data !== null && (Array.isArray(data.a) && data.a.every((x: any) => isValidEnum<typeof G>(G, x))) && (typeof data.b === "undefined" || isValidJ(data.b)) && isValidI(data.i);
}
export function isValidM(data: any): data is B {
    return isValidB(data);
}
export function isValidN(data: any): data is N {
    return isValidB(data) || isValidD(data);
}
export function isValidO(data: any): data is O {
    return isValidN(data) || isValidH(data);
}
export function isValidP(data: any): data is P {
    return typeof data !== "undefined" && data !== null && (isValidB(data.a) || Array.isArray(data.a) && data.a.every((x: any) => isValidD(x)));
}
export function isValidPP(data: any): data is PP {
    return typeof data !== "undefined" && data !== null && (Array.isArray(data.a) && data.a.every((x: any) => Array.isArray(x) && x.every((x: any) => Array.isArray(x) && x.every((x: any) => isValidB(x)))) || isValidN(data.a));
}
export function isValidPPP(data: any): data is PPP {
    return typeof data !== "undefined" && data !== null && (Array.isArray(data.bb) && data.bb.every((x: any) => isValidBB(x)));
}
export function isValidQ(data: any): data is B[] {
    return Array.isArray(data) && data.every((x: any) => isValidB(x));
}
export function isValidQQ(data: any): data is QQ {
    return Array.isArray(data) && data.every((x: any) => isValidB(x)) || isValidN(data);
}
export function isValidR(data: any): data is R {
    return typeof data !== "undefined" && data !== null && (typeof data.l !== "undefined" && data.l !== null && isValidstring(data.l.str));
}
export function isValidRR(data: any): data is RR {
    return typeof data !== "undefined" && data !== null && (typeof data.l !== "undefined" && data.l !== null && isValidB(data.l.b) && (typeof data.l.str === "undefined" || isValidstring(data.l.str)) || typeof data.l !== "undefined" && data.l !== null && isValidA(data.l.a));
}
export function isValidS(data: any): data is S {
    return typeof data !== "undefined" && data !== null && (typeof data.m !== "undefined" && data.m !== null && Object.values(data.m).every((x: any) => isValidB(x)));
}
export function isValidSS(data: any): data is SS {
    return typeof data !== "undefined" && data !== null && (typeof data.m !== "undefined" && data.m !== null && (typeof data.m.a !== "undefined" && data.m.a !== null && isValidstring(data.m.a.a)) && (typeof data.m.b !== "undefined" && data.m.b !== null && isValidstring(data.m.b.b)) && Object.values(data.m).every((x: any) => typeof x !== "undefined" && x !== null && isValidstring(x.a) || typeof x !== "undefined" && x !== null && isValidstring(x.b)));
}
export function isValidT(data: any): data is T {
    return (<any>isValidB(data)) && (typeof data !== "undefined" && data !== null && isValidnumber(data.num));
}
export function isValidTT(data: any): data is TT {
    return (<any>isValidB(data)) && (<any>isValidS(data)) && (typeof data !== "undefined" && data !== null && isValidnumber(data.num));
}
export function isValidU(data: any): data is U {
    return typeof data !== "undefined" && data !== null && (Object.keys(data.d).every((x: any) => isValidEnum<typeof G>(G, x)) && Object.values(data.d).every((x: any) => isValidnumber(x)));
}
export function isValidUU(data: any): data is UU {
    return typeof data !== "undefined" && data !== null && (Object.keys(data.d).every((x: any) => isValidEnum<typeof GG2>(GG2, x)) && Object.values(data.d).every((x: any) => isValidstring(x)));
}
