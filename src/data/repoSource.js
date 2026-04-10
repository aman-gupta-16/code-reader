const ROOT_LABEL = 'koonba_FrontendApp-main';
import manifest from './koonbaManifest.json';

function getFileName(filePath) {
  const segments = filePath.split('/');
  return segments[segments.length - 1] ?? filePath;
}

function getExtension(filePath) {
  const fileName = getFileName(filePath);
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex <= 0) {
    return '';
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
}

function detectLanguage(filePath) {
  const extension = getExtension(filePath);
  const fileName = getFileName(filePath);

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

  if (['swift'].includes(extension)) {
    return 'swift';
  }

  if (['properties', 'config', 'pbxproj', 'lock'].includes(extension)) {
    return 'properties';
  }

  return 'javascript';
}

function createFolderNode(name, path) {
  return {
    type: 'folder',
    name,
    path,
    children: [],
  };
}

function createFileNode(path) {
  return {
    type: 'file',
    path,
    name: getFileName(path),
    language: detectLanguage(path),
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

function buildTree(paths) {
  const root = createFolderNode(ROOT_LABEL, ROOT_LABEL);

  paths.forEach((relativePath) => {
    const parts = relativePath.split('/');
    let current = root;

    for (let index = 0; index < parts.length - 1; index += 1) {
      const part = parts[index];
      const folderPath = parts.slice(0, index + 1).join('/');

      let folderNode = current.children.find((child) => child.type === 'folder' && child.name === part);
      if (!folderNode) {
        folderNode = createFolderNode(part, folderPath);
        current.children.push(folderNode);
      }

      current = folderNode;
    }

    current.children.push(createFileNode(relativePath));
  });

  sortTree(root);
  return root;
}

const repoFiles = manifest.files
  .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }))
  .map((path) => ({
    path,
    name: getFileName(path),
    language: detectLanguage(path),
  }));

const repoTree = buildTree(repoFiles.map((file) => file.path));

async function loadRepoFile(relativePath) {
  if (!manifest.files.includes(relativePath)) {
    throw new Error('File content is not available for this item.');
  }

  const encodedPath = relativePath.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  const response = await fetch(`/${ROOT_LABEL}/${encodedPath}`);

  if (!response.ok) {
    throw new Error('Failed to read file from generated static assets.');
  }

  return response.text();
}

const viewerMeta = {
  projectName: 'Client Review Panel',
  clientName: 'Koonba',
  expiresOn: '2026-05-09T00:00:00.000Z',
};

export {
  ROOT_LABEL,
  loadRepoFile,
  repoFiles,
  repoTree,
  viewerMeta,
};
