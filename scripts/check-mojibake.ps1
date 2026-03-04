try {
    Write-Host "Checking for mojibake..."
    node scripts/check-mojibake.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Check passed." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Check failed." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error running check script." -ForegroundColor Red
    exit 1
}
