# UTFuck.js

UTFuck is a Unicode to [JSFuck](https://esolangs.org/wiki/JSFuck) encoder and
an alternative to <https://jsfuck.com>.

Similar to the JSFuck website, it is capable of converting both plain text and
JavaScript code to only six characters `!` `+` `[` `]` `(` `)`.

From now on, this document will refer to JSFuck as the <https://jsfuck.com>
website with [this Github repository](https://github.com/aemkei/jsfuck), not
the JSFuck encoding technique.

## Differences from JSFuck

- Doesn't use regular expression to replace strings
- Dynamically generates and selects the shortest encoding for each characters
- Uses `String.fromCodePoint` instead of escape sequence for unicode characters
- Uses modern JavaScript features such as `atob`, `Array.at`
- Optimize long strings by generating a lookup table for repeated characters

Currently lots of characters in UTFuck has a longer encoding size than JSFuck
but other featues and optimizations makes UTFuck's output generally shorter

## Example

This is the encoding of `alert(1)`, which is only 636 characters long instead
of 853 when using JSFuck

```js
[][(![]+[])[+!![]]+(!![]+[])[+[]]][([][(![]+[])[+!![]]+(!![]+[])[+[]]]+[])[!![]+!![]+!![]]+([][(![]+[])[+!![]]+(!![]+[])[+[]]]+[])[!![]+!![]+!![]+!![]+!![]+!![]]+([][[]]+[])[+!![]]+(![]+[])[!![]+!![]+!![]]+(!![]+[])[+[]]+(!![]+[])[+!![]]+([][[]]+[])[+[]]+([][(![]+[])[+!![]]+(!![]+[])[+[]]]+[])[!![]+!![]+!![]]+(!![]+[])[+[]]+([][(![]+[])[+!![]]+(!![]+[])[+[]]]+[])[!![]+!![]+!![]+!![]+!![]+!![]]+(!![]+[])[+!![]]]((![]+[])[+!![]]+(![]+[])[!![]+!![]]+(!![]+[])[!![]+!![]+!![]]+(!![]+[])[+!![]]+(!![]+[])[+[]]+([][(![]+[])[+!![]]+(!![]+[])[+[]]]+[])[+!![]+[+!![]]]+(+!![]+[])+([][(![]+[])[+!![]]+(!![]+[])[+[]]]+[])[+!![]+[!![]+!![]]])()
```

## TODO

- More efficient list encoding
- Add tests
- Port to C, still use JavaScript for generating the character map
- Build a web application (for both character map generation and encoding)

## License

This project is licensed under the [WTFPL license](LICENSE).
