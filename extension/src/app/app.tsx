// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import { useState } from 'react';

export function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setResult('');
    setFile(e.target.files?.[0] ?? null);
  };

  const onAnalyze = async () => {
    if (!file) {
      setError('Please choose an image first.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setResult('');
      const form = new FormData();
      form.append('image', file);
      form.append('prompt', 'Provide a clinical description of the image.');
      const resp = await fetch('http://localhost:3333/analyze', {
        method: 'POST',
        body: form,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Request failed');
      setResult(data?.description || '');
    } catch (e: any) {
      setError(e?.message || 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  const onCaptureAndAnalyze = async () => {
    try {
      setLoading(true);
      setError('');
      setResult('');
      const chromeApi = (window as any).chrome;
      if (!chromeApi?.tabs?.captureVisibleTab) {
        throw new Error('Capture API not available. Use Upload instead.');
      }
      const dataUrl: string = await new Promise((resolve, reject) => {
        try {
          chromeApi.tabs.captureVisibleTab(null, { format: 'png' }, (url: string) => {
            const lastErr = chromeApi.runtime?.lastError;
            if (lastErr) reject(lastErr.message);
            else resolve(url);
          });
        } catch (e) {
          reject(e);
        }
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const form = new FormData();
      form.append('image', new File([blob], 'capture.png', { type: blob.type || 'image/png' }));
      form.append('prompt', 'Provide a clinical description of the captured page image.');
      const resp = await fetch('http://localhost:3333/analyze', { method: 'POST', body: form });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Request failed');
      setResult(json?.description || '');
    } catch (e: any) {
      setError(e?.message || 'Failed to capture/analyze image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 12, width: 320 }}>
      <h3>Dental Image Analyzer</h3>
      <input type="file" accept="image/*" onChange={onFileChange} />
      <button onClick={onAnalyze} disabled={!file || loading} style={{ marginLeft: 8 }}>
        {loading ? 'Analyzing…' : 'Analyze'}
      </button>
      <div style={{ marginTop: 8 }}>
        <button onClick={onCaptureAndAnalyze} disabled={loading}>Capture Tab & Analyze</button>
      </div>
      {error && (
        <p style={{ color: 'crimson', whiteSpace: 'pre-wrap' }}>{error}</p>
      )}
      {result && (
        <div>
          <h4>Result</h4>
          <p style={{ whiteSpace: 'pre-wrap' }}>{result}</p>
        </div>
      )}
    </div>
  );
}

export default App;
