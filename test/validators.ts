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
import { A, B, D, E } from "./in";
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
