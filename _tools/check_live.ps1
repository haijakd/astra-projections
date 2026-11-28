# Live check of the deployed Astra Projections site. Usage: powershell -File _tools\check_live.ps1 https://astra-projections.pages.dev
param([string]$Base = 'https://astra-projections.pages.dev')
$ErrorActionPreference = 'Continue'
$fail = 0
function Get-Status($u) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri $u -MaximumRedirection 5 -ErrorAction Stop
    return @($r.StatusCode, $r)
  } catch {
    $resp = $_.Exception.Response
    if ($resp) { return @([int]$resp.StatusCode, $resp) } else { return @(0, $null) }
  }
}
$assets = New-Object System.Collections.Generic.HashSet[string]
foreach ($p in '/', '/services', '/contact') {
  $s, $r = Get-Status ($Base + $p)
  "{0} page {1}" -f $s, $p
  if ($s -ne 200) { $fail++ ; continue }
  [regex]::Matches($r.Content, '(?:src|data-src|href)="([^"#]+)"') | ForEach-Object {
    $x = $_.Groups[1].Value
    if ($x -notmatch '^(https?:|mailto:|tel:)') { if ($x -notlike '/*') { $x = '/' + $x }; [void]$assets.Add($x) }
  }
  # fonts are referenced from the stylesheet, not the page
}
foreach ($f in 'barlow-300', 'barlow-300i', 'barlow-600', 'barlow-600i') { [void]$assets.Add("/fonts/$f.woff2") }
foreach ($a in $assets) { $s, $r = Get-Status ($Base + $a); if ($s -ne 200) { $fail++; "{0} ASSET {1}" -f $s, $a } }
"assets checked: $($assets.Count)"
foreach ($p in '/home', '/index.html', '/astra-projections/services', '/astra-projections/contact') {
  # shortcut: PS 5.1 hides 3xx responses when redirects are off, so curl.exe reads them
  $line = & curl.exe -s -o NUL -w '%{http_code} %{redirect_url}' ($Base + $p)
  $s, $loc = $line -split ' ', 2
  "{0} redirect {1} -> {2}" -f $s, $p, $loc
  if ($s -ne '301' -and $s -ne '308') { $fail++ }
}
$s, $r = Get-Status ($Base + '/no-such-page')
"{0} missing page (expect 404)" -f $s
if ($s -ne 404) { $fail++ }
$s, $r = Get-Status ($Base + '/')
$h = $r.Headers['X-Content-Type-Options']
"header X-Content-Type-Options: $h"
if ($h -ne 'nosniff') { $fail++ }
"FAILURES: $fail"
