"""Reject private environment files and recognizable credentials without logging their values."""
import pathlib
import re
import subprocess
root=pathlib.Path(__file__).resolve().parents[1]
patterns=[rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', rb'\bAKIA[0-9A-Z]{16}\b',
          rb'\bgh[pousr]_[A-Za-z0-9]{36,}\b', rb'\bgithub_pat_[A-Za-z0-9_]{70,}\b']
failures=[]
for name in subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0'):
    if not name: continue
    path=root/name
    if path.is_dir() or not path.exists(): continue
    if (path.name=='.env' or path.name.startswith('.env.')) and not path.name.endswith('.example'):
        failures.append(name+': private environment file is tracked')
    contents=path.read_bytes()
    if any(re.search(pattern,contents) for pattern in patterns): failures.append(name+': credential pattern found')
for failure in failures: print(failure)
print('Tracked credential policy:', 'FAILED' if failures else 'passed')
raise SystemExit(1 if failures else 0)
