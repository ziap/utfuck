const digits = [
  "+[]",      // 0
  "+!![]",    // +true
  "!![]+!![]" // true + true
]

// Generates the rest of the digits
// digits[i] = true + digits[i - 1]
for (let i = 3; i < 10; ++i) digits[i] = `!![]+${digits[i - 1]}`

/**
 * Converts an unsigned integer to a JSFuck sequence
 * This is done by concatenating the digits together
 * @param {number} n
 */
function uint(n) {
  if (n < 10) return digits[n]
  let result = `[${digits[n % 10]}]`
  n = Math.floor(n / 10)

  while (n >= 10) {
    result = `[${digits[n % 10]}]+${result}`
    n = Math.floor(n / 10)
  }

  result = `${digits[n]}+${result}`

  return result
}

// Might swap this to a trie/radix tree
/** @type {Map<string, string>} */
const str_table = new Map()

/**
 * Update the string's jsfuck representation if it is shorter
 * @param {string} key
 * @param {string} value
 */
function update_str(key, value) {
  if (str_table.has(key)) {
    const old_len = str_table.get(key).length
    if (old_len > value.length) str_table.set(key, value)
  } else str_table.set(key, value)
}

/**
 * Add a JSFuck sequence to the mapping table, the string is evaluated and all its characters are also added
 * @param {string} value
 */
function table_add_str(value) {
  const key = eval(value)
  update_str(key, value[0] == '+' ? `(${value})` : value)
  for (let i = 0; i < key.length; ++i) update_str(key[i], `(${value})[${uint(i)}]`)
}

// Add the digits to the table
for (let i = 0; i < 10; ++i) str_table.set(`${i}`, `(${digits[i]}+[])`)

function *primitives_gen() {
  yield digits[0]
  yield digits[1]
  for (let i = 2; i < 10; ++i) yield `(${digits[i]})`

  yield "![]"    // false
  yield "!![]"   // true
  yield "[][[]]" // undefined
  yield "+[![]]" // NaN

  // Special numbers (for +,-,.)
  yield `+[${uint(1)}+${str_table.get("e")}+(${uint(1000)})]`
  yield `+[${uint(11)}+${str_table.get("e")}+(${uint(20)})]`
  yield `+[${str_table.get(".")}+(${uint(0)})+(${uint(0)})+(${uint(0)})+(${uint(0)})+(${uint(0)})+(${uint(0)})+(${uint(1)})]`
}

for (const primitive of primitives_gen()) table_add_str(`${primitive}+[]`)

/**
 * Converts a JavaScript string into a JSFuck sequence by indexing the mapping table
 * @param {string} s
 */
function str_lookup(s) {
  if (!s) return "[]+[]"
  let result = ""

  while (s) {
    let best_length = 0
    let best_value = ""
    for (const [key, value] of str_table.entries()) {
      if (s.startsWith(key) && key.length > best_length) {
        best_length = key.length
        best_value = value
      }
    }
    if (best_length) {
      result = result ? `${result}+${best_value}` : best_value
      s = s.slice(best_length)
    } else throw new Error(`"${s}" does not exists in mapping table`)
  }

  return result
}

// We'll reuse these so it's better to cache them
const at_str = str_lookup("at")
const entries_str = str_lookup("entries")

table_add_str(`[][${at_str}]+[]`)        // function
table_add_str(`[][${entries_str}]()+[]`) // object

// HTML wrapper methods. They are deprecated but also gives us some useful characters
// Also needed for getting RegExp (//)
const WRAPPERS = [
  "anchor", "big", "blink", "bold", "fixed", "fontcolor",
  "fontsize", "italics", "link", "small", "strike", "sub", "sup"
]

outer: for (const wrapper of WRAPPERS) {
  for (const c of wrapper) if (!str_table.has(c)) continue outer
  table_add_str(`([]+[])[${str_lookup(wrapper)}]()`)
}

outer: for (const wrapper of WRAPPERS) {
  for (const c of wrapper) if (!str_table.has(c)) continue outer
  if (""[wrapper].length) table_add_str(`([]+[])[${str_lookup(wrapper)}](${str_lookup("\"")})`)
}

table_add_str(`[[]][${str_lookup("concat")}]([[]])+[]`) // ,

const constructor_str = str_lookup("constructor")
const CONSTRUCTORS = {
  Array:    "[]",
  Number:   "(+[])",
  String:   "([]+[])",
  Boolean:  "(![])",
  Function: `[][${at_str}]`,
  RegExp:   `[][${at_str}][${constructor_str}](${str_lookup("return /")}+![]+${str_lookup("/")})()`,
  // Doesn't work in newer Chrome (returns Iterator instead of Object, and requires new to call it)
  // Object:   `[][${entries_str}]()`
};

const constructor_arr = Object.values(CONSTRUCTORS)
for (const c of constructor_arr) table_add_str(`${c}[${constructor_str}]+[]`)
for (const c of constructor_arr) table_add_str(`${c}[${constructor_str}]()+[]`)

const name_str = str_lookup("name")
for (const c of constructor_arr) table_add_str(`${c}[${constructor_str}][${name_str}]`)

for (const c of Array.from(str_table.values())) {
  try {
    table_add_str(`${CONSTRUCTORS.RegExp}[${constructor_str}](${c})+[]`)
  } catch {
  }
}

// Only Function are reused but these are too fucking long so I'll still cache them
const Function_str = `${CONSTRUCTORS.Function}[${constructor_str}]`

// TODO: Try to get more characters with atob/btoa
const btoa_str = `${Function_str}(${str_lookup("return btoa")})()`
for (const c of Array.from(str_table.values())) table_add_str(`${btoa_str}(${c})`)

const split_str = str_lookup("split")
const join_str = str_lookup("join")
const comma_str = str_lookup(",")
const map_str = str_lookup("map")
const bind_str = str_lookup("bind")

/**
 * Encode an array of number to JSFuck
 * @param {number[]} a 
 * @returns {string}
 */
function uint_arr(a, limit=0) {
  // TODO: more efficient list encoding

  // Force the first number in the list to be a string
  let result_unoptimized = a[0] < 10 ? `${digits[a[0]]}+[]` : uint(a[0])
  for (let i = 1; i < a.length; ++i) result_unoptimized += `+![]+(${uint(a[i])})`
  result_unoptimized = `(${result_unoptimized})[${split_str}](![])`

  // This is not really the right way to terminate but I'll just go with it
  if (limit && result_unoptimized.length > limit) return ""

  let duplicated = false

  /**@type {Map<number, number>}*/
  const occurence_map = new Map()
  for (const item of a) {
    if (!occurence_map.has(item)) occurence_map.set(item, 1)
    else {
      occurence_map.set(item, occurence_map.get(item) + 1)
      duplicated = true
    }
  }

  if (!duplicated) return result_unoptimized

  const [unique_arr, index_map] = generate_unique_mapping(occurence_map)

  /**@type {number[]}*/
  const indices_arr = new Array(a.length)
  for (let i = 0; i < indices_arr.length; ++i) {
    indices_arr[i] = index_map.get(a[i])
  }

  let result_optimized = `[${map_str}]([][${at_str}][${bind_str}](${uint_arr(unique_arr)}))`
  if (result_optimized.length >= result_unoptimized.length) return result_unoptimized
  const indices_arr_str = uint_arr(indices_arr, result_unoptimized.length - result_optimized.length)
  if (indices_arr_str) return indices_arr_str + result_optimized
  return result_unoptimized
}

/**
 * Generate a unique array and an item -> index mapping from an item -> occurence mapping
 * The unique array is approximately sorted so that the cost of indexing it is lowest
 *
 * @template T
 * @param {Map<T, number>} occurence_map 
 * @returns {[T[], Map<T, number>]}
 */
function generate_unique_mapping(occurence_map) {
  const occurence_entries = Array.from(occurence_map.entries())
  occurence_entries.sort((a, b) => b[1] - a[1])

  const indices = new Uint32Array(occurence_entries.length)
  for (let i = 0; i < indices.length; ++i) indices[i] = i
  indices.sort((a, b) => uint(a).length - uint(b).length)

  const inv_indices = new Uint32Array(indices.length)
  for (let i = 0; i < indices.length; ++i) inv_indices[indices[i]] = i

  /** @type {T[]} */
  const unique_arr = new Array(occurence_entries.length)
  for (let i = 0; i < unique_arr.length; ++i) {
    unique_arr[i] = occurence_entries[inv_indices[i]][0]
  }

  /** @type {Map<T, number>} */
  const index_map = new Map()
  for (let i = 0; i < occurence_entries.length; ++i) {
    index_map.set(occurence_entries[i][0], indices[i])
  }

  return [unique_arr, index_map]
}

const lookup_encoder = {
  /**
   * @param {string} s
   */
  can_encode(s) {
    for (const c of s) if (!str_table.has(c)) return false
    return true
  },
  /**
   * @param {string} s
   */
  encode(s) {
    /** @type {Map<string, number>} */
    const char_occurence_map = new Map()
    for (const c of s) {
      if (!char_occurence_map.has(c)) char_occurence_map.set(c, 1)
      else char_occurence_map.set(c, char_occurence_map.get(c) + 1)
    }
    
    const [unique_arr, char_index_map] = generate_unique_mapping(char_occurence_map)

    // TODO: It might be better to use another encoder here
    const unique = str_lookup(unique_arr.join(""))

    /** @type {number[]} */
    const indices_arr = new Array(s.length)
    for (let i = 0; i < indices_arr.length; ++i) {
      indices_arr[i] = char_index_map.get(s[i])
    }

    const optimized = `${uint_arr(indices_arr)}[${map_str}](([]+[])[${str_lookup("charAt")}][${bind_str}](${unique}))[${join_str}]([])`
    const unoptimized = str_lookup(s)

    return optimized.length < unoptimized.length ? optimized : unoptimized
  }
}

const code_point_encoder = {
  /**
   * @param {string} _
   */
  can_encode(_) {
    // TODO: Check if all required characters are defined
    return true
  },

  /**
   * @param {string} s
   */
  encode(s) {
    if (s.length == 1) {
      // TODO: Make a separate escape sequence encoder and use String.codePointAt in here
      const code_point = s.codePointAt(0)
      const hex = code_point.toString(16)
      const esc_str = code_point < 0xff ? str_lookup("\\x" + hex.padStart(2, '0')) : str_lookup("\\u" + hex.padStart(4, '0'))
      return `${Function_str}(${str_lookup("return\"")}+${esc_str}+${str_lookup("\"")})()`
    }
    const code_arr = new Array(s.length)
    for (let i = 0; i < code_arr.length; ++i) code_arr[i] = s.codePointAt(i)

    const no_join = `${uint_arr(code_arr)}[${join_str}](${comma_str})`
    let join = code_arr[0] < 10 ? `${digits[code_arr[0]]}+[]` : uint(code_arr[0])
    for (let i = 1; i < code_arr.length; ++i) join += `+${comma_str}+(${uint(code_arr[i])})`

    const code_points = no_join.length < join.length ? no_join : join
    return `${Function_str}(${str_lookup("return String.fromCodePoint(")}+${code_points}+${str_lookup(")")})()`
  }
}

const encoders = [
  code_point_encoder,
  lookup_encoder,
]

/**
 * Encode a unicode string into a JSFuck sequence
 * @param {string} s
 */
export function encode(s) {
  if (s == "") return ""
  if (s.length > 0xffff) {
    const m = s.length >>> 1
    return `${encode(s.slice(0, m))}+${encode(s.slice(m))}`
  }
  const encodings = []
  
  for (const encoder of encoders) {
    if (encoder.can_encode(s)) encodings.push(encoder.encode(s))
  }

  if (!encodings.length) throw new Error(`Can't encode "${s}"`)

  let best_encoding = encodings[0]
  for (let i = 1; i < encodings.length; ++i) {
    if (encodings[i].length < best_encoding.length) {
      best_encoding = encodings[i]
    }
  }
  
  return best_encoding
}

/**
 * Compile a valid JavaScript string into an executable JSFuck sequence
 * @param {string} s
 */
export function encode_run(s) {
  const encoded = encode(s)
  return `${Function_str}(${encoded})()`
}
