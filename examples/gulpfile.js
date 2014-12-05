var gulp = require('gulp'),
    gutil = require('gulp-util'),
    react = require('gulp-react'),
    cache = require('gulp-cached'),
    jshint = require('gulp-jshint'),
    source = require('vinyl-source-stream'),
    browserify = require('browserify'),
    watchify = require('watchify'),
    nodemon = require('nodemon'),
    browserSync = require('browser-sync'),
    serverStarted = false,

configs = {
    nodemon_restart_delay: 200,
    nodemon_delay: 2000,
    gulp_watch: {debounceDelay: 2000},
    watchify: {debug: true, delay: 2000},
    jshint_jsx: {quotmark: false}
},

build_files = {
    js: ['actions/*.js', 'stores/*.js'],
    jsx: ['components/*.jsx']
},

bundleAll = function (b) {
    return b.bundle()
    .on('error', function (E) {
        gutil.log('[browserify ERROR]', gutil.colors.red(E));
    })
    .pipe(source('main.js'))
    .pipe(gulp.dest('static/js/'))
    .on('end', function () {
        setTimeout(function () {
            nodemon.emit('restart');
        }, configs.nodemon_restart_delay);
    });
},

buildApp = function (watch) {
    var b = browserify(process.cwd() + '/app.js', {
        cache: {},
        packageCache: {},
        require: './components/Html.jsx',
        standalone: 'Fluxex',
        fullPaths: watch,
        debug: watch
    });

    b.transform('reactify');

    if (watch) {
        b = watchify(b, configs.watchify);
        b.on('update', function (F) {
            gutil.log('[browserify] ' + F[0] + ' updated');
            bundleAll(b);
        });
    }

    return bundleAll(b);
};

gulp.task('build_app', function () {
    return buildApp(false);
});

gulp.task('watch_app', function () {
    return buildApp(true);
});

gulp.task('watch_flux_js', ['lint_flux_js'], function () {
    gulp.watch(build_files.js, configs.gulp_watch, ['lint_flux_js']);
});

gulp.task('lint_flux_js', function () {
    return gulp.src(build_files.js)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('watch_jsx', ['lint_jsx'], function () {
    gulp.watch(build_files.jsx, configs.gulp_watch, ['lint_jsx']);
});

gulp.task('lint_jsx', function () {
    return gulp.src(build_files.jsx)
    .pipe(react())
    .on('error', function (E) {
        gutil.log('[jsx ERROR]', gutil.colors.red(E.fileName));
        gutil.log('[jsx ERROR]', gutil.colors.red(E.message));
    })
    .pipe(jshint(configs.jshint_jsx))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('nodemon_server', ['watch_flux_js', 'watch_jsx', 'watch_app'], function() {
    nodemon({
        ignore: '*',
        script: require(process.cwd() + '/package.json').main,
        ext: 'do_not_watch'
    })
    .on('log', function (log) {
        gutil.log(log.colour);
    })
    .on('start', function () {
        if (serverStarted) {
            setTimeout(browserSync.reload, configs.nodemon_delay);
        } else {
            browserSync.init(null, {
                proxy: 'http://localhost:3000',
                files: ['static/css/*.css'],
                port: 3001,
                online: false,
                open: false
            });
            serverStarted = true;
        }
    });
});

gulp.task('develop', ['nodemon_server']);
gulp.task('buildall', ['lint_flux_js', 'lint_jsx', 'build_app']);
gulp.task('default',['buildall']);
