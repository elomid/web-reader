@echo off
echo Building WebReader Extension...

REM Remove existing production build
if exist "webreader-production-build" (
    echo Removing existing production build...
    rmdir /s /q "webreader-production-build"
)

REM Create production build directory
echo Creating production build directory...
mkdir "webreader-production-build"

REM Copy main files
echo Copying main files...
copy "background.js" "webreader-production-build\"
copy "content.js" "webreader-production-build\"
copy "popup.html" "webreader-production-build\"
copy "popup.js" "webreader-production-build\"
copy "manifest.json" "webreader-production-build\"

REM Copy directories
echo Copying directories...
xcopy "icons" "webreader-production-build\icons\" /e /i /h /y
xcopy "images" "webreader-production-build\images\" /e /i /h /y

REM Remove existing zip file
if exist "webreader-production-build.zip" (
    echo Removing existing zip file...
    del "webreader-production-build.zip"
)

REM Create zip file (requires PowerShell)
echo Creating zip file...
powershell -command "Get-ChildItem -Path 'webreader-production-build' -Recurse | Where-Object { $_.Name -ne '.DS_Store' } | Compress-Archive -DestinationPath 'webreader-production-build.zip' -Force"

REM Display results
echo Build complete!
echo Production build: webreader-production-build\
echo Zip file: webreader-production-build.zip
echo.
echo Files included:
dir "webreader-production-build"

echo.
echo Zip contents:
powershell -command "Get-ChildItem -Path 'webreader-production-build.zip' | Select-Object Name, Length"

pause 