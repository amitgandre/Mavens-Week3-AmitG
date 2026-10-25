"""Refresh portable workflow exports from a local n8n backup; never export credentials."""
import hashlib
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
destination = root / 'n8n/saved-workflows'
manifest_path = destination / 'manifest.json'
previous = json.loads(manifest_path.read_text())
files = {row['workflow']: row['file'] for row in previous['workflows']}
workflows = json.loads(Path(sys.argv[1]).read_text())


def portable(value):
    if isinstance(value, list):
        return [portable(item) for item in value]
    if isinstance(value, dict):
        return {key: portable(item) for key, item in value.items()
                if key not in {'credentials', 'shared', 'activeVersion', 'versionMetadata'}}
    return value


exported, entries = [], []
for workflow in workflows:
    if workflow['name'] not in files:
        continue  # One-off production executions stay in the local backup.
    clean = portable(workflow)
    clean['pinData'] = {}
    clean['staticData'] = None
    clean['active'] = False
    clean.pop('activeVersionId', None)
    clean.pop('meta', None)
    clean.pop('webhookId', None)
    for node in clean['nodes']:
        node.pop('webhookId', None)
    filename = files[workflow['name']]
    content = json.dumps(clean, indent=2) + '\n'
    (destination / filename).write_text(content)
    exported.append(clean)
    entries.append({'workflow': clean['name'], 'file': filename,
                    'nodes': len(clean['nodes']),
                    'sha256': hashlib.sha256(content.encode()).hexdigest()})
assert len(exported) == len(files), 'A previously exported workflow is missing'
(destination / 'all-workflows.json').write_text(json.dumps(exported, indent=2) + '\n')
manifest = {'workflow_count': len(exported), 'credential_secrets_included': False,
            'credential_references_removed_from_portable_exports': True,
            'memory_export': '../research-memory/memory-export.json', 'workflows': entries}
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Exported {len(exported)} portable workflows; credential references removed.')
