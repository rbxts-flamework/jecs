import style, { GLOB_MARKDOWN } from "@isentinel/eslint-config";

export default style(
	{
		rules: {
			"import/no-namespace": "off",
			"max-lines": "error",
			"max-lines-per-function": "off",
			"no-param-reassign": "off",
			"sonar/cognitive-complexity": "off",
			"ts/no-empty-object-type": "off",
			"ts/no-non-null-assertion": "off",
		},
		typescript: {
			parserOptions: {
				project: "tsconfig.eslint.json",
			},
			tsconfigPath: "tsconfig.eslint.json",
		},
	},
	{
		ignores: ["src/jecs/**", GLOB_MARKDOWN],
	},
);
