import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Fix ES module imports in built files
const fixImports = (filePath) => {
  try {
    let content = readFileSync(filePath, 'utf8');
    
    // Add .js extensions to relative imports
    content = content.replace(/from ['"](\.\/.+?)['"];/g, "from '$1.js';");
    content = content.replace(/import ['"](\.\/.+?)['"];/g, "import '$1.js';");
    
    writeFileSync(filePath, content);
    console.log(`Fixed imports in ${filePath}`);
  } catch (error) {
    console.log(`No fixes needed for ${filePath}`);
  }
};

// List of files to fix (add more as needed)
const filesToFix = [
  'dist/index-mongodb.js',
  'dist/routes-mongodb.js',
  'dist/mongodb.js'
];

filesToFix.forEach(fixImports);
console.log('Build fixes completed!');