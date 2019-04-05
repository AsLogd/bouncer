import "./basic_validators"

/**
 * @boundary
 */
export interface A {
	str: string,
	num: number
}
/**
 * @boundary
 */
export interface B {
	stro: string,
	num: number
}

/**
 * @boundary
 */
export interface C {
	a?: A,
	b: B
}