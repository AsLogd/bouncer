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

/**
 * @boundary
 */
export enum G {
	A,
	B,
	C,
	D
}

/**
 * @boundary
 */
export interface H {
	g: G
}

/**
 * @boundary
 */
export interface HH {
	g: G
	gg?: G
}

/**
 * @boundary
 */
export enum GG {
	A=4,
	B,
	C,
	D
}

/**
 * @boundary
 */
export enum GG2 {
	A="E",
	B="F",
	C="G",
	D="H"
}

/**
 * @boundary
 */
export enum GG3 {
	A="B",
	B="C",
	C="D",
	D="E"
}

/**
 * @boundary
 */
export interface I {
	g: GG,
	g2: GG2,
	g3: GG3
}

/**
 * @boundary
 */
export interface J {
	a: B[]
}

/**
 * @boundary
 */
export interface JJ {
	a: B[][]
}


/**
 * @boundary
 */
export interface K {
	a: G[]
}

/**
 * @boundary
 */
export interface L {
	a: G[]
	b?: J
	i: I
}

/**
 * @boundary
 */
 export type M = B

 /**
 * @boundary
 */
 export type N = B | D

 /**
 * @boundary
 */
 export type O = N | H

/**
 * @boundary
 */
export interface P {
	a: B | D[]
}

/**
 * @boundary
 */
export interface PP {
	a: B[][][] | D
}