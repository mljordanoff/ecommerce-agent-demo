$pptFile = "Agente_Ecommerce_Baufest_2026_v4.pptx"
$zipFile = "temp_ppt.zip"
$tempDir = "temp_ppt"

if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
if (Test-Path $zipFile) {
    Remove-Item -Force $zipFile
}

# Copy pptx to zip
Copy-Item $pptFile $zipFile

# Unzip the zip
Expand-Archive -Path $zipFile -DestinationPath $tempDir -Force

# Get slide files and sort them numerically
$slides = Get-ChildItem "$tempDir\ppt\slides\slide*.xml" | Where-Object { $_.Name -match 'slide(\d+)\.xml' } | Sort-Object { 
    if ($_.Name -match 'slide(\d+)\.xml') { [int]$Matches[1] } else { 999 }
}

$report = @()
foreach ($slide in $slides) {
    if ($slide.Name -match 'slide(\d+)\.xml') {
        $slideNum = [int]$Matches[1]
        $content = Get-Content $slide.FullName -Raw
        # Extract text between <a:t> and </a:t>
        $textRuns = [regex]::Matches($content, '<a:t>(.*?)</a:t>') | ForEach-Object { $_.Groups[1].Value }
        
        $slideText = $textRuns -join " "
        # Decode basic XML entities
        $slideText = $slideText -replace '&amp;', '&' -replace '&lt;', '<' -replace '&gt;', '>' -replace '&quot;', '"' -replace '&apos;', "'"
        
        $report += "=== Slide $slideNum ==="
        $report += $slideText
        $report += ""
    }
}

$report | Out-File -FilePath "extracted_text.txt" -Encoding utf8
Remove-Item -Recurse -Force $tempDir
Remove-Item -Force $zipFile
Write-Output "Successfully extracted text to extracted_text.txt"
