import { useState, useCallback, useEffect } from 'preact/hooks';
import type { SyncConfig, SyncMode, PushMode, FileMapping } from '../../types/messages';

interface SyncConfigPanelProps {
  initialConfig: SyncConfig | null;
  collectionNames: string[];
  onSave: (config: SyncConfig) => void;
}

export function SyncConfigPanel({ initialConfig, collectionNames, onSave }: SyncConfigPanelProps) {
  const [syncMode, setSyncMode] = useState<SyncMode>(initialConfig?.syncMode ?? 'single');
  const [pushMode, setPushMode] = useState<PushMode>(initialConfig?.pushMode ?? 'direct');
  const [defaultDirectory, setDefaultDirectory] = useState(initialConfig?.defaultDirectory ?? 'tokens/');
  const [baseBranch, setBaseBranch] = useState(initialConfig?.baseBranch ?? 'main');
  const [fileMapping, setFileMapping] = useState<FileMapping>(initialConfig?.fileMapping ?? {});

  // Auto-generate file mapping when collections or directory change
  useEffect(() => {
    if (syncMode === 'multi' && collectionNames.length > 0 && Object.keys(fileMapping).length === 0) {
      const dir = defaultDirectory.endsWith('/') ? defaultDirectory : `${defaultDirectory}/`;
      const mapping: FileMapping = {};
      for (const name of collectionNames) {
        const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        mapping[name] = `${dir}${slug}.json`;
      }
      setFileMapping(mapping);
    }
  }, [syncMode, collectionNames, defaultDirectory, fileMapping]);

  const handleFileMappingChange = useCallback((collectionName: string, filePath: string) => {
    setFileMapping((prev) => ({ ...prev, [collectionName]: filePath }));
  }, []);

  const handleSave = useCallback(() => {
    onSave({
      syncMode,
      pushMode,
      fileMapping,
      defaultDirectory,
      baseBranch,
    });
  }, [syncMode, pushMode, fileMapping, defaultDirectory, baseBranch, onSave]);

  return (
    <div class="sync-config-panel">
      <h3 class="sync-config-title">Sync Configuration</h3>

      {/* Sync Mode */}
      <div class="sync-config-section">
        <label class="form-label">Sync Mode</label>
        <div class="sync-config-radios">
          <label class="sync-config-radio">
            <input
              type="radio"
              name="syncMode"
              value="single"
              checked={syncMode === 'single'}
              onChange={() => setSyncMode('single')}
            />
            <div>
              <strong>Single file</strong>
              <span class="form-hint">All tokens in one file</span>
            </div>
          </label>
          <label class="sync-config-radio">
            <input
              type="radio"
              name="syncMode"
              value="multi"
              checked={syncMode === 'multi'}
              onChange={() => setSyncMode('multi')}
            />
            <div>
              <strong>Multi-file</strong>
              <span class="form-hint">Split by collection</span>
            </div>
          </label>
        </div>
      </div>

      {/* Push Mode */}
      <div class="sync-config-section">
        <label class="form-label">Push Mode</label>
        <div class="sync-config-radios">
          <label class="sync-config-radio">
            <input
              type="radio"
              name="pushMode"
              value="direct"
              checked={pushMode === 'direct'}
              onChange={() => setPushMode('direct')}
            />
            <div>
              <strong>Direct push</strong>
              <span class="form-hint">Commit directly to branch</span>
            </div>
          </label>
          <label class="sync-config-radio">
            <input
              type="radio"
              name="pushMode"
              value="pr"
              checked={pushMode === 'pr'}
              onChange={() => setPushMode('pr')}
            />
            <div>
              <strong>Pull request</strong>
              <span class="form-hint">Create branch + PR for review</span>
            </div>
          </label>
        </div>
      </div>

      {/* Base Branch */}
      <div class="sync-config-section">
        <label class="form-label">Base Branch</label>
        <input
          class="form-input"
          type="text"
          value={baseBranch}
          onInput={(e) => setBaseBranch((e.target as HTMLInputElement).value)}
        />
      </div>

      {/* Multi-file settings */}
      {syncMode === 'multi' && (
        <>
          <div class="sync-config-section">
            <label class="form-label">Default Directory</label>
            <input
              class="form-input"
              type="text"
              placeholder="tokens/"
              value={defaultDirectory}
              onInput={(e) => setDefaultDirectory((e.target as HTMLInputElement).value)}
            />
          </div>

          {/* File Mapping Table */}
          {Object.keys(fileMapping).length > 0 && (
            <div class="sync-config-section">
              <label class="form-label">File Mapping</label>
              <div class="file-mapping-table">
                {Object.entries(fileMapping).map(([collection, filePath]) => (
                  <div key={collection} class="file-mapping-row">
                    <span class="file-mapping-collection" title={collection}>
                      {collection}
                    </span>
                    <input
                      class="form-input file-mapping-input"
                      type="text"
                      value={filePath}
                      onInput={(e) =>
                        handleFileMappingChange(collection, (e.target as HTMLInputElement).value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <button class="btn btn-primary" style={{ width: '100%' }} onClick={handleSave}>
        Save Configuration
      </button>
    </div>
  );
}
