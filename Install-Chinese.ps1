[CmdletBinding()]
param(
    [string]$ResourcesPath
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ResourcesPath)) {
    $ResourcesPath = Join-Path $env:LOCALAPPDATA 'Programs\Pen\resources'
}

$resources = (Resolve-Path -LiteralPath $ResourcesPath).Path
$asar = Join-Path $resources 'app.asar'
if (-not (Test-Path -LiteralPath $asar -PathType Leaf)) {
    throw "未找到 Pen 安装资源：$asar"
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    throw '未找到 Node.js。请安装 Node.js 18 或更高版本，然后重新运行此脚本。'
}

Write-Host "目标目录：$resources"
Write-Host '正在生成静态简体中文资源…'
$nodePath = $node.Source
$patcherPath = Join-Path $PSScriptRoot 'scripts\apply-static-ui.cjs'
& $nodePath $patcherPath --pen-resources $resources
if ($LASTEXITCODE -ne 0) {
    throw "汉化未完成，Node.js 退出代码：$LASTEXITCODE"
}

Write-Host '完成。现在可以启动 Pen。' -ForegroundColor Green
