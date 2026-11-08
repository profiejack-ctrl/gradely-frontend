export interface ParsedStudentRow {
  studentNumber: string;
  name: string;
  rawName: string;
  email: string;
  defaultPassword: string;
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // Handle escaped double quote ("")
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function formatStudentName(rawName: string): string {
  const trimmed = rawName.replace(/^["']|["']$/g, '').trim();
  // Handle "Lastname, Firstname M." -> "Firstname M. Lastname"
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[1]} ${parts[0]}`;
    }
  }
  return trimmed;
}

export function parseMasterlistCSV(csvContent: string): ParsedStudentRow[] {
  if (!csvContent || typeof csvContent !== 'string') return [];

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/["'\s_-]/g, '')
  );

  let idColIdx = headers.findIndex(
    (h) =>
      h.includes('studentid') ||
      h.includes('studentnumber') ||
      h.includes('idnumber') ||
      h === 'id' ||
      h === 'studid'
  );

  let nameColIdx = headers.findIndex(
    (h) =>
      h.includes('studentname') ||
      h.includes('fullname') ||
      h === 'name' ||
      h === 'student'
  );

  // Fallback defaults if header columns were slightly different
  if (idColIdx === -1) idColIdx = 0;
  if (nameColIdx === -1) nameColIdx = 1;

  const results: ParsedStudentRow[] = [];
  const seenIds = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length <= Math.max(idColIdx, nameColIdx)) continue;

    const rawId = cols[idColIdx]?.replace(/["']/g, '').trim();
    const rawName = cols[nameColIdx]?.replace(/["']/g, '').trim();

    // Skip summary / header / overall rows
    if (!rawId || rawId === '-' || rawId.toLowerCase() === 'overall' || rawId.toLowerCase() === 'total') {
      continue;
    }
    if (!rawName || rawName.toLowerCase() === 'overall' || rawName.toLowerCase() === 'total') {
      continue;
    }

    // Must have at least some alphanumeric characters
    if (!/^[a-zA-Z0-9]+$/.test(rawId.replace(/[-_]/g, ''))) {
      continue;
    }

    // Deduplicate within the file
    if (seenIds.has(rawId)) continue;
    seenIds.add(rawId);

    const formattedName = formatStudentName(rawName);
    const email = `${rawId}@gradely.edu`;

    results.push({
      studentNumber: rawId,
      name: formattedName,
      rawName,
      email,
      defaultPassword: rawId,
    });
  }

  return results;
}
