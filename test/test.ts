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

let h = '{"g": 1}'
assert(validators.isValidH(JSON.parse(h)), "Valid enum is invalid (enum member)")

let hh = '{"g": 1, "gg": 1}'
assert(validators.isValidHH(JSON.parse(hh)), "Valid enum is invalid (optional enum member)")

assert(validators.isValidHH(JSON.parse(h)), "Valid enum is invalid (missing optional enum member)")

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

c = '{"a":[]}'
assert(validators.isValidJ(JSON.parse(c)), "Valid interface is invalid (empty array)")
c = '{"a":[{"str": "a"}, {"str":"b", "a": 2}]}'
assert(validators.isValidJ(JSON.parse(c)), "Valid interface is invalid (array)")

c = '{"a":[[{"str": "a"}, {"str":"b", "a": 2}], [{"str": "a"}], [{"str": "a"}, {"str": "b"}, {"str": "a", "a":3}]]}'
assert(validators.isValidJJ(JSON.parse(c)), "Valid interface is invalid (matrix)")

c = '{"a":[]}'
assert(validators.isValidK(JSON.parse(c)), "Valid interface is invalid (empty enum array)")
c = '{"a":["A", "B", "C", "D"]}'
assert(validators.isValidK(JSON.parse(c)), "Valid interface is invalid (enum array (key))")
c = '{"a":[0, 1, 2, 3]}'
assert(validators.isValidK(JSON.parse(c)), "Valid interface is invalid (enum array (num))")

c = '{"a":["E", "B", "C", "D"]}'
assert(validators.isValidK(JSON.parse(c)) === false, "Invalid interface is valid (enum array (key))")
c = '{"a":[5, 1, 2, 3]}'
assert(validators.isValidK(JSON.parse(c)) === false, "Invalid interface is valid (enum array (num))")

c = '{"a":["A", "B"], "i": {"g": 5, "g2":"B", "g3":"E"}}'
assert(validators.isValidL(JSON.parse(c)), "Valid interface is invalid (misc 1)")
c = '{"a":["A", "B"], "b":{"a":[{"str":"b", "a":2}, {"str":"a"}]}, "i": {"g": 5, "g2":"B", "g3":"E"}}'
assert(validators.isValidL(JSON.parse(c)), "Valid interface is invalid (misc 2)")

c = '{"a":["A", "B"], "b":{"a":{"a":1}},"i": {"g": 5, "g2":"B", "g3":"E"}}'
assert(validators.isValidL(JSON.parse(c)) === false, "Invalid interface is valid (misc 1)")
c = '{"a":["A", "B", 10], "i": {"g": 5, "g2":"B", "g3":"E"}}'
assert(validators.isValidL(JSON.parse(c)) === false, "Invalid interface is valid (misc 2)")
c = '{"a":["A", "B"], "i": {"a": 5, "g2":"B", "g3":"E"}}'
assert(validators.isValidL(JSON.parse(c)) === false, "Invalid interface is valid (misc 3)")
c = '{"a":{"A":0, "B":1}, "i": {"a": 5, "g2":"B", "g3":"E"}}'
assert(validators.isValidL(JSON.parse(c)) === false, "Invalid interface is valid (misc 4)")

let b = '{"a":2, "str": "a"}'
assert(validators.isValidM(JSON.parse(b)), "Valid type alias is invalid (1)")
c = '{"a": "asdf"}'
assert(validators.isValidM(JSON.parse(c)) === false, "Invalid type alias is valid (1)")

b = '{"a":2, "str": "a"}'
assert(validators.isValidN(JSON.parse(b)), "Valid type alias is invalid (2)")
let d = '{"a":{"str":"a", "num": 1, "bool": true, "a":1}, "c": 12}'
assert(validators.isValidN(JSON.parse(b)), "Valid type alias is invalid (2)")
c = '{"a": "asdf"}'
assert(validators.isValidN(JSON.parse(c)) === false, "Invalid type alias is valid (2)")

assert(validators.isValidO(JSON.parse(b)), "Valid type alias is invalid (3)")
assert(validators.isValidO(JSON.parse(d)), "Valid type alias is invalid (4)")
assert(validators.isValidO(JSON.parse(h)), "Valid type alias is invalid (5)")

let p = '{"a": {"str": "asdf", "a": 2}}'
assert(validators.isValidP(JSON.parse(p)), "Valid interface is invalid (type alias member)")

p = '{"a": [{"a": {"str": "asdf", "a": 2, "num": 3, "bool": true}, "c": 12}, {"a": {"str": "asdf", "a": "2", "num": 3, "bool": false}, "c": 12}]}'
assert(validators.isValidP(JSON.parse(p)), "Valid interface is invalid (type alias member 2)")

p = '{"a": {"stra": "asdf", "a": 2, "num": 3, "bool": true}}'
assert(validators.isValidP(JSON.parse(p)) === false, "Invalid interface is valid (type alias member 1)")

p = '{"a": [{"str": "asdf", "num": 3, "bool": true}, {"str": "asdf", "a": "2", "num": 3, "bool": true}]}'
assert(validators.isValidP(JSON.parse(p)) === false, "Invalid interface is valid (type alias member 2)")

p = '{"a": [[[{"str": "asdf"}, {"str": "asdf", "a": "2"}], [{"str": "asdf"}]], [[{"str": "asdf"}]]]}'
assert(validators.isValidPP(JSON.parse(p)), "Valid interface is ivalid (type alias member + 3d matrix)")
p = '{"a": {"str":"asdf"}}'
assert(validators.isValidPP(JSON.parse(p)), "Valid interface is ivalid (type alias member + 3d matrix 2)")

let auxA = '{"a": "str"}'
assert(validators.isValidauxA(JSON.parse(auxA)), "Valid interface is invalid (external file)")

assert(validators.isValidauxauxA(JSON.parse(auxA)), "Valid interface is invalid (external file in folder)")

let auxauxB = '{"a": {"a": "str"}}'
assert(validators.isValidauxauxB(JSON.parse(auxauxB)), "Valid interface is invalid (imported member)")

assert(validators.isValidD(null) === false, "Check null values")

let dnull = '{"a": null, "c": 2}'
assert(validators.isValidD(JSON.parse(dnull)) === false, "Check null values 2")

let ppp = '{"bb": [{"b": {"str": "str"}}, {"b": {"str": "str", "a": "p"}}]}'
assert(validators.isValidPPP(JSON.parse(ppp)), "Valid array generic")

let nobb = '{}'
assert(validators.isValidPPP(JSON.parse(nobb)) === false, "Invalid array generic")
let nobb2 = '{"bb": [{"b": "a"}, {"c": 2}]}'
assert(validators.isValidPPP(JSON.parse(nobb2)) === false, "Invalid array generic (2)")

let bb = '[{"str": "a"}, {"str": "c"}]'
assert(validators.isValidQ(JSON.parse(bb)), "Valid type alias is invalid (array)")
assert(validators.isValidQQ(JSON.parse(bb)), "Valid type alias is invalid (union with array 1)")
assert(validators.isValidQQ(JSON.parse(b)), "Valid type alias is invalid (union with array 2)")
let nqq = '{"c": "c"}'
assert(validators.isValidQQ(JSON.parse(nqq)) === false, "Invalid type alias is valid")

let r = '{"l": {"str": "a"}}'
assert(validators.isValidR(JSON.parse(r)), "Valid interface is invalid (object literal member)")
let r2 = '{"l": 3}'
assert(validators.isValidR(JSON.parse(r2)) === false, "Invalid interface is valid (object literal member)")

let rr = '{"l": {"b": {"str": "a"}, "str": "o"}}'
assert(validators.isValidRR(JSON.parse(rr)), "Valid interface is invalid (object literal member misc)")
let rr2 = '{"l": {"b": {"str": "a"}, "str": 2}}'
assert(validators.isValidRR(JSON.parse(rr2)) === false, "Invalid interface is valid (object literal member misc2)")
let rr3 = '{"l": {"a": {"str": "s", "num": 2, "bool": true, "a": 0}}}'
assert(validators.isValidRR(JSON.parse(rr3)), "Valid interface is invalid (object literal member misc3)")

let s = '{"m": {"testkey": {"str": "s"}, "testkey2": {"str": "s2"}}}'
assert(validators.isValidS(JSON.parse(s)), "Valid interface is invalid (map member)")
s = '{"m": {"testkey": {"str": "s"}, "testkey2": {"stfr": "s2"}}}'
assert(validators.isValidS(JSON.parse(s)) === false, "Invalid interface is valid (map member)")

let ss = '{"m": {"testkey": {"a": "a"}, "testkey2": {"b": "b"}, "a": {"a": "a"}, "b": {"b": "b"}}}'
assert(validators.isValidSS(JSON.parse(ss)), "Valid interface is invalid (map member misc)")
ss = '{"m": {"testkey": {"c": "a"}, "testkey2": {"b": "b"}, "a": {"a": "a"}, "b": {"b": "b"}}}'
assert(validators.isValidSS(JSON.parse(ss)) === false, "Invalid interface is valid (map member misc)")
ss = '{"m": {"testkey": {"a": "a"}, "testkey2": {"b": "b"}, "a": {"b": "a"}, "b": {"b": "b"}}}'
assert(validators.isValidSS(JSON.parse(ss)) === false, "Invalid interface is valid (map member misc 2)")


let t = '{"str": "a", "num": 2}'
assert(validators.isValidT(JSON.parse(t)), "Valid interface is invalid (interface extends)")
t = '{"num": 2}'
assert(validators.isValidT(JSON.parse(t)) === false, "Invalid interface is valid (interface extends)")

let tt = '{"str": "a", "num": 2, "m": {"testkey": {"str": "s"}, "testkey2": {"str": "s2"}}}'
assert(validators.isValidTT(JSON.parse(tt)), "Valid interface is invalid (interface extends multiple)")
tt = '{"num": 2, "m": {"testkey": {"a": "a"}, "testkey2": {"b": "b"}, "a": {"a": "a"}, "b": {"b": "b"}}}'
assert(validators.isValidTT(JSON.parse(tt)) === false, "Invalid interface is valid (interface extends multiple 1)")
tt = '{"str": "a", "num": 2}'
assert(validators.isValidTT(JSON.parse(tt)) === false, "Invalid interface is valid (interface extends multiple 2)")


let uu = '{"d": {"A": "a", "B": "b"}}'
assert(validators.isValidUU(JSON.parse(uu)), "Valid interface is invalid (string enum index)")

uu = '{"d": {"A": "a", "B": "b", "H": "h"}}'
assert(validators.isValidUU(JSON.parse(uu)), "Valid interface is invalid (string enum index, key and values)")

uu = '{"d": {"A": "a", "B": "b", "Z": "z"}}'
assert(validators.isValidUU(JSON.parse(uu)) === false, "Invalid interface is valid (string enum index)")