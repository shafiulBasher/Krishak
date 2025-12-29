import codecs

files = [
    'frontend/src/pages/admin/AdminDashboard.jsx',
    'frontend/src/pages/farmer/CreateListing.jsx'
]

for file_path in files:
    try:
        # Read with UTF-8-SIG (removes BOM if present)
        with codecs.open(file_path, 'r', 'utf-8-sig') as f:
            content = f.read()
        
        # Write back with UTF-8 (no BOM)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'✓ Fixed {file_path}')
    except Exception as e:
        print(f'✗ Error fixing {file_path}: {e}')

print('\nDone! BOM removed from all files.')
