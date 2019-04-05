import * as V from "./validators"

const okC = {
	a: {
		str: "asdf",
		num: 2
	},
	b: {
		stro: "asdf",
		num: 1
	}
}

const okC2 = {
	b: {
		stro: "asdf",
		num: 1
	}
}

const nokC = {
	a: {
		str: "asdf",
		num: "asdf"
	},
	b: {
		stro: "asdf",
		num: 1
	}
}


if(V.isValidC(okC)) {
	console.log(" okc Is valid")
}

if(V.isValidC(okC2)) {
	console.log(" okc2 Is valid")
}

if(V.isValidC(nokC)) {
	console.log(" nokc Is valid")
}