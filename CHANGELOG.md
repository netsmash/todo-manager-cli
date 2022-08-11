# Changelog

The purpouse of this file is to log the high level of changes on the product.

## [0.2.1] 22-07-2022

### Added
- On README, valid color names has been written.
- On README, a cheatsheet with common command formulas has been added.

### Changed
- Code has been refactor to be more modular.

### Fixed
- On show board detail, frequencies of tasks are aligned.

## [0.2.0] 27-04-2022

### Added
- A change log.
- Allow show commands to only output the IDs with flag `-q`.
- Allow to fit or not the output to the terminal width.
- Command `show configuration` to show configuration summary.
- Ability for configuration to interpret variables `${FILENAME}` and `${DIRNAME}`.
- On detail board view, ask distribution over the steps


### Changed
- Configuartion `overrides` fields has been renamed to `files`.
- Detail views now show the exact date of creation/update.

### Fixed
- On show tasks view, made board's sorting consistent.
- On show tasks view, `-s` filters now work for steps with repeated name.
