function summarizeJSON(obj,indent = 0){
  const indentStr = '  '.repeat(indent);
  let lines = [];

  // Helper to safely stringify simple values
  const safeStringify = val => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'object') return '[Object]';
    return val.toString();
  };

  // If it's an array, iterate items
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      lines.push(`${indentStr}- Item ${idx + 1}:`);
      lines.push(summarizeJSON(item, indent + 1));
    });
    return lines.join('\n');
  }

  // If it's an object
  if (typeof obj === 'object' && obj !== null) {
    // Special handling for main keys in your structure
    if ('type' in obj) {
      lines.push(`${indentStr}Component Type: ${obj.type}`);
    }

    // Iterate keys
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'type') continue; // Already handled

      if (value === null || value === undefined) {
        lines.push(`${indentStr}${key}: ${safeStringify(value)}`);
      } else if (typeof value === 'object') {
        // For arrays or objects, recurse with label
        if (Array.isArray(value)) {
          lines.push(`${indentStr}${key}:`);
          if (value.length === 0) {
            lines.push(`${indentStr}  (empty array)`);
          } else {
            value.forEach((item, idx) => {
              lines.push(`${indentStr}  - Item ${idx + 1}:`);
              lines.push(summarizeJSON(item, indent + 2));
            });
          }
        } else {
          lines.push(`${indentStr}${key}:`);
          lines.push(summarizeJSON(value, indent + 1));
        }
      } else {
        lines.push(`${indentStr}${key}: ${safeStringify(value)}`);
      }
    }
    return lines.join('\n');
  }

  // For primitive values
  return `${indentStr}${safeStringify(obj)}`;
}

module.exports = summarizeJSON;
