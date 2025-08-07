function summarizeJSON(obj) {
  let components = [];

  function traverse(node) {
    if (Array.isArray(node)) {
      node.forEach(traverse);
    } else if (typeof node === 'object' && node !== null) {
      if (node.type && typeof node.type === 'string') {
        // Found a component
        const lines = [`Component Type: ${node.type}`];

        for (const [key, value] of Object.entries(node)) {
          if (key === 'type') continue;

          if (typeof value === 'object') {
            // Avoid printing [Object] or nested stuff directly
            continue;
          }

          lines.push(`${key}: ${value}`);
        }

        components.push(lines.join('\n'));
      }

      // Recurse into children
      for (const val of Object.values(node)) {
        traverse(val);
      }
    }
  }

  traverse(obj);

  // Format as numbered list
  return components.map((block, i) => `${i + 1}. ${block}`).join('\n\n');
}

module.exports = summarizeJSON