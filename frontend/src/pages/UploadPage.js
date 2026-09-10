import React, { useState } from 'react';
import axios from 'axios';

export default function UploadPage() {
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [viewLimit, setViewLimit] = useState(3);
  const [daysValid, setDaysValid] = useState(7);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setError('');
    setResult(null);
    const type = selected.type.startsWith('video/') ? 'video' : 'image';
    setMediaType(type);
    const url = URL.createObjectURL(selected);
    setPreview({ url, type });
  };

  const handleUpload = async () => {
    if (!file) return setError('Please select an image or video file first.');
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('viewLimit', viewLimit);
      formData.append('daysValid', daysValid);
      const res = await axios.post('http://localhost:3001/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <h1 className="page-title">Upload media</h1>
      <p className="page-sub">
        Images and videos are stored on IPFS. Access rules are enforced by a smart contract — the file never transfers directly to the viewer.
      </p>

      <div className="card">
        <div className="field">
          <label>Image or video file</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
            onChange={handleFileChange}
          />
        </div>

        {preview && (
          <div style={{ marginBottom: '1.25rem' }}>
            {preview.type === 'video' ? (
              <video
                src={preview.url}
                controls
                style={{ width: '100%', borderRadius: 7, border: '1px solid var(--border)', maxHeight: 280, background: '#000' }}
              />
            ) : (
              <img
                src={preview.url}
                alt="Preview"
                style={{ width: '100%', borderRadius: 7, border: '1px solid var(--border)', maxHeight: 280, objectFit: 'contain', background: 'var(--navy)' }}
              />
            )}
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>
              {mediaType === 'video' ? '🎬' : '🖼'} {file?.name} · {(file?.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        )}

        <div className="field-row">
          <div className="field">
            <label>View limit</label>
            <input type="number" value={viewLimit} min="1" max="100" onChange={e => setViewLimit(e.target.value)} />
          </div>
          <div className="field">
            <label>Valid for (days)</label>
            <input type="number" value={daysValid} min="1" max="365" onChange={e => setDaysValid(e.target.value)} />
          </div>
        </div>

        {error && (
          <div className="status-box danger">
            <span className="status-icon">✕</span>
            <span>{error}</span>
          </div>
        )}

        <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
          {loading ? (mediaType === 'video' ? 'Uploading video… this may take a moment' : 'Uploading…') : 'Upload media'}
        </button>

        {loading && mediaType === 'video' && (
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>
            Large videos may take 30–60 seconds to pin to IPFS
          </p>
        )}
      </div>

      {result && (
        <div className="result-block">
          <div className="status-box success" style={{ marginTop: 0, marginBottom: '1rem' }}>
            <span className="status-icon">✓</span>
            <span>{result.mediaType === 'video' ? 'Video' : 'Image'} registered on blockchain. Share the ID with your viewer.</span>
          </div>

          <div className="result-label">Media ID</div>
          <div className="result-value large">{result.imageId}</div>
          <div className="result-divider" />

          <div className="result-label">Type</div>
          <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
            {result.mediaType === 'video' ? '🎬 Video' : '🖼 Image'}
          </div>

          <div className="result-label">SHA-256 hash (stored on-chain)</div>
          <div className="result-value">{result.sha256Hash}</div>
          <div className="result-divider" />

          <div className="result-label">IPFS CID</div>
          <div className="result-value">{result.ipfsCID}</div>
          <div className="result-divider" />

          <div style={{ display: 'flex', gap: '2rem' }}>
            <div>
              <div className="result-label">View limit</div>
              <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, marginTop: 2 }}>{viewLimit} views</div>
            </div>
            <div>
              <div className="result-label">Expires after</div>
              <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, marginTop: 2 }}>{daysValid} days</div>
            </div>
          </div>
        </div>
      )}

      {!result && !preview && (
        <div className="card" style={{ borderStyle: 'dashed', opacity: 0.5 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
            Supports JPEG, PNG, GIF, WebP, MP4, WebM, MOV<br />
            After upload, go to Remix → <code style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>grantAccess</code> to whitelist the viewer's wallet.
          </p>
        </div>
      )}
    </div>
  );
}