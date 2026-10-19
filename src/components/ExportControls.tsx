import { SubnetResult } from '../features/calculator/types';
import { downloadText, exportFilename, summaryText, toCsv, toJson } from '../features/export/export-results';

interface Props {
  result: SubnetResult;
  onCopy: (text: string, label: string) => void;
  onNotify: (msg: string, bad?: boolean) => void;
}

export function ExportControls({ result, onCopy, onNotify }: Props) {
  const run = (ext: 'csv' | 'json') => {
    try {
      const text = ext === 'csv' ? toCsv(result) : toJson(result);
      downloadText(exportFilename(result, ext), text, ext === 'csv' ? 'text/csv;charset=utf-8' : 'application/json');
      onNotify(`Exported ${exportFilename(result, ext)}`);
    } catch {
      onNotify('Export failed in this browser.', true);
    }
  };
  return (
    <div className="actions" style={{ marginTop: 0 }}>
      <button className="btn" onClick={() => onCopy(summaryText(result), 'Summary')}>
        Copy summary
      </button>
      <button className="btn" onClick={() => run('json')}>
        Export JSON
      </button>
      <button className="btn" onClick={() => run('csv')}>
        Export CSV
      </button>
    </div>
  );
}
