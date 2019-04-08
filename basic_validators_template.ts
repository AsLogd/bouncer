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