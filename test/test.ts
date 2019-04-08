import * as assert from "assert"
import * as validators from "./validators"

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