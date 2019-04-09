export function isValidstring(data: any): data is string {
    return typeof data === "string";
}
export function isValidnumber(data: any): data is number {
    return typeof data === "number";
}
export function isValidboolean(data: any): data is boolean {
    return typeof data === "boolean";
}
export function isValidany(data: any): data is boolean {
    return typeof data !== "undefined";
}
export function isValidnull(data: any): data is boolean {
    return data === null;
}
export function isValidEnum<T>(e: T, data: any): data is keyof T {
    return data in e || Object.values(e).includes(data);
}
import { A, B, D, E, F, G, H, GG, GG2, GG3, I } from "./in";
export function isValidA(data: any): data is A {
    return typeof data !== "undefined" && isValidstring(data.str) && isValidnumber(data.num) && isValidboolean(data.bool) && isValidany(data.a);
}
export function isValidB(data: any): data is B {
    return typeof data !== "undefined" && isValidstring(data.str) && (typeof data.a === "undefined" || isValidany(data.a));
}
export function isValidD(data: any): data is D {
    return typeof data !== "undefined" && isValidA(data.a) && (typeof data.b === "undefined" || isValidB(data.b)) && isValidnumber(data.c);
}
export function isValidE(data: any): data is E {
    return typeof data !== "undefined" && isValidB(data.b) && isValidD(data.d);
}
export function isValidF(data: any): data is F {
    return typeof data !== "undefined" && (typeof data.str === "undefined" || isValidstring(data.str)) && (typeof data.num === "undefined" || isValidnumber(data.num));
}
export function isValidH(data: any): data is H {
    return typeof data !== "undefined" && isValidEnum<typeof G>(G, data.g);
}
export function isValidI(data: any): data is I {
    return typeof data !== "undefined" && isValidEnum<typeof GG>(GG, data.g) && isValidEnum<typeof GG2>(GG2, data.g2) && isValidEnum<typeof GG3>(GG3, data.g3);
}
