const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
	devtool: "inline-source-map",
	entry: {
		popup: "./src/popup.tsx",
		options: "./src/options.tsx",
		background: "./src/background.ts",
		content: "./src/content.ts",
	},
	output: {
		path: path.resolve("./dist"),
		filename: "[name].js",
	},
	optimization: {
		splitChunks: {
			name: "vendor",
			chunks: (chunk) => chunk.name !== "background",
		},
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	resolve: { extensions: [".ts", ".tsx", ".js"] },
	plugins: [new CopyPlugin({ patterns: ["ext-assets"] })],
};
