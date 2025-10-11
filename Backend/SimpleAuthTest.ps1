# Simple test to verify BCrypt password hashing works
# This tests the core authentication logic without database dependencies

Write-Host "Testing BCrypt Password Hashing" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Test password hashing
$password = "TestPassword123!"
Write-Host "`nOriginal Password: $password" -ForegroundColor Yellow

try {
    # Load the BCrypt assembly
    Add-Type -Path ".\bin\Debug\net8.0\BCrypt.Net-Next.dll"
    
    # Hash the password
    $hashedPassword = [BCrypt.Net.BCrypt]::HashPassword($password, [BCrypt.Net.BCrypt]::GenerateSalt(12))
    Write-Host "✅ Password hashed successfully!" -ForegroundColor Green
    Write-Host "Hashed Password: $($hashedPassword.Substring(0, 50))..." -ForegroundColor Cyan
    
    # Verify the password
    $isValid = [BCrypt.Net.BCrypt]::Verify($password, $hashedPassword)
    if ($isValid) {
        Write-Host "✅ Password verification successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Password verification failed!" -ForegroundColor Red
    }
    
    # Test with wrong password
    $wrongPassword = "WrongPassword123!"
    $isValidWrong = [BCrypt.Net.BCrypt]::Verify($wrongPassword, $hashedPassword)
    if (-not $isValidWrong) {
        Write-Host "✅ Wrong password correctly rejected!" -ForegroundColor Green
    } else {
        Write-Host "❌ Wrong password incorrectly accepted!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ BCrypt test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "This might be because the BCrypt assembly isn't loaded properly." -ForegroundColor Yellow
    Write-Host "The authentication system should still work when the backend is running." -ForegroundColor Yellow
}

Write-Host "`n=================================" -ForegroundColor Green
Write-Host "BCrypt Test Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
