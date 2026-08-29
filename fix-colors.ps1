$f = "c:\Users\DELL\Desktop\ahmerhkhan pypsx_papertrading main nayaypaydemo\components\consumer-demo-app.tsx"
$c = Get-Content $f -Raw -Encoding utf8
$c = $c -replace 'nayapay-orange','rev-purple'
$c = $c -replace 'nayapay-teal','rev-cyan'
$c = $c -replace 'nayapay-shell','rev-shell'
$c = $c -replace 'nayapay-ink','rev-ink'
$c = $c -replace 'nayapay-muted','rev-muted'
$c = $c -replace 'nayapay-border','rev-border'
$c = $c -replace 'bg-white','bg-rev-surface'
$c = $c -replace 'bg-slate-50','bg-rev-bg'
$c = $c -replace 'bg-slate-100','bg-rev-card'
$c = $c -replace 'bg-slate-900','bg-rev-bg'
$c = $c -replace 'bg-slate-950','bg-rev-bg'
$c = $c -replace 'border-slate-200','border-rev-border'
$c = $c -replace 'border-slate-800','border-rev-border'
$c = $c -replace 'text-slate-400','text-rev-muted'
$c = $c -replace 'text-slate-500','text-rev-muted'
$c = $c -replace 'text-slate-900','text-rev-ink'
$c = $c -replace 'NayaPay','Liquidity'
$c = $c -replace 'nayapay_demo_user','lw_demo_user'
[System.IO.File]::WriteAllText($f, $c, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done - color tokens replaced"
