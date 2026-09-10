import React, { useState } from 'react';
import axios from 'axios';
import { getContract } from '../blockchain';

export default function ViewPage() {
  const [imageId, setImageId]       = useState('');
  const [mediaUrl, setMediaUrl]     = useState(null);
  const [mediaType, setMediaType]   = useState('image');
  const [status, setStatus]         = useState('');
  const [statusType, setStatusType] = useState('info');
  const [tampered, setTampered]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [hashing, setHashing]       = useState(false);

  const handleView = async () => {
    if (!imageId) return;
    setLoading(true);
    setStatus('Checking blockchain permissions…');
    setStatusType('info');
    setMediaUrl(null);
    setTampered(null);

    try {
      const contract = await getContract();
      if (!contract) { setLoading(false); return; }

      const tx = await contract.viewImage(parseInt(imageId));
      const receipt = await tx.wait();

      const event = receipt.events && receipt.events.find(e => e.event === 'ImageViewed');
      let wasGranted = true;
      if (event && event.args) wasGranted = event.args.granted;

      if (!wasGranted) {
        setStatus('Access denied — view limit reached, access expired, or wallet not authorised.');
        setStatusType('danger');
        setLoading(false);
        return;
      }

      setStatus('Access granted. Fetching media from IPFS…');
      setStatusType('info');

      // Get metadata
      const metaRes = await axios.get(`http://localhost:3001/metadata/${imageId}`);
      const { ipfsCID, sha256Hash } = metaRes.data;

      if (!ipfsCID) {
        setStatus('Could not find media CID in metadata.');
        setStatusType('danger');
        setLoading(false);
        return;
      }

      // Fetch the media file
      const mediaRes = await axios.get(
        `http://localhost:3001/media/${ipfsCID}`,
        { responseType: 'arraybuffer' }
      );

      // Detect media type from Content-Type header
      const contentType = mediaRes.headers['content-type'] || 'image/jpeg';
      const isVideo = contentType.startsWith('video/');
      setMediaType(isVideo ? 'video' : 'image');

      const buffer = mediaRes.data;

      // Tamper detection — note: large videos may take a few seconds
      if (isVideo) {
        setStatus('Access granted. Verifying hash… (may take a moment for large videos)');
        setHashing(true);
      }

      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray  = Array.from(new Uint8Array(hashBuffer));
      const computed   = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setHashing(false);

      if (computed === sha256Hash) {
        setTampered(false);
        setStatus('Hash verified — ' + (isVideo ? 'video' : 'image') + ' is authentic.');
        setStatusType('success');
      } else {
        setTampered(true);
        setStatus('Hash mismatch — this ' + (isVideo ? 'video' : 'image') + ' has been tampered with.');
        setStatusType('danger');
      }

      // Create blob URL for display
      const blob = new Blob([buffer], { type: contentType });
      setMediaUrl(URL.createObjectURL(blob));

    } catch (err) {
      setHashing(false);
      const msg = err.response
        ? `Backend error ${err.response.status}: ${JSON.stringify(err.response.data)}`
        : err.message;
      setStatus('Error: ' + msg);
      setStatusType('danger');
    }

    setLoading(false);
  };

  const statusIcon = { info: '◌', success: '✓', danger: '✕', warn: '⚠' }[statusType];

  return (
    <div className="page">
      <h1 className="page-title">View media</h1>
      <p className="page-sub">
        Enter the Media ID shared with you. MetaMask will ask you to sign a blockchain transaction — this logs your access on-chain and enforces the view limit.
      </p>

      <div className="card">
        <div className="field">
          <label>Media ID</label>
        </div>
        <div className="input-row">
          <input
            placeholder="e.g. 0, 1, 2…"
            value={imageId}
            onChange={e => setImageId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleView()}
          />
          <button className="btn" onClick={handleView} disabled={loading || !imageId}>
            {loading ? 'Checking…' : 'Request access'}
          </button>
        </div>

        {status && (
          <div className={`status-box ${statusType}`}>
            <span className="status-icon">{hashing ? '⏳' : statusIcon}</span>
            <span>{status}</span>
          </div>
        )}
      </div>

      {/* Image display */}
      {mediaUrl && mediaType === 'image' && (
        <div className={`image-frame ${tampered ? 'tampered' : 'authentic'}`}>
          <img src={mediaUrl} alt={tampered ? 'Tampered image' : 'Verified image'} />
          <span className={`image-badge ${tampered ? 'tampered' : 'authentic'}`}>
            {tampered ? '⚠ Tampered' : '✓ Authentic'}
          </span>
        </div>
      )}

      {/* Video display */}
      {mediaUrl && mediaType === 'video' && (
        <div className={`image-frame ${tampered ? 'tampered' : 'authentic'}`} style={{ background: '#000' }}>
          <video
            src={mediaUrl}
            controls
            style={{ width: '100%', display: 'block', maxHeight: 400 }}
          />
          <span className={`image-badge ${tampered ? 'tampered' : 'authentic'}`}>
            {tampered ? '⚠ Tampered' : '✓ Authentic'}
          </span>
        </div>
      )}

      {!status && (
        <div className="empty">
          <div className="empty-icon">🔒</div>
          <div className="empty-text">Enter a Media ID to request access</div>
        </div>
      )}
    </div>
  );
}