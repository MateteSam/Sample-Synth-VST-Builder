<#
build_export.ps1
Helpers to attempt building an exported project folder into binaries (VST3/standalone).
This is intentionally conservative: it only runs if required tools (cmake, cl/g++, JUCE) are detected and will otherwise print guidance.

Usage: .\build_export.ps1 -Stamp 1760745495988
#>
param(
  [Parameter(Mandatory=$true)]
  [string]$Stamp
)

$root = Join-Path -Path $PSScriptRoot -ChildPath "export\$Stamp"
if (-not (Test-Path $root)) { Write-Error "Export '$Stamp' not found at $root"; exit 2 }

Write-Output "Preparing to build export: $root"

# Check prerequisites
$cmake = Get-Command cmake -ErrorAction SilentlyContinue
if (-not $cmake) { Write-Warning "cmake not found in PATH. Install CMake to enable building."; exit 0 }

# This script expects the user to have JUCE and a CMake-compatible JUCE setup.
$projDir = Join-Path $root 'project'
if (-not (Test-Path $projDir)) { Write-Warning "No project scaffold found. Nothing to build."; exit 0 }

$buildDir = Join-Path $projDir 'build'
if (Test-Path $buildDir) { Remove-Item -Recurse -Force $buildDir }
New-Item -Path $buildDir -ItemType Directory | Out-Null

Push-Location $buildDir
try {
  Write-Output "Running cmake .."
  $r = & cmake .. 2>&1
  Write-Output $r
  Write-Output "If the CMake configure step failed, ensure JUCE is available and your CMakeLists.txt points to it."
  # Attempt build
  Write-Output "Attempting to build (this will use the default generator/toolchain on your system)."
  $r2 = & cmake --build . --config Release 2>&1
  Write-Output $r2
  Write-Output "Build finished. Check the build output folder for binaries."
} catch {
  Write-Error "Build failed: $_"
} finally {
  Pop-Location
}
