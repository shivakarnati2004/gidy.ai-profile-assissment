$ErrorActionPreference = "Stop"
$ts = Get-Date -Format "yyyyMMddHHmmss"
$password = "P@ssw0rd123!"
$base = "http://localhost:4000"
$web = "http://localhost:8082"
$token = $null
function Get-EnvValue($key) {
  $value = [System.Environment]::GetEnvironmentVariable($key)
  if ($null -ne $value -and $value.Trim() -ne "") {
    return $value.Trim()
  }

  $rootEnvPath = Join-Path $PSScriptRoot ".env"
  if (Test-Path $rootEnvPath) {
    $line = Get-Content $rootEnvPath | Where-Object { $_ -match "^$key=" } | Select-Object -First 1
    if ($null -ne $line -and $line.Trim() -ne "") {
      return ($line -replace "^$key=", '').Trim()
    }
  }

  return $null
}

$demoEmail = Get-EnvValue "DEMO_USER_EMAIL"
$demoPassword = Get-EnvValue "DEMO_USER_PASSWORD"
$signupEmail = $null

if ($demoEmail -and $demoEmail -match "@") {
  $emailParts = $demoEmail.Split("@", 2)
  $localPart = $emailParts[0]
  $domainPart = $emailParts[1]
  $signupEmail = "$localPart+smoke$ts@$domainPart"
} elseif ($demoEmail) {
  $signupEmail = $demoEmail
}

function Step($name, $ok, $status, $msg) {
  $s = if ($ok) { "PASS" } else { "FAIL" }
  Write-Output "[$s] $name | status=$status | $msg"
}

function Get-Status($err) {
  if ($null -ne $err.Exception.Response) {
    return $err.Exception.Response.StatusCode.value__
  }
  return "ERR"
}

function Read-ErrorBody($err) {
  if ($null -ne $err.Exception.Response) {
    try {
      $stream = $err.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      return $reader.ReadToEnd()
    } catch {
      return $err.Exception.Message
    }
  }

  return $err.Exception.Message
}

try {
  $r = Invoke-WebRequest "$base/api/health" -Method GET -UseBasicParsing
  Step "GET /api/health" ($r.StatusCode -eq 200) $r.StatusCode "health reachable"
} catch {
  Step "GET /api/health" $false "ERR" (Read-ErrorBody $_)
}

if ($signupEmail) {
  try {
    $body = @{ email = $signupEmail } | ConvertTo-Json
    $r = Invoke-WebRequest "$base/api/auth/request-otp" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    Step "POST /api/auth/request-otp (signup)" ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) $r.StatusCode "otp request sent to $signupEmail"
  } catch {
    Step "POST /api/auth/request-otp (signup)" $false (Get-Status $_) (Read-ErrorBody $_)
  }

  try {
    $body = @{ email = $signupEmail; code = "000000" } | ConvertTo-Json
    $r = Invoke-WebRequest "$base/api/auth/verify-otp" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    Step "POST /api/auth/verify-otp invalid" $false $r.StatusCode "unexpected success"
  } catch {
    $status = Get-Status $_
    $expected = ($status -ge 400 -and $status -lt 500)
    Step "POST /api/auth/verify-otp invalid" $expected $status "expected invalid code failure"
  }
} else {
  Step "POST /api/auth/request-otp (signup)" $true "SKIP" "DEMO_USER_EMAIL not set; skipped OTP send"
  Step "POST /api/auth/verify-otp invalid" $true "SKIP" "DEMO_USER_EMAIL not set; skipped OTP invalid check"
}

try {
  $body = @{ password = $password; username = "smoke$ts" } | ConvertTo-Json
  $r = Invoke-WebRequest "$base/api/auth/register" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
  Step "POST /api/auth/register without signupToken" $false $r.StatusCode "unexpected success"
} catch {
  $status = Get-Status $_
  $expected = ($status -ge 400 -and $status -lt 500)
  Step "POST /api/auth/register without signupToken" $expected $status "signup token required"
}

try {
  $body = @{ signupToken = "invalid"; password = $password; username = "smoke$ts" } | ConvertTo-Json
  $r = Invoke-WebRequest "$base/api/auth/register" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
  Step "POST /api/auth/register invalid signupToken" $false $r.StatusCode "unexpected success"
} catch {
  $status = Get-Status $_
  $expected = ($status -eq 401 -or $status -eq 404)
  Step "POST /api/auth/register invalid signupToken" $expected $status "expected token validation failure"
}

if ($demoEmail -and $demoPassword) {
  try {
    $body = @{ email = $demoEmail; password = $demoPassword } | ConvertTo-Json
    $r = Invoke-WebRequest "$base/api/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    $j = $r.Content | ConvertFrom-Json
    if ($j.token) { $token = $j.token }
    $username = $j.user.username
    Step "POST /api/auth/login" ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300 -and $null -ne $token -and $null -ne $username) $r.StatusCode "demo login ok"
  } catch {
    Step "POST /api/auth/login" $false (Get-Status $_) (Read-ErrorBody $_)
  }

  try {
    $h = @{ Authorization = "Bearer $token" }
    $r = Invoke-WebRequest "$base/api/profile/$username" -Headers $h -UseBasicParsing
    Step "GET /api/profile/:username" ($r.StatusCode -eq 200) $r.StatusCode "profile fetched"
  } catch {
    Step "GET /api/profile/:username" $false (Get-Status $_) (Read-ErrorBody $_)
  }

  try {
    $h = @{ Authorization = "Bearer $token" }
    $body = @{
      profile = @{
        displayName = "Smoke User"
        bio = "Smoke bio"
        location = "Remote"
      }
      skills = @()
      careerGoals = @(@{ title = "Ship MVP"; description = "Smoke" })
    } | ConvertTo-Json -Depth 8
    $r = Invoke-WebRequest "$base/api/profile/$username" -Method PUT -Headers $h -ContentType "application/json" -Body $body -UseBasicParsing
    Step "PUT /api/profile/:username" ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) $r.StatusCode "updated"
  } catch {
    Step "PUT /api/profile/:username" $false (Get-Status $_) (Read-ErrorBody $_)
  }

  try {
    $h = @{ Authorization = "Bearer $token" }
    $r = Invoke-WebRequest "$base/api/profile/$username" -Headers $h -UseBasicParsing
    $j = $r.Content | ConvertFrom-Json
    $skillsCount = @($j.skills).Count
    $goalsCount = @($j.careerGoals).Count
    $ok = ($j.profile.displayName -eq "Smoke User" -and $j.profile.bio -eq "Smoke bio" -and $skillsCount -eq 0 -and $goalsCount -ge 1)
    Step "GET /api/profile/:username verify" ($r.StatusCode -eq 200 -and $ok) $r.StatusCode "verify updates=$ok"
  } catch {
    Step "GET /api/profile/:username verify" $false (Get-Status $_) (Read-ErrorBody $_)
  }
} else {
  Step "POST /api/auth/login" $true "SKIP" "DEMO_USER_EMAIL/DEMO_USER_PASSWORD not set; skipped authenticated profile checks"
  Step "GET /api/profile/:username" $true "SKIP" "DEMO_USER_EMAIL/DEMO_USER_PASSWORD not set; skipped authenticated profile checks"
  Step "PUT /api/profile/:username" $true "SKIP" "DEMO_USER_EMAIL/DEMO_USER_PASSWORD not set; skipped authenticated profile checks"
  Step "GET /api/profile/:username verify" $true "SKIP" "DEMO_USER_EMAIL/DEMO_USER_PASSWORD not set; skipped authenticated profile checks"
}

try {
  $r = Invoke-WebRequest "$web/login" -UseBasicParsing
  Step "GET frontend /login" ($r.StatusCode -eq 200) $r.StatusCode "reachable"
} catch {
  Step "GET frontend /login" $false "ERR" (Read-ErrorBody $_)
}

try {
  $r = Invoke-WebRequest "$web/profile" -UseBasicParsing
  Step "GET frontend /profile" ($r.StatusCode -eq 200) $r.StatusCode "reachable"
} catch {
  Step "GET frontend /profile" $false "ERR" (Read-ErrorBody $_)
}
