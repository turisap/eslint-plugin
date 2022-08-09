# eslint-plugin-turisap

A set of customized ESLint and `@typescript/eslint` rules

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-turisap`:

```sh
npm install eslint-plugin-turisap --save-dev
```

## Usage

Add `turisap` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "turisap"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "turisap/no-magic-numbers": [
      "error",
      {
        "allowRGBa": true,
        "allowedCalls": ["setTimeout"]
      }
    ]
  }
}
```

## Supported Rules

`turisap/no-magic-numbers`: the same as [original ESLint rule](https://eslint.org/docs/latest/rules/no-magic-numbers#:~:text=The%20no%2Dmagic%2Dnumbers%20rule,to%20make%20their%20meaning%20explicit.), but allows to use a few extra settings, namely
* rgb(a) arrays with numbers:

```js
const rgbColor = [255, 255, 255];
const rgbaColor = [0, 0, 0, 0.5];
```

* numeric function params in specified functions. For example, it is pretty obvious what the following parameter means

```js
const id = setTimeout(fn, 300);
```

By the same token, it does not report the `space` param on `JSON.stringify`

```js
const body = JSON.stringify(user, null, 2) 
```

