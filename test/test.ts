import * as assert from "assert"
import * as validators from "./validators"
import * as input from "./in"

let c1 = '{"str": "string", "num": 1, "bool": true, "a": "a"}'
assert(validators.isValidA(JSON.parse(c1)), "Valid interface is not true")

let c2 = '{"str": "string", "num": 1, "bool": true, "a": null}'
assert(validators.isValidA(JSON.parse(c2)), "Valid interface is not true (any with null)")

let c = '{"str": 2, "num": 1, "bool": true, "a": "a"}'
assert(validators.isValidA(JSON.parse(c)) === false, "Invalid interface is true (number in string)")

c = '{"str": "string", "num": "str", "bool": true, "a": "a"}'
assert(validators.isValidA(JSON.parse(c)) === false, "Invalid interface is true (string in number)")

c = '{"str": "string", "num": 2, "bool": "true", "a": "a"}'
assert(validators.isValidA(JSON.parse(c)) === false, "Invalid interface is true (string in boolean)")

c = '{"str": "string", "num": 2, "bool": "true"}'
assert(validators.isValidA(JSON.parse(c)) === false, "Invalid interface is true (missing any)")

c = '{"str": "string"}'
assert(validators.isValidB(JSON.parse(c)), "Valid interface is not true (undefined question token)")

c = '{"str": "string", "a": 12}'
assert(validators.isValidB(JSON.parse(c)), "Valid interface is not true (defined question token)")

assert((validators as any).isValidC === undefined, "A non boundary interface has validator")

let cd = '{"a": '+c1+', "b": '+c2+', "c": 1}'
assert(validators.isValidD(JSON.parse(cd)), "Valid interface is not true (interface members):"+cd)

c = '{"b": '+c1+', "c": 1}'
assert(validators.isValidD(JSON.parse(c)) === false, "Invalid interface is true (missing interface members)")

c = '{"a": '+c1+', "c": 1}'
assert(validators.isValidD(JSON.parse(c)), "Valid interface is not true (interface members, missing question token member)")

c = '{"b": '+c2+', "d": '+cd+'}'
assert(validators.isValidE(JSON.parse(c)), "Valid interface is not true (multiple nested interfaces)")

c = '{}'
assert(validators.isValidF(JSON.parse(c)), "Valid interface is not true (empty object with question members)")

assert(validators.isValidF(undefined) === false, "Invalid interface is true (undefined)")

assert(validators.isValidEnum<typeof input.G>(input.G, '1'), "Valid enum is invalid (string)")
assert(validators.isValidEnum<typeof input.G>(input.G, 1), "Valid enum is invalid (num)")
assert(validators.isValidEnum<typeof input.G>(input.G, 'A'), "Valid enum is invalid (key)")

assert(validators.isValidEnum<typeof input.G>(input.G, '10') === false, "Invalid enum is valid (string)")
assert(validators.isValidEnum<typeof input.G>(input.G, 10) === false, "Invalid enum is valid (num)")
assert(validators.isValidEnum<typeof input.G>(input.G, 'Z') === false, "Invalid enum is valid (key)")

c = '{"g": 1}'
assert(validators.isValidH(JSON.parse(c)), "Valid enum is invalid (enum member)")

assert(validators.isValidEnum<typeof input.GG>(input.GG, '5'), "Valid enum(with constructors) is invalid (string)")
assert(validators.isValidEnum<typeof input.GG>(input.GG, 5), "Valid enum(with constructors) is invalid (num)")
assert(validators.isValidEnum<typeof input.GG>(input.GG, 'A'), "Valid enum(with constructors) is invalid (key)")

assert(validators.isValidEnum<typeof input.GG>(input.GG, '3') === false, "Invalid enum(with constructors) is valid (string)")
assert(validators.isValidEnum<typeof input.GG>(input.GG, 2)  === false, "Invalid enum(with constructors) is valid (num)")
assert(validators.isValidEnum<typeof input.GG>(input.GG, 'E')  === false, "Invalid enum(with constructors) is valid (key)")

assert(validators.isValidEnum<typeof input.GG2>(input.GG2, 'E'), "Valid enum(with constructors) is invalid (string)")
assert(validators.isValidEnum<typeof input.GG2>(input.GG2, 'A'), "Valid enum(with constructors) is invalid (key)")

assert(validators.isValidEnum<typeof input.GG2>(input.GG2, '3') === false, "Invalid enum(with constructors) is valid (string)")
assert(validators.isValidEnum<typeof input.GG2>(input.GG2, 2)  === false, "Invalid enum(with constructors) is valid (num)")
assert(validators.isValidEnum<typeof input.GG2>(input.GG2, 'I')  === false, "Invalid enum(with constructors) is valid (key)")

assert(validators.isValidEnum<typeof input.GG3>(input.GG3, 'B'), "Valid enum(with constructors) is invalid (string)")
assert(validators.isValidEnum<typeof input.GG3>(input.GG3, 'C'), "Valid enum(with constructors) is invalid (key)")

assert(validators.isValidEnum<typeof input.GG3>(input.GG3, '3') === false, "Invalid enum(with constructors) is valid (string)")
assert(validators.isValidEnum<typeof input.GG3>(input.GG3, 2)  === false, "Invalid enum(with constructors) is valid (num)")
assert(validators.isValidEnum<typeof input.GG3>(input.GG3, 'I')  === false, "Invalid enum(with constructors) is valid (key)")

c = '{"g": "A", "g2": "F", "g3": "E"}'
assert(validators.isValidH(JSON.parse(c)), "Valid enum is invalid (multiple enum members)")