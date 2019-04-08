/**
 * @boundary
 */
export interface A {
	str: string,
	num: number,
	bool: boolean,
	a: any
}

/**
 * @boundary
 */
export interface B {
	str: string,
	a?: any
}


export interface C {
	str: string,
	a?: any
}

/**
 * @boundary
 */
export interface D {
	a: A,
	b?: B,
	c: number
}

/**
 * @boundary
 */
export interface E {
	b: B,
	d: D
}

/**
 * @boundary
 */
export interface F {
	str?: string,
	num?: number
}