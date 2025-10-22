param(
  [Parameter(Mandatory=$true)]
  [string]$Stamp,
  [string]$ExportPath
)
Write-Output "[vst-builder] build.ps1 called with stamp: $Stamp"
if (-not $ExportPath) {
  $ExportPath = Join-Path $PSScriptRoot "..\..\..\backend\export\$Stamp"
}
$ExportPath = (Resolve-Path $ExportPath).ProviderPath
Write-Output "Export path: $ExportPath"

# log file early so generator can append
$logFile = Join-Path $ExportPath 'builder.log'

# Compile the standalone generator (generate_standalone.cpp)
$genCpp = Join-Path $PSScriptRoot "generate_standalone.cpp"
if (-not (Test-Path $genCpp)) { Write-Error "Standalone generator source missing: $genCpp"; exit 2 }

$exe = Join-Path $PSScriptRoot "generate_standalone.exe"
try {
  Write-Output "Compiling standalone generator..."
  & cl.exe /nologo /EHsc /std:c++17 /Fe:$exe $genCpp 2>&1 | Write-Output
} catch {
  Write-Warning "Failed to compile generator with cl.exe. Make sure Visual Studio build tools are installed and 'cl' is in PATH.";
}

# If generator exists, run it to create the project inside the export
if (Test-Path $exe) {
  Write-Output "Running generator to emit standalone project..."
  & $exe $ExportPath | Write-Output
} else {
  Write-Warning "Generator executable not present; trying to run via msbuild fallback is not implemented.";
}

# Try Electron scaffold generator (Node) to create a minimal standalone renderer
try {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) {
    $genNode = Join-Path $PSScriptRoot 'generate_electron.js'
    if (Test-Path $genNode) {
      Write-Output "Running Node electron generator..." | Tee-Object -FilePath $logFile -Append
      & node $genNode $ExportPath 2>&1 | Tee-Object -FilePath $logFile -Append
      # Attempt to package with electron-packager if npx is available
      $appDir = Join-Path $ExportPath 'standalone-electron'
      if (Test-Path $appDir) {
        $npx = Get-Command npx -ErrorAction SilentlyContinue
        if ($npx) {
          Write-Output "Packaging Electron app with npx electron-packager..." | Tee-Object -FilePath $logFile -Append
          Push-Location $appDir
          # supply an explicit electron version to avoid 'Unable to determine Electron version' errors
          & npx electron-packager . SekoSaStandalone --platform=win32 --arch=x64 --out=dist --overwrite --electron-version=24.0.0 2>&1 | Tee-Object -FilePath $logFile -Append
          Pop-Location
          # delegate packaging collection to Node helper to avoid PowerShell quoting issues
          $collect = Join-Path $PSScriptRoot 'collect_packaged.js'
          if (Test-Path $collect) {
            Write-Output "Running Node collect_packaged.js..." | Tee-Object -FilePath $logFile -Append
            & node $collect $ExportPath 2>&1 | Tee-Object -FilePath $logFile -Append
          } else {
            Write-Output "collect_packaged.js not found; skipping copy of dist to binaries" | Tee-Object -FilePath $logFile -Append
          }
        } else {
          Write-Output "npx not found; skipping packaging step. You can package manually: 'npx electron-packager . SekoSaStandalone --platform=win32 --arch=x64 --out=dist --overwrite'" | Tee-Object -FilePath $logFile -Append
        }
      }
    }
  } else {
    Write-Output "node not found; skipping Node-based electron generation." | Tee-Object -FilePath $logFile -Append
  }
} catch {
  Write-Warning "Electron generator failed: $_" | Tee-Object -FilePath $logFile -Append
}

# Attempt to configure and build the generated standalone project
$projDir = Join-Path $ExportPath 'project_standalone'
if (-not (Test-Path $projDir)) { Write-Warning "No generated standalone project found at $projDir"; exit 0 }

$cmake = Get-Command cmake -ErrorAction SilentlyContinue
if (-not $cmake) { Write-Warning "cmake not found in PATH. Skipping build."; exit 0 }

$buildDir = Join-Path $projDir 'build'
if (Test-Path $buildDir) { Remove-Item -Recurse -Force $buildDir }
New-Item -Path $buildDir -ItemType Directory | Out-Null

Push-Location $buildDir
try {
  $logFile = Join-Path $ExportPath 'builder.log'
  Write-Output "Running cmake .. (logging to $logFile)"
  & cmake .. 2>&1 | Tee-Object -FilePath $logFile -Append
  Write-Output "Building standalone..."
  & cmake --build . --config Release 2>&1 | Tee-Object -FilePath $logFile -Append
  Write-Output "Standalone build finished. Look for executable in $buildDir" | Tee-Object -FilePath $logFile -Append
  # Copy built artifacts into export/binaries
  $binOut = Join-Path $ExportPath 'binaries'
  if (-not (Test-Path $binOut)) { New-Item -Path $binOut -ItemType Directory | Out-Null }
  Get-ChildItem -Path $buildDir -Recurse -File | Where-Object { $_.Extension -in '.exe', '.dll', '.app' -or ($_.Attributes -band [IO.FileAttributes]::Archive) } | ForEach-Object {
    try { Copy-Item -Path $_.FullName -Destination $binOut -Force -ErrorAction SilentlyContinue } catch {}
  }
  # Recreate zip to include binaries
  try {
    $zipAbs = Join-Path (Split-Path $ExportPath -Parent) "${Stamp}.zip"
    if (Test-Path $zipAbs) { Remove-Item $zipAbs -Force }
    Compress-Archive -Path $ExportPath -DestinationPath $zipAbs -Force
    Write-Output "Updated zip: $zipAbs" | Tee-Object -FilePath $logFile -Append
  } catch {
    Write-Warning "Failed to rezip export: $_" | Tee-Object -FilePath $logFile -Append
  }
} catch {
  Write-Error "Build failed: $_";
} finally {
  Pop-Location
}
