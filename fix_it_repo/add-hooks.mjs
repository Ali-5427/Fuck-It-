import fs from 'fs';
import path from 'path';

const components = [
  { file: 'FindingDetailModal.tsx', prop: '!!finding' },
  { file: 'AccountModal.tsx', prop: 'isOpen' },
  { file: 'PrivacyStringsModal.tsx', prop: 'isOpen' },
  { file: 'AuditDiffModal.tsx', prop: 'isOpen' },
  { file: 'AuthModal.tsx', prop: 'isOpen' },
  { file: 'SupportModal.tsx', prop: 'isOpen' },
  { file: 'UploadModal.tsx', prop: 'isOpen' },
  { file: 'StatusPageModal.tsx', prop: 'isOpen' },
  { file: 'Sidebar.tsx', prop: 'isMobileOpen' },
  { file: 'ReviewChecklist.tsx', prop: 'isOpen' },
  { file: 'SubmissionReportModal.tsx', prop: 'isOpen' }
];

for (const { file, prop } of components) {
  const filePath = path.join(process.cwd(), 'src', 'components', file);
  if (!fs.existsSync(filePath)) {
    console.warn('Skipping', file, 'not found');
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('useScrollLock')) {
    // Add import
    const importRegex = /import\s+.*?from\s+['"].*?['"];/g;
    let lastImportIndex = 0;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      lastImportIndex = match.index + match[0].length;
    }
    content = content.slice(0, lastImportIndex) + "\nimport { useScrollLock } from '../hooks/useScrollLock';" + content.slice(lastImportIndex);
    
    // Add hook call
    // Usually it's after `const ... = ({ ... }) => {`
    const componentStartRegex = /(const \w+:\s*React\.FC<.*?>\s*=\s*\([^)]*\)\s*=>\s*\{|export function \w+\([^)]*\)\s*\{)/;
    const componentMatch = content.match(componentStartRegex);
    if (componentMatch) {
      const insertIndex = componentMatch.index + componentMatch[0].length;
      content = content.slice(0, insertIndex) + `\n  useScrollLock(${prop});` + content.slice(insertIndex);
    } else {
      console.warn('Could not find start for', file);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Processed', file);
  }
}
