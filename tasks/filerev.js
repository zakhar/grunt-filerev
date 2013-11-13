'use strict';
var crypto = require('crypto');
var path = require('path');
var fs = require('fs');

module.exports = function (grunt) {
  grunt.registerMultiTask('filerev', 'File revisioning based on content hashing', function () {
    var options = this.options({
      encoding: 'utf8',
      algorithm: 'md5',
      length: 8
    });
    var target = this.target;
    var move = true;
    var filerev = grunt.filerev || {summary: {}};

    grunt.util.async.forEach(this.files, function (el, next) {
      // If dest is furnished it should indicate a directory.
      if (el.dest) {
        try {
          var stat = fs.lstatSync(el.dest);
          if (stat && !stat.isDirectory()) {
            grunt.fail.fatal('Destination for target %s is not a directory', target);
          }
        } catch (err) {
          grunt.log.writeln('Destination dir ' + el.dest + ' does not exists for target ' + target + ': creating');
          grunt.file.mkdir(el.dest);
        }
        // We need to copy file as we now have a dest different from the src
        move = false;
      }

      el.src.forEach(function (file) {
        var dirname;
        var hash = crypto.createHash(options.algorithm).update(grunt.file.read(file), options.encoding).digest('hex');
        var ver = hash.slice(0, options.length);
        var newName = file + '?v=' + ver;
        var resultPath;

        if (!move) {
          dirname = el.dest;
          resultPath = path.resolve(dirname, path.basename(file));
          grunt.file.copy(file, resultPath);
        }

        filerev.summary[path.normalize(file)] = path.join(dirname, newName);
        grunt.log.writeln('✔ '.green + file + (' changed to ').grey + filerev.summary[file]);
      });
      next();
    }, this.async());

    grunt.filerev = filerev;
  });
};
