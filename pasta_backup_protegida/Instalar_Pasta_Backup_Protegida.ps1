# ZELO — Instalar a pasta de backup protegida (correr uma vez por computador)
#
# O que este script faz:
#  1. Cria a pasta de backup no local escolhido.
#  2. Aplica um ícone próprio à pasta (cadeado).
#  3. Esconde a pasta da navegação normal do Explorador (atributos Oculto+Sistema)
#     — continua acessível de forma directa (pelo caminho) tanto pelo botão
#     "Escolher pasta" do sistema ZELO como pelo atalho criado no ambiente
#     de trabalho, que pede o código de acesso.
#  4. Bloqueia, ao nível do Windows (permissões NTFS), que contas
#     "Utilizador padrão" apaguem a pasta ou o que está lá dentro — só uma
#     conta de Administrador consegue remover isto de propósito.
#  5. Cria um atalho "Abrir Backup ZELO" no ambiente de trabalho de todos os
#     utilizadores, protegido por código, com o mesmo ícone de cadeado.
#
# IMPORTANTE — para a protecção contra apagar ter efeito real, os
# funcionários têm de iniciar sessão no Windows com uma conta "Padrão"
# (não Administrador). Numa conta de Administrador, o Windows nunca pode
# impedir esse utilizador de remover a restrição se ele quiser.
#
# Tem de ser executado como Administrador (o script pede elevação sozinho).

$ErrorActionPreference = 'Stop'

# ── 1. Garantir privilégios de Administrador ────────────────────────────
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)) {
    Write-Host 'A pedir privilégios de Administrador...' -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Add-Type -AssemblyName System.Windows.Forms

Write-Host ''
Write-Host '=== ZELO — Instalar pasta de backup protegida ===' -ForegroundColor Cyan
Write-Host ''

# ── 2. Escolher o local da pasta ────────────────────────────────────────
$destinoDefeito = Join-Path $env:PUBLIC 'ZELO_Backup_Hospital'
$destino = Read-Host "Caminho da pasta de backup [Enter para usar $destinoDefeito]"
if ([string]::IsNullOrWhiteSpace($destino)) { $destino = $destinoDefeito }

if (-not (Test-Path $destino)) {
    New-Item -ItemType Directory -Path $destino -Force | Out-Null
    Write-Host "Pasta criada: $destino" -ForegroundColor Green
} else {
    Write-Host "A usar a pasta já existente: $destino" -ForegroundColor Yellow
}
$destino = (Resolve-Path $destino).Path

# ── 3. Definir o código de acesso ───────────────────────────────────────
function Get-Sha256Hex([string]$texto) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($texto)
    $hash = $sha.ComputeHash($bytes)
    -join ($hash | ForEach-Object { $_.ToString('x2') })
}

$codigo = $null
do {
    $s1 = Read-Host 'Define um código de acesso (números/letras)' -AsSecureString
    $s2 = Read-Host 'Confirma o código' -AsSecureString
    $p1 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s1))
    $p2 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s2))
    if ([string]::IsNullOrWhiteSpace($p1)) {
        Write-Host 'O código não pode estar vazio.' -ForegroundColor Red
    } elseif ($p1 -ne $p2) {
        Write-Host 'Os códigos não coincidem. Tenta outra vez.' -ForegroundColor Red
    } else {
        $codigo = $p1
    }
} while (-not $codigo)

# ── 4. Guardar configuração (só o hash do código, nunca em texto simples) em ProgramData ──
$pastaConfig = Join-Path $env:ProgramData 'ZELO_Backup'
if (-not (Test-Path $pastaConfig)) { New-Item -ItemType Directory -Path $pastaConfig -Force | Out-Null }

$cfg = @{ pasta = $destino; hash = (Get-Sha256Hex $codigo) } | ConvertTo-Json
Set-Content -Path (Join-Path $pastaConfig 'config.json') -Value $cfg -Encoding UTF8

# Copiar o launcher para junto da configuração
$launcherOrigem = Join-Path $PSScriptRoot 'AbrirPastaBackup.ps1'
$launcherDestino = Join-Path $pastaConfig 'AbrirPastaBackup.ps1'
Copy-Item -Path $launcherOrigem -Destination $launcherDestino -Force

# Proteger também a pasta de configuração contra apagar por contas padrão
icacls $pastaConfig /inheritance:r | Out-Null
icacls $pastaConfig /grant:r '*S-1-5-32-544:(OI)(CI)F' | Out-Null   # Administradores: controlo total
icacls $pastaConfig /grant:r '*S-1-5-18:(OI)(CI)F' | Out-Null       # SYSTEM: controlo total
icacls $pastaConfig /grant:r '*S-1-5-32-545:(OI)(CI)RX' | Out-Null  # Utilizadores: ler/executar
Write-Host 'Configuração guardada e protegida.' -ForegroundColor Green

# ── 5. Ícone próprio para a pasta de backup (desktop.ini) ───────────────
$desktopIni = @"
[.ShellClassInfo]
IconResource=%SystemRoot%\System32\shell32.dll,46
InfoTip=Pasta de backup protegida do sistema ZELO - Hospital do Prenda
"@
$desktopIniPath = Join-Path $destino 'desktop.ini'
Set-Content -Path $desktopIniPath -Value $desktopIni -Encoding ASCII
attrib +h +s $desktopIniPath
attrib +r $destino
Write-Host 'Ícone aplicado à pasta.' -ForegroundColor Green

# ── 6. Esconder a pasta da navegação normal (não da app nem do atalho) ──
attrib +h +s $destino
Write-Host 'Pasta ocultada da navegação normal do Explorador.' -ForegroundColor Green

# ── 7. Impedir contas padrão de apagar a pasta ou o seu conteúdo ────────
# Nega especificamente "Apagar" e "Apagar subpastas/ficheiros" ao grupo
# incorporado "Utilizadores" (contas padrão), preservando leitura/escrita
# — o sistema ZELO continua a conseguir gravar/actualizar ficheiros de
# backup normalmente, só não é possível eliminá-los por engano.
icacls $destino /deny '*S-1-5-32-545:(OI)(CI)(DE,DC)' | Out-Null
Write-Host 'Protecção contra eliminação aplicada (contas padrão não conseguem apagar).' -ForegroundColor Green

# ── 8. Atalho no ambiente de trabalho (todos os utilizadores) ───────────
$desktopComum = [Environment]::GetFolderPath('CommonDesktopDirectory')
$atalhoPath = Join-Path $desktopComum 'Abrir Backup ZELO.lnk'
$wsh = New-Object -ComObject WScript.Shell
$atalho = $wsh.CreateShortcut($atalhoPath)
$atalho.TargetPath = 'powershell.exe'
$atalho.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherDestino`""
$atalho.IconLocation = 'shell32.dll,46'
$atalho.Description = 'Abrir a pasta de backup protegida do ZELO (pede código)'
$atalho.Save()
Write-Host "Atalho criado no ambiente de trabalho: $atalhoPath" -ForegroundColor Green

# ── Resumo final ──────────────────────────────────────────────────────
Write-Host ''
Write-Host '=== Instalação concluída ===' -ForegroundColor Cyan
Write-Host "Pasta protegida: $destino"
Write-Host ''
Write-Host 'Para ligar esta pasta ao sistema ZELO:' -ForegroundColor Yellow
Write-Host '  1. Abre qualquer página do ZELO no navegador e clica em "Escolher pasta"'
Write-Host '     (no botão de Backup Automático do cabeçalho).'
Write-Host '  2. Como a pasta está oculta, o selector do navegador pode não a mostrar'
Write-Host '     a navegar normalmente — cola este caminho na barra de endereço da'
Write-Host '     janela que abrir e prime Enter:'
Write-Host "       $destino" -ForegroundColor White
Write-Host '  3. Confirma a selecção. A partir daí a app grava aí sozinha.'
Write-Host ''
Write-Host 'Para abrir a pasta manualmente mais tarde (ex.: para copiar os ficheiros' -ForegroundColor Yellow
Write-Host 'para uma pen ou verificar o conteúdo), usa o atalho "Abrir Backup ZELO" no'
Write-Host 'ambiente de trabalho — vai pedir o código que definiste agora.'
Write-Host ''
[System.Windows.Forms.MessageBox]::Show(
    "Pasta de backup protegida criada com sucesso.`n`n$destino`n`nUsa o atalho 'Abrir Backup ZELO' no ambiente de trabalho para lhe aceder (pede o código definido).",
    'ZELO Backup', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information
) | Out-Null
