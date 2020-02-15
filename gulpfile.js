const gulp = require('gulp');
const sass = require('gulp-sass');
const del = require('del');
const concat = require('gulp-concat');
const gulpif = require('gulp-if');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const sourcemaps = require('gulp-sourcemaps');
const zip = require('gulp-zip');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');

let prod = process.env.NODE_ENV === 'production';

const paths = {
    build: {
        js: 'assets/js/',
        css: 'assets/css/',
    },
    src: {
        js: 'src/js/',
        scss: 'src/scss/',
    },
    watch: {
        js: 'src/js/**/*',
        scss: 'src/scss/**/*'
    },
    clean: [
        'assets/js/**/*',
        'assets/css/**/*',
    ],
};

const postCssPlugins = [
    autoprefixer(),
];

if (prod) {
    postCssPlugins.push(cssnano());
}

gulp.task('clean', function () {
    return del(paths.clean);
});

gulp.task('scss', function () {
    return gulp.src([
        paths.src.scss + 'styles.scss',
    ])
        .pipe(gulpif(!prod, sourcemaps.init()))
        .pipe(sass({
            noCache: true,
            style: 'compressed',
            includePaths: [
                'node_modules',
            ]
        }))
        .pipe(postcss(postCssPlugins))
        .pipe(concat('styles.min.css'))
        .pipe(gulpif(!prod, sourcemaps.write('.')))
        .pipe(gulp.dest(paths.build.css));
});

const jsUglifyCondition = function (file) {
    if (!prod) {
        return false;
    }

    if (file.path.match(/node_modules/g)) {
        return false;
    }

    return true;
};

gulp.task('js', function () {
    return gulp.src([
        paths.src.js + 'scripts.js',
    ])
        .pipe(gulpif(!prod, sourcemaps.init()))
        .pipe(babel())
        .pipe(gulpif(jsUglifyCondition, uglify({mangle: false})))
        .pipe(concat('scripts.min.js'))
        .pipe(gulpif(!prod, sourcemaps.write('.')))
        .pipe(gulp.dest(paths.build.js));
});

const scssTasks = gulp.parallel('scss');
const jsTasks = gulp.parallel('js');

gulp.task('watch', gulp.series(
    'clean',
    gulp.parallel(scssTasks, jsTasks),
    gulp.parallel(function () {
        gulp.watch(paths.watch.scss, scssTasks);
        gulp.watch(paths.watch.js, jsTasks);
    })));

gulp.task('zip', function () {
    return gulp.src([
        './assets/**/*',
        '!./assets/manifest/',
        '!./assets/manifest/**/*',
        '/content/**/**',
        '/layouts/**/**',
        '/pages/**/**',
        '/partials/**/**',
        './theme.yaml',
    ], {base: '.'})
        .pipe(zip('theme.zip'))
        .pipe(gulp.dest('.'));
});

gulp.task('build', gulp.series('clean', gulp.parallel(scssTasks, jsTasks), 'zip'));

gulp.task('default', gulp.series('build'));
