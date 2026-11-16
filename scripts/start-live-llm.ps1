param(
  [string]$BaseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai',
  [string]$Model = 'gemini-3.5-flash-lite',
  [int]$Port = 4000
)
$ErrorActionPreference = 'Stop'
$uri = [Uri]$BaseUrl
if (-not $uri.IsAbsoluteUri -or ($uri.Scheme -ne 'https' -and -not ($uri.Scheme -eq 'http' -and $uri.IsLoopback)) -or $uri.UserInfo -or $uri.Query -or $uri.Fragment) {
  throw 'Use an HTTPS base URL (or loopback HTTP), without credentials or query parameters.'
}
if ([string]::IsNullOrWhiteSpace($Model)) { throw 'Model is required.' }
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
Write-Host 'Enter the provider key locally. It will not be saved to a file or printed.'
Write-Host "Model: $Model"
$credential = Read-Host 'API key' -AsSecureString
$pointer = [IntPtr]::Zero
try {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential)
  $env:LLM_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  if ([string]::IsNullOrWhiteSpace($env:LLM_API_KEY)) { throw 'A key is required.' }
  $env:LLM_BASE_URL = $BaseUrl.TrimEnd('/')
  $env:LLM_MODEL = $Model
  $env:PORT = [string]$Port
  $env:FACADE_DEV = '0'
  $env:LLM_FALLBACK = 'error'
  $env:FACADE_DB = ''
  $env:LLM_MAX_RPM = '10'
  $env:LLM_DAILY_TOKEN_BUDGET = '30000'
  $env:LLM_TIMEOUT_MS = '30000'
  $env:CORS_ORIGIN = 'http://localhost:3000'
  node --experimental-strip-types --no-warnings packages/ai-service-facade/src/main.ts
} finally {
  Remove-Item Env:LLM_API_KEY -ErrorAction SilentlyContinue
  if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
  $credential.Dispose()
}
