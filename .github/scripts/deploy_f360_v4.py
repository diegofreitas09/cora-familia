from pathlib import Path
import base64, gzip, re

root = Path(__file__).resolve().parents[2]
source = root / '.github/workflows/f360-v4-deploy.yml'
text = source.read_text(encoding='utf-8')
values = dict(re.findall(r'^\s+(F[1-9]):\s+([A-Za-z0-9+/=]+)\s*$', text, re.M))

paths = {
    'F1': 'familia360/master/index.html',
    'F2': 'familia360/master/sw.js',
    'F3': 'familia360/master/manifest.webmanifest',
    'F4': 'familia360/pessoa/index.html',
    'F5': 'familia360/pessoa/sw.js',
    'F6': 'familia360/pessoa/manifest.webmanifest',
    'F7': 'familia360/icons/pessoa-192.svg',
    'F8': 'familia360/icons/pessoa-512.svg',
    'F9': 'familia360/index.html',
}

missing = [k for k in paths if k not in values]
if missing:
    raise SystemExit(f'Payload v4 incompleto: {missing}')

for key, rel in paths.items():
    target = root / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(gzip.decompress(base64.b64decode(values[key])))

for rel in [
    'familia360/pessoa/gps.html',
    '.github/workflows/patch-f360-gps.yml',
    '.github/workflows/f360-v4-deploy.yml',
    '.github/scripts/deploy_f360_v4.py',
]:
    p = root / rel
    if p.exists():
        p.unlink()

# Restore the normal CI workflow after this one-shot deployment.
quality = '''name: Quality

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: npm install
      - run: npm run lint

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: npm install
      - run: npx playwright install --with-deps chromium
      - name: Start static server
        run: python3 -m http.server 4173 --bind 127.0.0.1 >/tmp/cora-http.log 2>&1 &
      - run: npm run test:e2e
'''
(root / '.github/workflows/quality.yml').write_text(quality, encoding='utf-8')
print('Família 360 v4 preparado com sucesso.')
