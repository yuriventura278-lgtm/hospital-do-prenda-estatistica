# ZELO — Abrir a pasta de backup protegida (pede código de acesso)
# Este ficheiro é copiado para C:\ProgramData\ZELO_Backup\ pelo instalador
# e é o que o atalho "Abrir Backup ZELO" no ambiente de trabalho executa.

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$configPath = Join-Path $env:ProgramData 'ZELO_Backup\config.json'

if (-not (Test-Path $configPath)) {
    [System.Windows.Forms.MessageBox]::Show(
        "A pasta de backup protegida ainda não foi configurada neste computador." + [Environment]::NewLine +
        "Executa primeiro o 'Instalar_Pasta_Backup_Protegida.ps1' como Administrador.",
        "ZELO Backup", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
    exit 1
}

$cfg = Get-Content $configPath -Raw | ConvertFrom-Json

function Get-Sha256Hex([string]$texto) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($texto)
    $hash = $sha.ComputeHash($bytes)
    -join ($hash | ForEach-Object { $_.ToString('x2') })
}

function Read-CodigoAcesso([string]$mensagem) {
    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'ZELO — Pasta de Backup Protegida'
    $form.Size = New-Object System.Drawing.Size(380, 170)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.TopMost = $true

    $label = New-Object System.Windows.Forms.Label
    $label.Text = $mensagem
    $label.Location = New-Object System.Drawing.Point(20, 18)
    $label.Size = New-Object System.Drawing.Size(330, 20)
    $form.Controls.Add($label)

    $textbox = New-Object System.Windows.Forms.TextBox
    $textbox.Location = New-Object System.Drawing.Point(20, 45)
    $textbox.Size = New-Object System.Drawing.Size(320, 24)
    $textbox.UseSystemPasswordChar = $true
    $form.Controls.Add($textbox)

    $okButton = New-Object System.Windows.Forms.Button
    $okButton.Text = 'Entrar'
    $okButton.Location = New-Object System.Drawing.Point(175, 85)
    $okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
    $form.Controls.Add($okButton)
    $form.AcceptButton = $okButton

    $cancelButton = New-Object System.Windows.Forms.Button
    $cancelButton.Text = 'Cancelar'
    $cancelButton.Location = New-Object System.Drawing.Point(265, 85)
    $cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.Controls.Add($cancelButton)
    $form.CancelButton = $cancelButton

    $form.Add_Shown({ $textbox.Focus() })
    $result = $form.ShowDialog()
    if ($result -eq [System.Windows.Forms.DialogResult]::OK) { return $textbox.Text }
    return $null
}

$tentativas = 0
$maxTentativas = 3
$ok = $false

while ($tentativas -lt $maxTentativas -and -not $ok) {
    $restantes = $maxTentativas - $tentativas
    $codigo = Read-CodigoAcesso "Introduz o código de acesso ($restantes tentativa(s)):"
    if ($null -eq $codigo) { exit 0 }  # utilizador cancelou
    $tentativas++
    if ((Get-Sha256Hex $codigo) -eq $cfg.hash) {
        $ok = $true
    } else {
        [System.Windows.Forms.MessageBox]::Show(
            "Código incorrecto.", "ZELO Backup",
            [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning
        ) | Out-Null
    }
}

if ($ok) {
    if (Test-Path $cfg.pasta) {
        Start-Process explorer.exe -ArgumentList "`"$($cfg.pasta)`""
    } else {
        [System.Windows.Forms.MessageBox]::Show(
            "A pasta configurada já não existe:`n$($cfg.pasta)", "ZELO Backup",
            [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error
        ) | Out-Null
    }
} else {
    [System.Windows.Forms.MessageBox]::Show(
        "Acesso negado — número de tentativas excedido.", "ZELO Backup",
        [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
}
