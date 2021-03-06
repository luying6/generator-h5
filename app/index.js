const fs = require('fs');
const Generator = require('yeoman-generator');

const utils = {
  identity(s) {
    return s;
  },
  commentLines(str) {
    return str.split('\n')
    .map(line => {
      line = line.trimRight();
      return line ? line.replace(/^\s*/, m => `${m}# `) : line;
    })
    .join('\n');
  },
};

module.exports = class Html5Generator extends Generator {
  prompting() {
    return this.prompt([
      {
        name: 'name',
        type: 'input',
        message: 'Your project name',
        default: this.appname,
      },
      {
        name: 'description',
        type: 'input',
        message: 'Description of your project',
      },
      {
        name: 'es6',
        type: 'confirm',
        message: 'Would you like to use ES6?',
      },
      {
        name: 'cssCompat',
        type: 'list',
        message: 'How many browsers would you like to support for CSS?',
        choices: [{
          name: 'only the latest modern browsers',
          value: '',
        }, {
          name: 'include older browsers since IE 9',
          value: 'ie9',
        }],
      }
    ])
    .then(answers => {
      this.state = Object.assign({
        utils,
      }, answers);
    });
  }

  app() {
    const rootFileDir = this.templatePath('root-files');
    fs.readdirSync(rootFileDir)
    .forEach(name => {
      if (name.startsWith('.')) return;
      this.fs.copy(`${rootFileDir}/${name}`, this.destinationPath(name.replace(/^_/, '.')));
    });
    ['package.json', 'gulpfile.js', 'browserslist', 'README.md', 'src/index.html']
    .concat(this.state.es6 ? ['_babelrc'] : [])
    .forEach(name => {
      this.fs.copyTpl(this.templatePath(name), this.destinationPath(name.replace(/^_/, '.')), this.state);
    })
    this.fs.copy(this.templatePath('_git_prepush'), this.destinationPath('.git/hooks/prepush'));
    this.fs.copyTpl(this.templatePath('src/app.js'), this.destinationPath('src/app.js'), this.state);
    this.fs.copy(this.templatePath('src/style.css'), this.destinationPath('src/style.css'));
    // this.mkdir('src/assets');
  }

  install() {
    const deps = [
      'browser-sync',
      'del',
      'gulp',
      'gulp-eslint',
      'gulp-htmlmin',
      'gulp-plumber',
      'gulp-postcss',
      'precss',
      'autoprefixer',
      'cssnano',
      'gulp-uglify',
      'gulp-util',
      'gulp-assets-injector',
    ];
    if (this.state.es6) {
      deps.push(...[
        'gulp-rollup',
        'rollup-plugin-babel',
        'rollup-plugin-node-resolve',
        'rollup-plugin-commonjs',
        'babel-runtime',
        'babel-preset-env',
        'babel-plugin-transform-runtime',
      ]);
    }
    this.yarnInstall(deps, {dev: true});
  }
};
