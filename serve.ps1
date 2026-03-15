$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://+:8080/')
$listener.Start()
Write-Host "Serveur local démarré sur http://localhost:8080"
Write-Host "Appuyez sur Ctrl+C pour arrêter."

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $path = $req.Url.AbsolutePath.TrimStart('/')
        if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }
        $file = Join-Path (Get-Location) $path

        if (Test-Path $file) {
            $bytes = [System.IO.File]::ReadAllBytes($file)
            $ctx.Response.ContentType = switch ([System.IO.Path]::GetExtension($file).ToLower()) {
                '.html' { 'text/html' }
                '.css' { 'text/css' }
                '.js' { 'application/javascript' }
                '.json' { 'application/json' }
                '.png' { 'image/png' }
                '.jpg' { 'image/jpeg' }
                '.jpeg' { 'image/jpeg' }
                '.svg' { 'image/svg+xml' }
                default { 'application/octet-stream' }
            }
            $ctx.Response.ContentLength64 = $bytes.Length
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $ctx.Response.StatusCode = 404
            $resp = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
            $ctx.Response.OutputStream.Write($resp,0,$resp.Length)
        }
        $ctx.Response.OutputStream.Close()
    } catch {
        # ignore
    }
}
$listener.Stop()
