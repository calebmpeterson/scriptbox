# Change Log

All notable changes to the "scriptbox" extension will be documented in this file.

## [1.4.0]

- The `JavaScript` scratch file is automatically evaluated on change and results are displayed in the **ScriptBox** Output panel.

## [1.3.0]

- Added a `JavaScript` scratch file (use the new **ScriptBox: Open Scratch** command) for use with **Eval Selection** command

## [0.3.0]

- Renamed **Run Selection** to **Eval Selection**
- **Run Script** now operates on the full text of the active editor if nothing is selected
- **Eval Selection** now evaluates the full text of the active editor if nothing is selected

## [0.2.1]

- Fixed: extension didn't activate when using the `Run Selection` command

## [0.2.0]

- Introduce the `Run Selection` command

## [0.1.0]

- Improved `README.md` documentation
- Each ScriptBox script is now executed with `this` bound to the [vscode namespace API](https://code.visualstudio.com/docs/extensionAPI/vscode-api)

## [0.0.9]

Created the logo for ScriptBox.

## [0.0.4]

Created an `OutputChannel` for all `console.*` statements within a ScriptBox script

## [0.0.3]

Started keeping release notes / changelog

## [0.0.2]

Cleaned up the `README` and `package.json`

## [0.0.1]

Initial release of ScriptBox
