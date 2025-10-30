// Uncomment this line to use CSS modules
import styles from './app.module.css';
import { useState, useEffect } from 'react';

export function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3333';

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setResult('');
    setFile(e.target.files?.[0] ?? null);
  };

  // Generate and clean up object URL for selected file preview
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl('');
    }
  }, [file]);

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
      const resp = await fetch(`${apiBaseUrl}/analyze`, {
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

  // Capture flow removed per request

  return (
    <div style={{ padding: 12, width: 320 }}>
      <h3 className={styles.heading}>Media Analyzer</h3>

      <div className={styles.row}>
        <input
          id="file-input"
          className={styles.fileInput}
          type="file"
          accept="image/*"
          onChange={onFileChange}
        />
        <label htmlFor="file-input" className={`${styles.button} ${styles.grow}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 19l4-6 4 5 3-4 7 9H3z" fill="currentColor"/>
          </svg>
          Choose Media
        </label>

        <button
          onClick={onAnalyze}
          disabled={!file || loading}
          className={`${styles.button} ${styles.primary} ${styles.grow}`}
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {previewUrl && (
        <div className={styles.preview}>
          <img src={previewUrl} alt="Selected" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }} />
        </div>
      )}

      {file && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#57606a' }}>
          Selected: {file.name}
        </div>
      )}

      {error && (
        <p style={{ color: 'crimson', marginTop: 8 }}>{error}</p>
      )}
      {result && (
        <div style={{ marginTop: 8 }}>
          <h4 style={{ margin: '8px 0' }}>Result</h4>
          <p className={styles.result}>{result}</p>
        </div>
      )}
    </div>
  );
}

export default App;
