param([string]$ProxyUrl = 'http://127.0.0.1:7890')
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runtimeRoot = Join-Path $projectRoot '.runtime'
New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
$listener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if (-not $listener) {
  $nodePath = (Get-Command node -ErrorAction Stop).Source
  Start-Process -FilePath $nodePath -ArgumentList @('--import','tsx','server.ts') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeRoot 'server.stdout.log') -RedirectStandardError (Join-Path $runtimeRoot 'server.stderr.log') | Out-Null
}
for ($attempt=0; $attempt -lt 20; $attempt++) {
  if (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue) { break }
  Start-Sleep -Milliseconds 500
}
if (-not (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue)) { throw '本机桥接未启动，请检查 .env 的 LOCAL_BRIDGE_TOKEN 和 .runtime/server.stderr.log。' }
$tunnelLog = Join-Path $runtimeRoot 'tunnel.log'
$runningTunnel = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'cloudflared.exe' -and $_.CommandLine -like ('*'+$tunnelLog+'*') }
if (-not $runningTunnel) {
  $cloudflaredPath = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
  if (-not (Test-Path -LiteralPath $cloudflaredPath)) { $cloudflaredPath = (Get-Command cloudflared -ErrorAction Stop).Source }
  $env:HTTPS_PROXY = $ProxyUrl
  Set-Content -LiteralPath $tunnelLog -Value ''
  $tunnelArgs = @('tunnel','--url','http://127.0.0.1:3001','--protocol','http2','--no-autoupdate','--logfile',('"'+$tunnelLog+'"'))
  Start-Process -FilePath $cloudflaredPath -ArgumentList $tunnelArgs -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeRoot 'tunnel.stdout.log') -RedirectStandardError (Join-Path $runtimeRoot 'tunnel.stderr.log') | Out-Null
}
$tunnelUrl = $null
for ($attempt=0; $attempt -lt 40; $attempt++) {
  $logs = @($tunnelLog,(Join-Path $runtimeRoot 'tunnel.stdout.log'),(Join-Path $runtimeRoot 'tunnel.stderr.log')) | Where-Object { Test-Path -LiteralPath $_ } | ForEach-Object { Get-Content -LiteralPath $_ -Raw }
  $match = [regex]::Match(($logs -join "`n"),'https://[a-z0-9-]+\.trycloudflare\.com')
  if ($match.Success) { $tunnelUrl=$match.Value; break }
  Start-Sleep -Milliseconds 500
}
if (-not $tunnelUrl) { throw '无法建立本机连接，请检查 .runtime/tunnel.stderr.log。' }
Write-Output ('LOCAL_BACKEND_URL=' + $tunnelUrl)
Write-Output '本机服务已在后台启动。新建连接的地址需要同步到 ChatGPT 站点的 LOCAL_BACKEND_URL 服务端密钥。'
