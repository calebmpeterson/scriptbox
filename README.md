![ScriptBox](documentation/logo-with-name.png)

# ScriptBox

Enable on-the-fly scripting of your VS Code environment.

![ScriptBox in action](documentation/demo.gif)

## Usage

1. Create a folder in your home directory named `.scriptbox`
2. Create a JavaScript file in `.scriptbox` named `To Lower Case.js`
3. Add the following

```
module.exports = function(str) {
  return str.toLowerCase();
};
```

4. Select text in another editor
5. Use the **Run Script** command
6. Select the **To Lower Case.js** option
7. _Your text selection has been lower cased_

## Script API

> `function (currentSelection)`

Each ScriptBox script is passed the current text selection as a `string`.

The current text selection is **replaced** with the return value if a `string` is returned.

The current text selection is **unchanged** if the return value is `undefined`, `null`, or `false`.

The script function is executed with `this` bound to the [vscode namespace object](https://code.visualstudio.com/docs/extensionAPI/vscode-api).

## Can I Use NPM Packages In My Scripts?

Yes, just use `npm`/`yarn`/etc... to add `packages.json` to your `~/.scriptbox/` directory, add the packages needed, and then `require('the-package')` within your scripts.

## Known Issues

None

## Credits

Logo based on [Hexagon by Chris Kerr from the Noun Project](https://thenounproject.com/term/hexagon/30707/)

## Release Notes

The [CHANGELOG](CHANGELOG.md) contains release notes for each release.
