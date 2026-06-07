param(
  [string]$OutputPath = "worktree-snapshot.json"
)

$root = Resolve-Path "."
$excludedDirs = @(
  "\node_modules\",
  "\.next\",
  "\test-results\",
  "\playwright-report\",
  "\.git\"
)

$files = Get-ChildItem -Path $root -Recurse -File | Where-Object {
  $path = $_.FullName
  foreach ($dir in $excludedDirs) {
    if ($path.Contains($dir)) {
      return $false
    }
  }
  return $true
} | Sort-Object FullName | ForEach-Object {
  $relative = $_.FullName.Substring($root.Path.Length + 1).Replace("\", "/")
  $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName
  [PSCustomObject]@{
    path = $relative
    bytes = $_.Length
    sha256 = $hash.Hash.ToLowerInvariant()
  }
}

$snapshot = [PSCustomObject]@{
  name = "portfolio-platform"
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  root = $root.Path
  fileCount = @($files).Count
  files = $files
}

$snapshot | ConvertTo-Json -Depth 5 | Set-Content -Path $OutputPath -Encoding UTF8
Write-Output "Wrote $OutputPath with $($snapshot.fileCount) files."
