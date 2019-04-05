export function isValidstring(data: any): data is string {
    return typeof data === "string";
}
export function isValidnumber(data: any): data is number {
    return typeof data === "number";
}
export function isValidboolean(data: any): data is boolean {
    return typeof data === "boolean";
}
import { A, B, C } from "./in";
export function isValidA(data: any): data is A {
    return isValidstring(data.str) && isValidnumber(data.num);
}
export function isValidB(data: any): data is B {
    return isValidstring(data.stro) && isValidnumber(data.num);
}
export function isValidC(data: any): data is C {
    return (typeof data.a === "undefined" || isValidA(data.a)) && isValidB(data.b);
}
