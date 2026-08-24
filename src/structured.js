import { buildReport } from './report.js';

function joinJsonPath(base, key) {
  if (typeof key === 'number') return `${base}[${key}]`;
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `${base}.${key}` : `${base}[${JSON.stringify(key)}]`;
}

export function analyzeJsonText(text, options = {}) {
  const value = JSON.parse(text);
  const fields = [];

  function visit(node, jsonPath = '$') {
    if (typeof node === 'string') {
      const report = buildReport(node, options.report ?? {});
      fields.push({ path: jsonPath, value: node, report });
      return report.transformations.cleanedText;
    }
    if (Array.isArray(node)) return node.map((item, index) => visit(item, joinJsonPath(jsonPath, index)));
    if (node && typeof node === 'object') {
      return Object.fromEntries(Object.entries(node).map(([key, item]) => [key, visit(item, joinJsonPath(jsonPath, key))]));
    }
    return node;
  }

  const cleanedValue = visit(value);
  return {
    format: 'json',
    fieldsAnalyzed: fields.length,
    fields,
    cleanedValue
  };
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }

  if (quoted) throw new Error('Unterminated quoted CSV field.');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function escapeCsvField(value) {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

export function serializeCsv(rows) {
  return rows.map((row) => row.map((field) => escapeCsvField(String(field))).join(',')).join('\n');
}

export function analyzeCsvText(text, options = {}) {
  const rows = parseCsv(text);
  const fields = [];
  const cleanedRows = rows.map((row, rowIndex) => row.map((value, columnIndex) => {
    const report = buildReport(value, options.report ?? {});
    fields.push({ row: rowIndex, column: columnIndex, value, report });
    return report.transformations.cleanedText;
  }));

  return {
    format: 'csv',
    rows: rows.length,
    fieldsAnalyzed: fields.length,
    fields,
    cleanedRows,
    cleanedText: serializeCsv(cleanedRows)
  };
}
