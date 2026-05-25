$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$apiUrl = "http://127.0.0.1:4040/api/tunnels"

Start-Sleep -Seconds 4

try {
  $response = Invoke-RestMethod -Uri $apiUrl -TimeoutSec 10
} catch {
  Write-Host "ERRO: ngrok nao respondeu em $apiUrl"
  Write-Host "Abra http://127.0.0.1:4040 e confira os tuneis."
  exit 1
}

$serverTunnel = $response.tunnels | Where-Object { $_.name -eq "servidor" } | Select-Object -First 1
$clientTunnel = $response.tunnels | Where-Object { $_.name -eq "cliente" } | Select-Object -First 1

if (-not $serverTunnel -or -not $clientTunnel) {
  Write-Host "ERRO: Tuneis 'servidor' e 'cliente' nao encontrados."
  Write-Host "Tuneis disponiveis:"
  $response.tunnels | ForEach-Object { Write-Host "  - $($_.name): $($_.public_url)" }
  exit 1
}

function Get-HttpsUrl($tunnel) {
  if ($tunnel.public_url -like "https://*") { return $tunnel.public_url }
  if ($tunnel.public_url -like "http://*") {
    return $tunnel.public_url -replace "^http://", "https://"
  }
  return $tunnel.public_url
}

$serverUrl = Get-HttpsUrl $serverTunnel
$clientUrl = Get-HttpsUrl $clientTunnel

$envFile = Join-Path $root "client\.env.local"
"VITE_SERVER_URL=$serverUrl" | Set-Content -Path $envFile -Encoding utf8

$urlFile = Join-Path $root "ngrok-urls.txt"
@(
  "SERVIDOR=$serverUrl"
  "CLIENTE=$clientUrl"
) | Set-Content -Path $urlFile -Encoding utf8

Write-Host ""
Write-Host "========================================"
Write-Host "  URLs do ngrok"
Write-Host "========================================"
Write-Host ""
Write-Host "  Servidor (Socket.IO): $serverUrl"
Write-Host "  Cliente (envie este link): $clientUrl"
Write-Host ""
Write-Host "  Salvo em client\.env.local"
Write-Host "========================================"
