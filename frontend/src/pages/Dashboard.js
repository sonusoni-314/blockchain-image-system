import React, { useState } from 'react';
import { getContract } from '../blockchain';

export default function Dashboard() {
  const [imageId, setImageId]   = useState('');
  const [metadata, setMetadata] = useState(null);
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const fetchData = async () => {
    if (!imageId) return;
    setLoading(true);
    setError('');
    setMetadata(null);
    setLogs([]);

    try {
      const contract = await getContract();

      const data = await contract.getImage(parseInt(imageId));
      setMetadata({
        owner:     data[0],
        viewLimit: data[3].toString(),
        viewCount: data[4].toString(),
        expiry:    new Date(data[5].toNumber() * 1000).toLocaleString(),
      });

      const filter = contract.filters.ImageViewed();
      const events = await contract.queryFilter(filter);
      const filtered = events.filter(
        e => e.args.imageId.toString() === imageId.toString()
      );

      setLogs(filtered.map(e => ({
        viewer:  e.args.viewer,
        granted: e.args.granted,
        block:   e.blockNumber,
      })));

    } catch (err) {
      setError('Error: ' + err.message);
    }

    setLoading(false);
  };

  const shortAddr = addr => addr ? addr.slice(0, 8) + '…' + addr.slice(-6) : '';

  return (
    <div className="page-wide">
      <h1 className="page-title">Audit log</h1>
      <p className="page-sub">
        Every access attempt is permanently recorded on the blockchain. Logs cannot be deleted or modified.
      </p>

      <div className="card">
        <div className="field">
          <label>Image ID</label>
        </div>
        <div className="input-row">
          <input
            placeholder="e.g. 0, 1, 2…"
            value={imageId}
            onChange={e => setImageId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData()}
          />
          <button className="btn" onClick={fetchData} disabled={loading || !imageId}>
            {loading ? 'Loading…' : 'Load log'}
          </button>
        </div>

        {error && (
          <div className="status-box danger">
            <span className="status-icon">✕</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {metadata && (
        <>
          <div className="meta-grid">
            <div className="meta-cell">
              <div className="label">Views used</div>
              <div className="value">{metadata.viewCount}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}> / {metadata.viewLimit}</span></div>
            </div>
            <div className="meta-cell">
              <div className="label">Expires</div>
              <div className="value" style={{ fontSize: 13, fontWeight: 500 }}>{metadata.expiry}</div>
            </div>
            <div className="meta-cell">
              <div className="label">Owner</div>
              <div className="value mono">{shortAddr(metadata.owner)}</div>
            </div>
          </div>

          <div className="log-header">
            {logs.length} access event{logs.length !== 1 ? 's' : ''} on-chain
          </div>

          {logs.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📋</div>
              <div className="empty-text">No access events recorded yet for this image.</div>
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`log-entry ${log.granted ? 'granted' : 'denied'}`}>
                <span className={`log-verdict ${log.granted ? 'granted' : 'denied'}`}>
                  {log.granted ? 'Granted' : 'Denied'}
                </span>
                <span className="log-address">{log.viewer}</span>
                <span className="log-block">block {log.block}</span>
              </div>
            ))
          )}
        </>
      )}

      {!metadata && !loading && (
        <div className="empty">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">Enter an Image ID to load its audit log</div>
        </div>
      )}
    </div>
  );
}