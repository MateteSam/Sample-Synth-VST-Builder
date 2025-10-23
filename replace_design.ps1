# Replace Design.jsx with refactored version
$designPath = 'c:\Users\DELL\Documents\FILING CABINET OF MILLIONS\Seko Sa\frontend\src\pages\Design.jsx'
$refactorPath = 'c:\Users\DELL\Documents\FILING CABINET OF MILLIONS\Seko Sa\frontend\src\pages\Design_REFACTORED.jsx'
$backupPath = 'c:\Users\DELL\Documents\FILING CABINET OF MILLIONS\Seko Sa\frontend\src\pages\Design.BACKUP_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '.jsx'

# Create backup
Copy-Item -Path $designPath -Destination $backupPath -Force
Write-Host "✓ Backup created: $backupPath"

# Replace
Copy-Item -Path $refactorPath -Destination $designPath -Force
Write-Host "✓ Design.jsx replaced with refactored version"

# Cleanup
Remove-Item -Path $refactorPath -Force
Write-Host "✓ Cleanup complete"

# Git operations
Set-Location 'c:\Users\DELL\Documents\FILING CABINET OF MILLIONS\Seko Sa'
git add -A
git commit -m "Feat: Refactor Design tab for clean UI/UX - maintains all power features with Sequence-level cleanliness"
git push origin main
Write-Host "✓ Changes pushed to GitHub"
