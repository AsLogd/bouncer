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
	return data in e || Object.values(e).includes(data)
}
export function isValidEnumArray<T>(e: T): (data: any) => data is keyof T {
	return (data: any): data is keyof T => {
		return data in e || Object.values(e).includes(data)
	}
}
