$line = (docker logs game_analyst_tunnel 2>&1 | Select-String -Pattern "https://[a-zA-Z0-9-]+\.trycloudflare\.com" | Select-Object -First 1)
if ($line) {
    $match = [regex]::Match($line.Line, "https://[a-zA-Z0-9-]+\.trycloudflare\.com")
    $url = $match.Value
    Write-Host "`n========================================================" -ForegroundColor Cyan
    Write-Host " Canli Cloudflare Linkiniz Acildi:" -ForegroundColor Green
    Write-Host " $url" -ForegroundColor Yellow
    Write-Host "========================================================`n" -ForegroundColor Cyan
    Start-Process $url
} else {
    Write-Host "Link hazirlaniyor, lutfen birkaç saniye bekleyin..." -ForegroundColor Red
}

