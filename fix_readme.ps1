$bytes = [System.IO.File]::ReadAllBytes("c:\Users\ADMiN\OneDrive\Desktop\Cova Vault\cova-vault\README.md")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$replaced = $text -replace ([char]0xFFFD), '-'
$newBytes = [System.Text.Encoding]::UTF8.GetBytes($replaced)
[System.IO.File]::WriteAllBytes("c:\Users\ADMiN\OneDrive\Desktop\Cova Vault\cova-vault\README.md", $newBytes)
Write-Output "Done. Tail of file:"
Get-Content "c:\Users\ADMiN\OneDrive\Desktop\Cova Vault\cova-vault\README.md" -Tail 5
