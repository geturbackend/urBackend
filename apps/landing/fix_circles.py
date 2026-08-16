import re

file_path = r'e:\Majors\WEB\urBackend\apps\landing\src\styles\landing.css'

with open(file_path, 'r') as f:
    content = f.read()

# CSS selectors that should be strictly circular
circular_classes = [
    r'\.hero-glow',
    r'\.byom-glow',
    r'\.pulsing-dot',
    r'\.hf-dot-moving',
    r'\.flow-dot',
    r'\.flow-spinner',
    r'\.dot',
    r'\.orbit-center',
    r'\.orbit-sun-logo',
    r'\.orbit-sun-glow',
    r'\.orbit-sun-ring-dec',
    r'\.orbit-ring',
    r'\.orbit-dust',
    r'\.byom-particle',
    r'\.timeline-node-dot',
    r'\.loader-dot',
    r'\.mini-circle',
    r'\.mini-dot',
    r'\.lh-engine'
]

for cls in circular_classes:
    pattern = re.compile(rf'({cls}(?:,\s*[^{{]+)*\s*{{)([^}}]+)', re.MULTILINE)
    
    def replacer(match):
        header = match.group(1)
        body = match.group(2)
        if 'border-radius: 50%;' not in body:
            return header + '\n    border-radius: 50%;' + body
        return match.group(0)
        
    content = pattern.sub(replacer, content)

with open(file_path, 'w') as f:
    f.write(content)

print("Done restoring border-radius to circular elements.")
