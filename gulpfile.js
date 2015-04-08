var gulp = require('gulp'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

gulp.task('process-scripts', function() {
  return gulp.src('js/*.js')
        .pipe(concat('main.js'))
        .pipe(gulp.dest('dest/'));
        // .pipe(rename({suffix: '.min'}))
        // .pipe(uglify())
        // .pipe(gulp.dest('dest/scripts/'));
});

gulp.task('watch', function() {
    gulp.watch('js/*.js', ['process-scripts'])
});
