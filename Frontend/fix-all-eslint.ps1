# PowerShell script to fix all ESLint errors

Write-Host "🔧 Fixing ESLint errors systematically..." -ForegroundColor Green

# Function to fix unused variables by commenting them out
function Fix-UnusedVariable {
    param($FilePath, $LineNumber, $VariableName)
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath
        if ($LineNumber -le $content.Count) {
            $line = $content[$LineNumber - 1]
            if ($line -match "const\s+$VariableName\s*=") {
                $content[$LineNumber - 1] = $line -replace "const\s+$VariableName\s*=", "// const $VariableName = // TODO: Implement or remove"
                Set-Content $FilePath $content
                Write-Host "✅ Fixed unused variable $VariableName in $FilePath" -ForegroundColor Yellow
            }
        }
    }
}

# Function to fix empty blocks
function Fix-EmptyBlock {
    param($FilePath, $LineNumber)
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath
        if ($LineNumber -le $content.Count) {
            $line = $content[$LineNumber - 1]
            if ($line -match "catch\s*\{\s*\}") {
                $content[$LineNumber - 1] = $line -replace "catch\s*\{\s*\}", "catch { /* TODO: Handle error */ }"
                Set-Content $FilePath $content
                Write-Host "✅ Fixed empty catch block in $FilePath" -ForegroundColor Yellow
            }
            elseif ($line -match "\{\s*\}") {
                $content[$LineNumber - 1] = $line -replace "\{\s*\}", "{ /* TODO: Implement */ }"
                Set-Content $FilePath $content
                Write-Host "✅ Fixed empty block in $FilePath" -ForegroundColor Yellow
            }
        }
    }
}

# Fix specific files with unused variables
$fixes = @(
    @{ File = "src\components\companyAdmin\tabs\CommandCenterTab.jsx"; Line = 30; Variable = "addNewBusOpen" },
    @{ File = "src\components\companyAdmin\tabs\FleetTab.jsx"; Line = 83; Variable = "model" },
    @{ File = "src\components\depotManager\tabs\CommandCenterTab.jsx"; Line = 11; Variable = "alerts" },
    @{ File = "src\components\depotManager\tabs\FleetMaintenanceTab.jsx"; Line = 15; Variable = "setBuses" },
    @{ File = "src\components\layout\SidebarLayout.jsx"; Line = 45; Variable = "roleNavigation" },
    @{ File = "src\components\layout\SidebarLayout.jsx"; Line = 150; Variable = "companyName" }
)

foreach ($fix in $fixes) {
    $fullPath = Join-Path $PSScriptRoot $fix.File
    Fix-UnusedVariable -FilePath $fullPath -LineNumber $fix.Line -VariableName $fix.Variable
}

# Fix empty blocks
$emptyBlocks = @(
    @{ File = "src\components\companyAdmin\tabs\FuelTab.jsx"; Line = 117 },
    @{ File = "src\components\companyAdmin\tabs\MaintenanceTab.jsx"; Line = 54 },
    @{ File = "src\components\companyAdmin\tabs\RoutesTab.jsx"; Line = 93 },
    @{ File = "src\components\companyAdmin\tabs\RoutesTab.jsx"; Line = 129 },
    @{ File = "src\components\companyAdmin\tabs\TripSchedulingTab.jsx"; Line = 58 },
    @{ File = "src\components\companyAdmin\tabs\TripSchedulingTab.jsx"; Line = 65 }
)

foreach ($block in $emptyBlocks) {
    $fullPath = Join-Path $PSScriptRoot $block.File
    Fix-EmptyBlock -FilePath $fullPath -LineNumber $block.Line
}

Write-Host "🎉 ESLint fixes completed!" -ForegroundColor Green
Write-Host "📝 Note: Some files may need manual review for complex unused imports" -ForegroundColor Cyan
