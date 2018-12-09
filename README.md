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

### 1.0.0

Initial release of ScriptBox
