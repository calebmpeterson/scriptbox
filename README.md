# ScriptBox

Enable on-the-fly scripting of your VS Code environment.

## Requirements

1. Create a folder in your home directory named `.scriptbox`
2. Create a JavaScript file in `.scriptbox` named `To Lower Case.js`
3. Add the following

```
module.exports = function(str) {
  return str.toLowerCase();
};
```

## Known Issues

None

## Release Notes

### 0.0.3

Started keeping this Release Notes

### 0.0.2

Cleaned up the `README` and `package.json`

### 0.0.1

Initial release of ScriptBox
