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
const rimraf = require("rimraf");

const BASE_DIR = path.resolve(__dirname, "..", "..");
const CACHE_DIR = path.resolve(__dirname, ".imagemin-cache");
const BATCH_SIZE = 10;
const SIZE_CONFIG = { showTotal: false };

exports.assetMinify = gulp.series(analyzeBefore, generateBatches, minifyBatches, analyzeAfter);

exports.clean = function (cb) {
	rimraf(CACHE_DIR, cb);
};

const sizeBefore = size(SIZE_CONFIG);
const sizeAfter = size(SIZE_CONFIG);
let files = [];
let batches = [];
const sizes = {
	before: {
		png: size(SIZE_CONFIG),
		jpg: size(SIZE_CONFIG),
		svg: size(SIZE_CONFIG),
		total: size(SIZE_CONFIG),
	},
	after: {
		png: size(SIZE_CONFIG),
		jpg: size(SIZE_CONFIG),
		svg: size(SIZE_CONFIG),
		total: size(SIZE_CONFIG),
	},
};

function analyze(beforeOrAfter, sizePlugins, record = false) {
	if (record) {
		files = [];
	}
	return sourceFiles()
		.pipe(gulpIf(record, through.obj((file, env, cb) => {
			files.push(file.path);
			cb(null, file);
		})))
		.pipe(gulpLog(
			"",
			c.cyan(`File counts ${beforeOrAfter} minification`),
			"--------------------------------",
		))
		.pipe(gulpIf(/\.png$/, count("PNG:\t<%= files %> found")))
		.pipe(gulpIf(/\.png$/, sizePlugins.png))
		.pipe(gulpIf(/\.jpe?g$/, count("JPG:\t<%= files %> found")))
		.pipe(gulpIf(/\.jpe?g$/, sizePlugins.jpg))
		.pipe(gulpIf(/\.svg$/, count("SVG:\t<%= files %> found")))
		.pipe(gulpIf(/\.svg$/, sizePlugins.svg))
		.pipe(gulpLog("--------------------------------"))
		.pipe(count("Found <%= files %> in total for minification"))
		.pipe(sizePlugins.total)
		.pipe(gulpLog(
			"",
			c.cyan(`File sizes ${beforeOrAfter} minification`),
			"--------------------------------",
		))
		.pipe(gulpLog(
			() => `PNG: \t${c.magenta(sizePlugins.png.prettySize)}`,
			() => `JPG: \t${c.magenta(sizePlugins.jpg.prettySize)}`,
			() => `SVG: \t${c.magenta(sizePlugins.svg.prettySize)}`,
			"--------------------------------",
			() => `Total: \t${c.magenta(sizePlugins.total.prettySize)}`,
			"",
		));
}

function analyzeBefore() {
	return analyze("before", sizes.before, true);
}

function analyzeAfter() {
	return analyze("after", sizes.after);
}

function generateBatches(cb) {
	log(`Splitting ${c.magenta(files.length)} files into batches of size ${c.magenta(BATCH_SIZE)}...`);
	batches = [];
	for (let i = 0; i < files.length; i += BATCH_SIZE) {
		batches.push(files.slice(i, i + BATCH_SIZE));
	}
	batches.reverse();
	log(`${c.magenta(batches.length)} batches generated.`);
	cb();
}

function minifyBatches(cb) {
	const tasks = batches.slice(0, 1).map((batch, i) => {
		function minifyTask() {
			log(`Minifying batch ${c.magenta(i + 1)} of ${c.magenta(batches.length)}`);
			return minifyBatch(batch);
		}

		minifyTask.displayName = `Minify batch ${i + 1} of ${batches.length}`;
		return minifyTask;
	});

	return gulp.series(...tasks, (seriesDone) => {
		seriesDone();
		cb();
	})();
}

function minifyBatch(batch) {
	return gulp.src(batch, { base: BASE_DIR })
		.pipe(cache(
			configureImagemin(),
			{
				name: "imagemin",
				fileCache: new cache.Cache({
					tmpDir: CACHE_DIR,
					cacheDirName: "imagemin-cache",
				}),
			},
		))
		.pipe(gulp.dest("../../"));
}

function configureImagemin() {
	return imagemin([
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
	]);
}

function sourceFiles() {
	return gulp.src([
		`${BASE_DIR}/**/*.{jpg,jpeg,png,svg}`,
		`!${BASE_DIR}/Tools/Node/node_modules/**/*`,
	]);
}

function count(message) {
	return gulpCount({ message, logger: log });
}

function gulpLog(...messages) {
	return through.obj(
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
}
