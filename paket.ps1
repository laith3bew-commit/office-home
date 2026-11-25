# Verkaufspaket bauen: dist\HomeOffice-Paket-<Version>.zip
# Inhalt: Setup.exe + ANLEITUNG_FUER_CLAUDE.md + LIES_MICH.txt + HomeOffice-Anleitung.pdf (aus verkauf\).
# PDF neu erzeugen, wenn verkauf\anleitung.html geaendert wurde (Electron printToPDF).
# Vorher die Setup.exe bauen (.\release.ps1 oder: npx electron-builder --win nsis --publish never).
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version
$exe = "dist\OfficeHome-Setup-$version.exe"
if (-not (Test-Path $exe)) { throw "$exe fehlt - zuerst die Setup.exe bauen." }
$ziel = "dist\HomeOffice-Paket-$version"
if (Test-Path $ziel) { Remove-Item $ziel -Recurse -Force -Confirm:$false }
New-Item -ItemType Directory $ziel | Out-Null
Copy-Item $exe, 'verkauf\ANLEITUNG_FUER_CLAUDE.md', 'verkauf\LIES_MICH.txt', 'verkauf\HomeOffice-Anleitung.pdf' $ziel
$zip = "$ziel.zip"; if (Test-Path $zip) { Remove-Item $zip -Force -Confirm:$false }
Compress-Archive -Path "$ziel\*" -DestinationPath $zip
Write-Host "Paket: $((Resolve-Path $zip).Path)"
