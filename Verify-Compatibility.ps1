[CmdletBinding()]
param(
    [string]$ResourcesPath
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ResourcesPath)) {
    $ResourcesPath = Join-Path $env:LOCALAPPDATA 'Programs\Pen\resources'
}

$resources = (Resolve-Path -LiteralPath $ResourcesPath).Path
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    throw '未找到 Node.js。请安装 Node.js 18 或更高版本，然后重新运行此脚本。'
}

$nodePath = $node.Source
$patcherPath = Join-Path $PSScriptRoot 'scripts\apply-static-ui.cjs'
& $nodePath $patcherPath --pen-resources $resources --check
if ($LASTEXITCODE -ne 0) {
    throw "兼容性检查失败，Node.js 退出代码：$LASTEXITCODE"
}
