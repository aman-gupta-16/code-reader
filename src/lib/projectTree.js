export function flattenFileNodes(tree) {
  const result = [];

  function visit(node) {
    if (!node) {
      return;
    }

    if (node.type === 'file') {
      result.push(node);
      return;
    }

    if (node.type === 'folder' && Array.isArray(node.children)) {
      node.children.forEach((child) => visit(child));
    }
  }

  visit(tree);
  return result;
}
