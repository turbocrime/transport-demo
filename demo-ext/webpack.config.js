import { resolve } from "path";
import CopyPlugin from "copy-webpack-plugin";
import WebExt from "web-ext";

const DIST_PATH = resolve("dist");

export default {
	mode: "development",
	devtool: "inline-source-map",
	entry: {
		popup: "./src/popup.tsx",
		options: "./src/options.tsx",
		background: "./src/background.ts",
		content: "./src/content.ts",
	},
	output: {
		path: resolve("dist"),
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
	plugins: [
		new CopyPlugin({ patterns: ["ext-assets"] }),
		new (class {
			apply(compiler) {
				compiler.hooks.afterEmit.tapPromise(
					{ name: "WebExt Reloader" },
					async ({ options }) => {
						this.webExt?.reloadAllExtensions();
						this.webExt ??= await WebExt.cmd.run({
							noReload: true,
							sourceDir: options.output.path,
							startUrl: "http://localhost:3000/",
							target: "chromium",
						});
						this.webExt.registerCleanup(() => {
							this.webExt = null;
						});
					},
				);
			}
		})(),
	],
};
