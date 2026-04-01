/**
 * Converts CamelCase to snake_case, aligned with gc-scripts-hub
 * `f/common_logic/identifier_utils.py` `camel_to_snake`.
 *
 * @see https://stackoverflow.com/questions/1175208/elegant-python-function-to-convert-camelcase-to-snake-case
 */
const CAMEL_TO_SNAKE_PATTERN =
  /(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g;

export const camelToSnake = (name: string): string => {
  return name.replace(CAMEL_TO_SNAKE_PATTERN, "_").toLowerCase();
};
