const path = require("path");
const log = require("fancy-log");
const c = require("ansi-colors");
const gulp = require("gulp");
const gulpCount = require("gulp-count");
const gulpIf = require("gulp-if");
const size = require("gulp-size");
const imagemin = require("gulp-imagemin");
const jpegtran = require("imagemin-jpegtran");
const cache = require("gulp-cache");
const through = require("through2");

const count = (message) => gulpCount({ message, logger: log });
const gulpLog = (...messages) => through.obj(
	(file, enc, cb) => cb(null, file),
	(cb) => {
		for (const message of messages) {
			if (typeof message === "function") {
				log(message());
			} else {
				log(message);
			}
		}
		cb();
	},
);

exports.assetMinify = function () {
	log(c.cyan("Asset minification starting. Please be patient, this may take a long time..."));
	const sizeBefore = size({ showTotal: false });
	const sizeAfter = size({ showTotal: false });
	return gulp.src("../../**/*.{jpg,jpeg,png,svg}")
		.pipe(gulpLog(
			"",
			c.cyan("File counts"),
			"--------------------------------",
		))
		.pipe(gulpIf(/\.png$/, count("PNG:\t<%= files %> found")))
		.pipe(gulpIf(/\.jpe?g$/, count("JPG:\t<%= files %> found")))
		.pipe(gulpIf(/\.svg$/, count("SVG:\t<%= files %> found")))
		.pipe(gulpLog("--------------------------------"))
		.pipe(count("Found <%= files %> in total for minification"))
		.pipe(gulpLog(""))
		.pipe(sizeBefore)
		.pipe(gulpLog(
			() => `Total file size before minification: ${c.magenta(sizeBefore.prettySize)}`,
			"",
		))
		.pipe(cache(
			imagemin([
				jpegtran(),
				imagemin.optipng({ optimizationLevel: 5 }),
				imagemin.svgo({
					plugins: [
						{
							name: "removeViewBox",
							active: true,
						},
						{
							name: "cleanupIDs",
							active: true,
						},
					],
				}),
			]),
			{
				name: "imagemin",
				fileCache: new cache.Cache({
					tmpDir: path.resolve(__dirname, ".imagemin-cache"),
					cacheDirName: "gulp-cache",
				}),
			},
		))
		.pipe(sizeAfter)
		.pipe(gulpLog(
			"",
			() => `Total file size after minification: ${c.magenta(sizeAfter.prettySize)}`,
			"",
		));
};

exports.clean = function () {
	return cache.clearAll();
};
