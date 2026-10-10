# =====================================================================
#  server.ps1 - Web server lokal sederhana (tanpa Node/Python/PHP)
#  Memakai .NET HttpListener yang sudah bawaan Windows.
#  Jalankan:  klik kanan file ini > Run with PowerShell
#         atau di terminal:  powershell -ExecutionPolicy Bypass -File server.ps1
#  Buka di browser:  http://localhost:8000
# =====================================================================

param(
    [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

# Peta tipe MIME agar file disajikan dengan benar
$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.ico'  = 'image/x-icon'
    '.webmanifest' = 'application/manifest+json'
    '.txt'  = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
}
catch {
    Write-Host ""
    Write-Host "Gagal memulai server di port $Port." -ForegroundColor Red
    Write-Host "Mungkin port sedang dipakai. Coba port lain, contoh:" -ForegroundColor Yellow
    Write-Host "   powershell -ExecutionPolicy Bypass -File server.ps1 -Port 8080" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Jurnal Keuangan Syariah - server lokal aktif" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Buka di browser : $prefix" -ForegroundColor Cyan
Write-Host "  Folder          : $root"
Write-Host "  Hentikan server : tekan Ctrl + C" -ForegroundColor DarkGray
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

# Coba buka browser otomatis
try { Start-Process $prefix } catch {}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response

        # Tentukan path file yang diminta
        $relPath = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($relPath)) { $relPath = 'index.html' }

        $fullPath = Join-Path $root $relPath

        # Cegah akses keluar dari folder root (path traversal)
        $resolvedRoot = [System.IO.Path]::GetFullPath($root)
        $resolvedFile = [System.IO.Path]::GetFullPath($fullPath)
        if (-not $resolvedFile.StartsWith($resolvedRoot)) {
            $res.StatusCode = 403
            $res.Close()
            continue
        }

        if (Test-Path $fullPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $ctype = $mime[$ext]
            if (-not $ctype) { $ctype = 'application/octet-stream' }

            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $res.ContentType = $ctype
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host ("  200  /{0}" -f $relPath) -ForegroundColor DarkGray
        }
        else {
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - Berkas tidak ditemukan: $relPath")
            $res.StatusCode = 404
            $res.ContentType = 'text/plain; charset=utf-8'
            $res.OutputStream.Write($msg, 0, $msg.Length)
            Write-Host ("  404  /{0}" -f $relPath) -ForegroundColor Yellow
        }

        $res.OutputStream.Close()
    }
    catch {
        # Abaikan error koneksi tunggal agar server tetap jalan
    }
}

$listener.Stop()
