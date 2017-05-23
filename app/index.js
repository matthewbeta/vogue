// Modules
const fs = require('fs');
const path = require('path');
const Twig = require('twig');

if (!fs.existsSync('./.voguefile')) {
  throw new Error('.voguefile not found in root!');
}

// Locals
const CONFIG = JSON.parse(fs.readFileSync('./.voguefile', 'utf8')) || {};
const SECTIONS = getDirectories(CONFIG.templatePath);

// Utils
function getDirectories (srcpath) {
  return fs.readdirSync(srcpath)
  .filter(file => fs.lstatSync(path.join(srcpath, file)).isDirectory())
}

function readFiles(dirname, onFileContent, onError) {

  if (fs.existsSync(dirname) ) {

    let filenames = fs.readdirSync(dirname)

    filenames.forEach(function(filename) {
      let content = fs.readFileSync(dirname + filename, 'utf-8');
      onFileContent(filename, content);
    });
  }
}

function storeStuff(filename, content, store, section, type) {

  let moduleName = path.basename(filename, path.extname(filename));
  store[section][moduleName] = store[section][moduleName]  || {}
  store[section][moduleName][type] = content;

}

function vogue() {

  var data = {};

  var templateVars = {};

  SECTIONS.forEach(function(section, index) {
    data[section] = {};
    // DATA
    readFiles(`${CONFIG.dataPath}/${section}/`, function(filename, content) {
      templateVars[path.basename(filename, path.extname(filename))] = JSON.parse(content);
      storeStuff(filename, content, data, section, 'data')
    }, function(err) {
      throw err;
    });

    // TEMPLATES
    readFiles(`${CONFIG.templatePath}/${section}/`, function(filename, content) {
      // Compiled HTML
      Twig.renderFile(`${CONFIG.templatePath}/${section}/${filename}`, templateVars[path.basename(filename, path.extname(filename))], (err, html) => {
        if(err) {
          throw err
        }
          storeStuff(filename, html, data, section, 'html')
      });

      storeStuff(filename, content, data, section, 'template')
    }, function(err) {
      throw err;
    });

    // STYLES
    readFiles(`${CONFIG.stylePath}/${section}/`, function(filename, content) {
      storeStuff(filename, content, data, section, 'style')
    }, function(err) {
      throw err;
    });




  });
  console.log(data);
  fs.writeFileSync('blob.json', JSON.stringify(data), 'utf-8')


}

vogue()
