const gulp = require('gulp');
const stylus = require('gulp-stylus');
const rename = require('gulp-rename');

gulp.task('watch', () => {
  gulp.watch(['app.styl', 'pages/**/*.styl'], event => {
    let index = event.path.lastIndexOf('/');
    let prefix = event.path.substr(0, index);
    let filename = event.path.substr(index + 1);
    filename = filename.substr(0, filename.lastIndexOf('.'));
    gulp.src(event.path)
      .pipe(stylus())
      .pipe(rename({
        basename: filename,
        extname: '.wxss',
      }))
      .pipe(gulp.dest(prefix));
  });
});
