import path from 'path';
import crypto from 'crypto';

const TEXT_EXTENSIONS = new Set([
  'js',
  'jsx',
  'ts',
  'tsx',
  'json',
  'css',
  'scss',
  'sass',
  'html',
  'md',
  'xml',
  'yml',
  'yaml',
  'java',
  'kt',
  'gradle',
  'properties',
  'swift',
  'rb',
  'txt',
  'config',
  'plist',
  'pbxproj',
  'storyboard',
  'podspec',
  'lock',
  'sh',
  'bat',
]);

const TEXT_BASENAMES = new Set([
  'Gemfile',
  'Podfile',
  'gradlew',
  'gradlew.bat',
  '.gitignore',
  '.watchmanconfig',
  '.eslintrc.js',
  '.prettierrc.js',
  '.xcode.env',
]);

export function normalizeRelativePath(value, fallbackName) {
  const incoming = typeof value === 'string' ? value : '';
  const replaced = incoming.replaceAll('\\', '/').trim();
  const safe = replaced.replace(/^\.+\//, '').replace(/^\//, '');

  if (!safe) {
    return fallbackName;
  }

  return safe;
}

export function detectLanguage(filePath) {
  const extension = path.extname(filePath).slice(1).toLowerCase();
  const fileName = path.basename(filePath);

  if (fileName === 'Gemfile' || fileName === 'Podfile') {
    return 'ruby';
  }

  if (fileName === 'gradlew' || fileName === 'gradlew.bat') {
    return 'bash';
  }

  if (fileName === '.gitignore' || fileName === '.watchmanconfig') {
    return 'properties';
  }

  if (['js', 'jsx', 'ts', 'tsx'].includes(extension)) {
    return 'javascript';
  }

  if (extension === 'json') {
    return 'json';
  }

  if (['css', 'scss', 'sass'].includes(extension)) {
    return 'css';
  }

  if (['html', 'xml', 'plist', 'storyboard', 'xcworkspacedata'].includes(extension)) {
    return 'html';
  }

  if (['yml', 'yaml'].includes(extension)) {
    return 'yaml';
  }

  if (['md', 'txt'].includes(extension)) {
    return 'markdown';
  }

  if (['rb', 'podspec'].includes(extension)) {
    return 'ruby';
  }

  if (['java', 'kt', 'gradle'].includes(extension)) {
    return 'java';
  }

  if (['sh', 'bat'].includes(extension)) {
    return 'bash';
  }

  if (extension === 'swift') {
    return 'swift';
  }

  if (['properties', 'config', 'pbxproj', 'lock'].includes(extension)) {
    return 'properties';
  }

  return 'javascript';
}

export function isTextFile(relativePath) {
  const normalized = normalizeRelativePath(relativePath, relativePath);
  const extension = path.extname(normalized).slice(1).toLowerCase();
  const fileName = path.basename(normalized);

  if (TEXT_BASENAMES.has(fileName)) {
    return true;
  }

  if (fileName === 'config' && normalized.includes('.bundle/')) {
    return true;
  }

  return TEXT_EXTENSIONS.has(extension);
}

function createFolderNode(name, currentPath) {
  return {
    type: 'folder',
    name,
    path: currentPath,
    children: [],
  };
}

function sortTree(node) {
  if (node.type !== 'folder') {
    return;
  }

  node.children.sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === 'folder' ? -1 : 1;
    }

    return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
  });

  node.children.forEach((child) => sortTree(child));
}

export function buildFileTree(files) {
  const root = createFolderNode('project', 'project');

  files.forEach((file) => {
    const normalizedPath = normalizeRelativePath(file.relativePath, file.originalName);
    const parts = normalizedPath.split('/');
    let current = root;

    for (let index = 0; index < parts.length - 1; index += 1) {
      const folderName = parts[index];
      const folderPath = parts.slice(0, index + 1).join('/');

      let folder = current.children.find((child) => child.type === 'folder' && child.name === folderName);
      if (!folder) {
        folder = createFolderNode(folderName, folderPath);
        current.children.push(folder);
      }

      current = folder;
    }

    current.children.push({
      type: 'file',
      id: String(file._id),
      name: parts[parts.length - 1],
      path: normalizedPath,
      language: detectLanguage(normalizedPath),
      size: file.size,
    });
  });

  sortTree(root);
  return root;
}

export function createShareToken() {
  return crypto.randomBytes(24).toString('hex');
}
