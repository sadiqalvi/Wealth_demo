$f = "c:\Users\DELL\Desktop\ahmerhkhan pypsx_papertrading main nayaypaydemo\components\admin-partner-view.tsx"
$c = Get-Content $f -Raw -Encoding utf8
$c = $c -replace 'nayapay-orange','rev-purple'
$c = $c -replace 'nayapay-teal','rev-cyan'
$c = $c -replace 'nayapay-shell','rev-shell'
$c = $c -replace 'nayapay-ink','rev-ink'
$c = $c -replace 'nayapay-muted','rev-muted'
$c = $c -replace 'nayapay-border','rev-border'
$c = $c -replace 'bg-white','bg-rev-surface'
$c = $c -replace 'bg-slate-50','bg-rev-card'
$c = $c -replace 'bg-slate-100','bg-rev-card'
$c = $c -replace 'bg-\[#F5F7FA\]','bg-rev-bg'
$c = $c -replace 'border-slate-200','border-rev-border'
$c = $c -replace 'text-slate-400','text-rev-muted'
$c = $c -replace 'text-slate-500','text-rev-muted'
$c = $c -replace 'text-slate-600','text-rev-muted'
$c = $c -replace 'NayaPay','Liquidity-Wealth'
[System.IO.File]::WriteAllText($f, $c, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done - admin colors replaced"
