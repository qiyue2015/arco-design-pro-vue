const path = require('path');
const fs = require('fs-extra');
const minimist = require('minimist');
const prettier = require('prettier');
const prettierOpt = require('./../arco-design-pro-vite/.prettierrc.js');

const params = minimist(process.argv.slice(2));
const isSimple = params.simple;

const templatePath = path.resolve(__dirname, '../arco-design-pro-vite');
const projectPath =
  params.projectPath ||
  path.resolve(__dirname, '../examples/arco-design-pro-vite');

const maps = {
  'src/api': 'src/api',
  'src/assets': 'src/assets',
  'src/components': 'src/components',
  'src/config': 'src/config',
  'src/hooks': 'src/hooks',
  'src/layout': 'src/layout',
  'src/locale': 'src/locale',
  'src/mock': 'src/mock',
  'src/router': 'src/router',
  'src/store': 'src/store',
  'src/types': 'src/types',
  'src/utils': 'src/utils',
  'src/views': 'src/views',
  '.eslintrc.js': '.eslintrc.js',
  '.eslintignore': '.eslintignore',
  '.stylelintrc.js': '.stylelintrc.js',
  '.prettierrc.js': '.prettierrc.js',
  'tsconfig.json': 'tsconfig.json',
  'plopfile.mjs': 'plopfile.mjs',
};

fs.copySync(templatePath, projectPath, {
  filter: (src) => !src.startsWith(path.resolve(templatePath, 'node_modules')),
});

const gitignorePath = path.resolve(
  __dirname,
  '../arco-design-pro-vite/gitignore'
);
const gitignorePath2 = path.resolve(
  __dirname,
  '../arco-design-pro-vite/.gitignore'
);

Object.keys(maps).forEach((src) => {
  if (typeof maps[src] === 'string') {
    fs.copySync(
      path.resolve(__dirname, '../arco-design-pro-vite', src),
      path.resolve(projectPath, maps[src])
    );
  }
  if (typeof maps[src] === 'object') {
    fs.copySync(
      path.resolve(__dirname, '../arco-design-pro-vite', src),
      path.resolve(projectPath, maps[src].dest),
      { filter: maps[src].filter }
    );
  }
  if (fs.existsSync(gitignorePath)) {
    fs.copySync(gitignorePath, path.resolve(projectPath, '.gitignore'));
  } else if (fs.existsSync(gitignorePath2)) {
    fs.copySync(gitignorePath2, path.resolve(projectPath, '.gitignore'));
  }
});

// simple mode
const simpleOptions = [
  {
    base: 'src/views',
    accurate: ['dashboard/monitor'], // Accurate to delete
    excludes: ['auth', 'dashboard', 'user', 'not-found', 'redirect'],
  },
  {
    base: 'src/api',
    excludes: ['dashboard', 'interceptor', 'user', 'message', 'file'],
  },
  {
    base: 'src/router/routes/modules',
    excludes: ['index', 'dashboard', 'user'],
  },
];

const regSum = /\/\*{2} simple( end)? \*\//g;
const matchReg =
  /(\/\*{2} simple \*\/)(?:(?!\/\*{2} simple end \*\/).|\n)*?\/\*{2} simple end \*\//gm;

const simplifyFiles = [
  'locale/en-US.ts',
  'locale/zh-CN.ts',
  'mock/index.ts',
  'router/routes/modules/dashboard.ts',
];

const runSimpleMode = () => {
  deleteFiles();
  simplifyFiles.forEach((el) => {
    const file = path.resolve(projectPath, path.join('src', el));
    const content = fs.readFileSync(file, 'utf8');
    const main = content.replace(matchReg, '');
    const formatTxt = prettier.format(main, {
      ...prettierOpt,
      parser: 'babel',
    });
    fs.writeFileSync(file, formatTxt, 'utf8');
  });
};

const deleteFiles = () => {
  simpleOptions.forEach((option) => {
    const baseDir = path.resolve(projectPath, option.base);
    const files = fs.readdirSync(baseDir);
    files.forEach((fileName) => {
      if (
        option.excludes &&
        option.excludes.find((name) =>
          new RegExp(`^${name}(.(ts|js|vue|json|jsx|tsx))?$`).test(fileName)
        )
      ) {
        return;
      }
      fs.removeSync(path.join(baseDir, fileName));
    });
    if (option.accurate) {
      option.accurate.forEach((el) => {
        fs.removeSync(path.join(baseDir, el));
      });
    }
  });
};

const runNormalMode = () => {
  simplifyFiles.forEach((el) => {
    const file = path.resolve(projectPath, path.join('src', el));
    const content = fs.readFileSync(file, 'utf8');
    const result = content.replace(regSum, '');
    const formatTxt = prettier.format(result, {
      ...prettierOpt,
      parser: 'babel',
    });
    fs.writeFileSync(file, formatTxt, 'utf8');
  });
};

if (isSimple) {
  runSimpleMode();
} else {
  runNormalMode();
}
