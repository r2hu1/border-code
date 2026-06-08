$ErrorActionPreference = "Stop"

$Repo = "r2hu1/border-code"
$BinaryName = "border-code"
$File = "border-code-windows.exe"

$Release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest"
$Tag = $Release.tag_name
$Url = "https://github.com/$Repo/releases/download/$Tag/$File"

$InstallDir = "$env:LOCALAPPDATA\Programs\$BinaryName"
$InstallPath = "$InstallDir\$BinaryName.exe"

if (-not (Test-Path $InstallDir)) {
  New-Item -ItemType Directory -Path $InstallDir | Out-Null
}

Write-Host "downloading $File ($Tag)..."
Invoke-WebRequest -Uri $Url -OutFile $InstallPath

$CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($CurrentPath -notlike "*$InstallDir*") {
  [Environment]::SetEnvironmentVariable("PATH", "$CurrentPath;$InstallDir", "User")
  Write-Host "added $InstallDir to PATH"
}

Write-Host "installed to $InstallPath"
Write-Host "restart your terminal and run: $BinaryName"
