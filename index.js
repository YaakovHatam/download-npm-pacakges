const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const packages = require(path.join(process.cwd(), './package-lock.json'));
const packagesDir = path.join(process.cwd(), 'npm-packages');
const flattedPackagesFile = path.join(process.cwd(), 'flatten-packages.json');

const getAllLinks = require('./src/get-all-links');
const downloadPackages = require('./src/download-packages');
const saveFilePath = require('./src/common').saveFilePath;

function checkIntegrity(packagesList) {
   const files = fs.readdirSync(packagesDir, { withFileTypes: true }).filter(f => f.isFile()).map(f => f.name);

   const totalFiles = files.length;
   let badfiles = 0;

   files.forEach(file => {
      const fileBuffer = fs.readFileSync(path.join(packagesDir, file));

      const hashSum = crypto.createHash('sha512');
      hashSum.update(fileBuffer);
      const hex = 'sha512-' + hashSum.digest('base64');

      const package = packagesList.find(p => saveFilePath('', p.resolved) === file);
      if (!package) return;

      const packageInetgrity = package.integrity;

      if (hex !== packageInetgrity) {
         badfiles++;
         fs.unlinkSync(path.join(packagesDir, file));
      }
   });
   console.log('package.lock contains', packagesList.length, 'pacakges')
   console.log('from total of', totalFiles, 'tgz packages, theres', badfiles, 'bad files');

}

async function listPackaes() {
   const packagesList = getAllLinks(packages);
   fs.writeFileSync(flattedPackagesFile, JSON.stringify(packagesList));
   console.log('total of', packagesList.length, 'packages');
   console.log('saved under', flattedPackagesFile);
   return flattedPackagesFile;
}

async function download(packagesDir) {
   const packagesList = require(flattedPackagesFile);

   if (!fs.existsSync(packagesDir)) {
      fs.mkdirSync(packagesDir);
   }

   const files = fs.readdirSync(packagesDir, { withFileTypes: true }).filter(f => f.isFile()).map(f => f.name);

   const filteredPackagesList = packagesList
      .map(p => p.resolved)
      .filter(Boolean)
      .filter(p => !files.includes(saveFilePath('', p)));

   console.log('total of', filteredPackagesList.length, 'to download');
   return downloadPackages(filteredPackagesList, packagesDir);
}

async function integrityCheck() {
   const packagesList = require(flattedPackagesFile);

   const packagesListHasIntegrity = packagesList.filter(p => p.integrity && p.resolved);
   checkIntegrity(packagesListHasIntegrity);
   return '';

}

module.exports = {
   listPackaes,
   download,
   integrityCheck
};