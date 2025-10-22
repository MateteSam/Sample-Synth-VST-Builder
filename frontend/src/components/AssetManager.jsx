import React, { useState, useRef } from 'react';

// Professional asset management system for Design page
// Supports images, SVGs, audio samples, and more
export default function AssetManager({ onAssetSelect, currentAssets = [] }) {
  const [assets, setAssets] = useState(currentAssets);
  const [filter, setFilter] = useState('all'); // 'all' | 'images' | 'audio' | 'fonts'
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (files) => {
    const newAssets = [];
    
    for (const file of files) {
      try {
        const url = URL.createObjectURL(file);
        const type = file.type.startsWith('image/') ? 'image' :
                    file.type.startsWith('audio/') ? 'audio' :
                    file.type.startsWith('font/') ? 'font' :
                    'other';
        
        const asset = {
          id: crypto.randomUUID(),
          name: file.name,
          type,
          mimeType: file.type,
          url,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          file // Keep reference for later processing
        };

        // For images, create a thumbnail
        if (type === 'image') {
          asset.thumbnail = url; // In production, you'd generate a smaller version
          
          // Get dimensions
          const img = new Image();
          img.onload = () => {
            asset.width = img.width;
            asset.height = img.height;
          };
          img.src = url;
        }

        newAssets.push(asset);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    setAssets(prev => [...prev, ...newAssets]);
    return newAssets;
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    await handleFileUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    handleFileUpload(files);
  };

  const deleteAsset = (id) => {
    setAssets(prev => {
      const asset = prev.find(a => a.id === id);
      if (asset && asset.url.startsWith('blob:')) {
        URL.revokeObjectURL(asset.url);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const filteredAssets = assets.filter(asset => {
    if (filter === 'all') return true;
    if (filter === 'images') return asset.type === 'image';
    if (filter === 'audio') return asset.type === 'audio';
    if (filter === 'fonts') return asset.type === 'font';
    return true;
  });

  return (
    <div className="asset-manager">
      <div className="asset-header">
        <h3 className="subtitle" style={{ margin: 0 }}>Assets</h3>
        <button 
          className="secondary" 
          onClick={() => fileInputRef.current?.click()}
        >
          + Import
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*,.svg,.json"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <div className="asset-filters">
        {['all', 'images', 'audio', 'fonts'].map(f => (
          <button
            key={f}
            className={filter === f ? 'primary' : 'secondary'}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div
        className={`asset-dropzone ${dragOver ? 'active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-content">
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          <strong>Drop files here</strong>
          <div className="muted" style={{ marginTop: 4 }}>
            or click to browse
          </div>
          <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
            Supports: PNG, JPG, SVG, GIF, Audio, Lottie JSON
          </div>
        </div>
      </div>

      <div className="asset-grid">
        {filteredAssets.map(asset => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onSelect={() => onAssetSelect(asset)}
            onDelete={() => deleteAsset(asset.id)}
          />
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="asset-empty">
          <div className="muted">No assets yet. Import files to get started.</div>
        </div>
      )}
    </div>
  );
}

function AssetCard({ asset, onSelect, onDelete }) {
  return (
    <div className="asset-card">
      <div 
        className="asset-preview"
        onClick={onSelect}
        style={{ cursor: 'pointer' }}
      >
        {asset.type === 'image' && (
          <img 
            src={asset.url} 
            alt={asset.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        {asset.type === 'audio' && (
          <div className="asset-icon">🎵</div>
        )}
        {asset.type === 'font' && (
          <div className="asset-icon">Aa</div>
        )}
        {asset.type === 'other' && (
          <div className="asset-icon">📄</div>
        )}
      </div>
      
      <div className="asset-info">
        <div className="asset-name" title={asset.name}>
          {asset.name}
        </div>
        <div className="asset-meta">
          {asset.type === 'image' && asset.width && (
            <span className="muted">{asset.width}×{asset.height}</span>
          )}
          <span className="muted">{formatFileSize(asset.size)}</span>
        </div>
      </div>

      <div className="asset-actions">
        <button 
          className="btn-icon" 
          onClick={onSelect}
          title="Use asset"
        >
          ✓
        </button>
        <button 
          className="btn-icon danger" 
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete ${asset.name}?`)) {
              onDelete();
            }
          }}
          title="Delete asset"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// CSS for asset manager (to be added to styles.css)
const assetManagerStyles = `
.asset-manager {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.asset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.asset-filters {
  display: flex;
  gap: 6px;
}

.asset-filters button {
  padding: 6px 12px;
  font-size: 13px;
}

.asset-dropzone {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--surface);
}

.asset-dropzone.active,
.asset-dropzone:hover {
  border-color: var(--accent-2);
  background: rgba(0, 234, 255, 0.05);
}

.dropzone-content {
  pointer-events: none;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  overflow-y: auto;
  flex: 1;
  padding: 4px;
}

.asset-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.asset-card:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.asset-preview {
  width: 100%;
  height: 100px;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.asset-icon {
  font-size: 32px;
}

.asset-info {
  padding: 8px;
}

.asset-name {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.asset-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
}

.asset-actions {
  display: flex;
  gap: 4px;
  padding: 4px 8px 8px;
  border-top: 1px solid var(--border);
}

.asset-actions .btn-icon {
  flex: 1;
  padding: 4px;
  font-size: 14px;
}

.asset-empty {
  text-align: center;
  padding: 40px 20px;
}
`;
