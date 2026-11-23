# Neue Version veröffentlichen: Version in package.json erhöhen, dann  .\release.ps1  ausführen.
# Baut die Setup.exe, erzeugt latest.yml und lädt alles als GitHub-Release hoch.
# Installierte Programme finden das Update danach von selbst.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version
$repo = 'laith3bew-commit/office-home'
$exe = "OfficeHome-Setup-$version.exe"

npx electron-builder --win nsis --publish never
if (-not (Test-Path "dist\$exe")) { throw "dist\$exe wurde nicht gebaut." }

$bytes = [IO.File]::ReadAllBytes((Resolve-Path "dist\$exe"))
$sha = [Convert]::ToBase64String([System.Security.Cryptography.SHA512]::Create().ComputeHash($bytes))
$date = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
$yml = "version: $version`nfiles:`n  - url: $exe`n    sha512: $sha`n    size: $($bytes.Length)`npath: $exe`nsha512: $sha`nreleaseDate: '$date'`n"
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'dist\latest.yml'), $yml)

gh release create "v$version" "dist\$exe" "dist\$exe.blockmap" "dist\latest.yml" -R $repo --title "Office Home $version" --notes "Office Home $version"
Write-Host "Veröffentlicht: https://github.com/$repo/releases/tag/v$version"
