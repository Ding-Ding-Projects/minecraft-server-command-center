@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "MSC_SILENT=0"
if /I "%~1"=="/s" set "MSC_SILENT=1"
if /I "%~1"=="--silent" set "MSC_SILENT=1"
if /I "%SILENT%"=="1" set "MSC_SILENT=1"

set "MSC_ROOT=%~dp0"
pushd "%MSC_ROOT%"
set "MSC_STARTED=%TIME%"

where node >nul 2>nul
if errorlevel 1 (
  echo [1/3] Node.js was not found. Trying the Windows package manager...
  where winget >nul 2>nul
  if errorlevel 1 (
    echo ERROR: Node.js 20+ is required and winget is unavailable. Tried: node on PATH, winget install OpenJS.NodeJS.LTS.
    exit /b 1
  )
  winget install --id OpenJS.NodeJS.LTS --exact --accept-package-agreements --accept-source-agreements --silent
  if errorlevel 1 (
    echo ERROR: Could not install Node.js LTS through winget.
    exit /b 1
  )
  if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
)

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js installation completed but node is not available to this process.
  exit /b 1
)

echo [1/3] Node.js found: 
node --version
echo [2/3] Installing declared project dependencies...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo ERROR: Dependency installation failed.
  exit /b 1
)

echo [3/3] Building the desktop application...
call npm run build
if errorlevel 1 (
  echo ERROR: Application build failed.
  exit /b 1
)

echo Build completed. Started %MSC_STARTED%; finished %TIME%.
if "%MSC_SILENT%"=="1" exit /b 0
choice /M "Run Minecraft Server Command Center now"
if errorlevel 2 exit /b 0
call npm exec electron .
exit /b %ERRORLEVEL%

