@echo off
cd /d "c:\Users\DELL\Documents\FILING CABINET OF MILLIONS\Seko Sa"

REM Create backup
powershell -Command "Copy-Item 'frontend\src\pages\Design.jsx' 'frontend\src\pages\Design.BACKUP.%date:~-4%.%date:~-10,2%.%date:~-7,2%.%time:~0,2%.%time:~3,2%.%time:~6,2%.jsx'"

REM Replace file
powershell -Command "Move-Item 'frontend\src\pages\Design_REFACTORED.jsx' 'frontend\src\pages\Design.jsx' -Force"

REM Also copy clean styles
if not exist "frontend\src\styles\Design.css" (
    copy "frontend\src\styles\Design_Clean.css" "frontend\src\styles\Design.css"
)

REM Git commit
git add -A
git commit -m "Feat: Refactor Design tab UI for clean professional experience"
git push origin main

echo.
echo ============================================
echo ✓ Design Tab Refactoring Complete!
echo ============================================
echo.
echo Changes:
echo - New clean UI with panels (left/right collapsible)
echo - Maintains all backend power features
echo - Follows Sequence-tab cleanliness pattern
echo - Full keyboard shortcuts support
echo - Professional export options
echo.
pause
