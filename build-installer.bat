@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "MSC_SILENT=0"
if /I "%~1"=="/s" set "MSC_SILENT=1"
if /I "%~1"=="--silent" set "MSC_SILENT=1"
if /I "%SILENT%"=="1" set "MSC_SILENT=1"

set "MSC_ROOT=%~dp0"
pushd "%MSC_ROOT%"

call build.bat /s
if errorlevel 1 exit /b %ERRORLEVEL%

echo [installer] Creating unsigned Squirrel.Windows artifacts...
call npm run dist
if errorlevel 1 (
  echo ERROR: Squirrel.Windows packaging failed.
  exit /b 1
)

echo [installer] Verifying unsigned installer status...
call npm run verify:unsigned
if errorlevel 1 (
  echo ERROR: Installer did not satisfy the unsigned-artifact requirement.
  exit /b 1
)

for %%F in ("release\squirrel-windows\Setup.exe") do (
  certutil -hashfile "%%~fF" SHA256 | findstr /R /V "hash CertUtil" > "%TEMP%\msc-installer-sha256.txt"
  set /p MSC_SHA256=<"%TEMP%\msc-installer-sha256.txt"
  del "%TEMP%\msc-installer-sha256.txt"
  echo Installer: %%~fF
  echo SHA-256: !MSC_SHA256!
)
echo Installer build completed. The artifacts are unsigned.
exit /b 0

