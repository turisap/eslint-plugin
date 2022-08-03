# eslint-plugin-turisap

A set of customized ESLint rules

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
        "allowRGBa": true
      }
    ]
  }
}
```

## Supported Rules

* `turisap/no-magic-numbers`: the same as [original ESLint rule](https://eslint.org/docs/latest/rules/no-magic-numbers#:~:text=The%20no%2Dmagic%2Dnumbers%20rule,to%20make%20their%20meaning%20explicit.), but allows to use rgba arrays with numbers:

```js
const rgbColor = [255, 255, 255];
const rgbaColor = [0, 0, 0, 0.5];
```


