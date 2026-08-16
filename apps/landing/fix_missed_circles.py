import re

file_path = r'e:\Majors\WEB\urBackend\apps\landing\src\styles\landing.css'

with open(file_path, 'r') as f:
    content = f.read()

# CSS selectors that should be strictly circular
circular_classes = [
    r'\.orbit-inner-wrapper',
    r'\.orbit-mid-wrapper',
    r'\.orbit-outer-wrapper',
    r'\.orbit-sun-ring-1',
    r'\.orbit-sun-ring-2',
    r'\.orbit-connect-line::after',
    r'\.byom-pipe-particle'
]

for cls in circular_classes:
    # Match the CSS block exactly.
    pattern = re.compile(rf'^({cls}(?:,\s*[^{{]+)*\s*{{)([^}}]+)', re.MULTILINE)
    
    def replacer(match):
        header = match.group(1)
        body = match.group(2)
        if 'border-radius: 50%;' not in body:
            return header + '\n    border-radius: 50%;' + body
        return match.group(0)
        
    content = pattern.sub(replacer, content)

with open(file_path, 'w') as f:
    f.write(content)

print("Done restoring border-radius to missed elements.")
