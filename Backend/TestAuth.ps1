# PowerShell script to test the custom authentication system
# Run this script to test user registration and login

$apiBaseUrl = "http://localhost:5000/api"

Write-Host "Testing Custom Authentication System" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Test 1: Register a new developer user
Write-Host "`n1. Testing User Registration..." -ForegroundColor Yellow

$registerData = @{
    email = "developer@test.com"
    password = "TestPassword123!"
    role = "developer"
    companyId = 1
    name = "Test Developer"
    phoneNumber = "1234567890"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$apiBaseUrl/user/register" -Method POST -Body $registerData -ContentType "application/json"
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "User ID: $($registerResponse.user.id)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error details: $errorBody" -ForegroundColor Red
    }
}

# Test 2: Login with the registered user
Write-Host "`n2. Testing User Login..." -ForegroundColor Yellow

$loginData = @{
    email = "developer@test.com"
    password = "TestPassword123!"
    rememberMe = $true
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$apiBaseUrl/user/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($loginResponse.token.Substring(0, 50))..." -ForegroundColor Cyan
    Write-Host "User Role: $($loginResponse.user.role)" -ForegroundColor Cyan
    Write-Host "Company ID: $($loginResponse.user.companyId)" -ForegroundColor Cyan
    
    # Store token for profile test
    $token = $loginResponse.token
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error details: $errorBody" -ForegroundColor Red
    }
    exit 1
}

# Test 3: Get user profile with token
Write-Host "`n3. Testing Profile Retrieval..." -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $profileResponse = Invoke-RestMethod -Uri "$apiBaseUrl/user/profile" -Method GET -Headers $headers
    Write-Host "✅ Profile retrieval successful!" -ForegroundColor Green
    Write-Host "Email: $($profileResponse.email)" -ForegroundColor Cyan
    Write-Host "Role: $($profileResponse.role)" -ForegroundColor Cyan
    Write-Host "Name: $($profileResponse.name)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Profile retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error details: $errorBody" -ForegroundColor Red
    }
}

# Test 4: Test password change
Write-Host "`n4. Testing Password Change..." -ForegroundColor Yellow

$changePasswordData = @{
    currentPassword = "TestPassword123!"
    newPassword = "NewTestPassword123!"
} | ConvertTo-Json

try {
    $changePasswordResponse = Invoke-RestMethod -Uri "$apiBaseUrl/user/change-password" -Method POST -Body $changePasswordData -ContentType "application/json" -Headers $headers
    Write-Host "✅ Password change successful!" -ForegroundColor Green
    
    # Test login with new password
    $newLoginData = @{
        email = "developer@test.com"
        password = "NewTestPassword123!"
        rememberMe = $true
    } | ConvertTo-Json
    
    $newLoginResponse = Invoke-RestMethod -Uri "$apiBaseUrl/user/login" -Method POST -Body $newLoginData -ContentType "application/json"
    Write-Host "✅ Login with new password successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Password change failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=====================================" -ForegroundColor Green
Write-Host "Authentication System Test Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
