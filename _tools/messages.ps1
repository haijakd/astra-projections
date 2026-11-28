# List contact and quote messages saved by the live site. Usage: powershell -File _tools\messages.ps1 [count]
param([int]$Count = 20)
Set-Location (Split-Path $PSScriptRoot)
npx wrangler d1 execute astra-contact --remote --command "SELECT id, created_at, kind, name, email, subject, phone, package, event, message FROM messages ORDER BY id DESC LIMIT $Count"
