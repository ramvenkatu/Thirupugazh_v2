#Requires -Version 5.1

<#
.SYNOPSIS
    Creates a new database and a 'playlist_history' table in a local MySQL server.
.DESCRIPTION
    This script connects to a local MySQL instance, creates a new database
    using utf8mb4 character set, and then creates a 'playlist_history' table within it.
    It securely prompts for the MySQL user's credentials and uses a temporary
    config file for authentication, which is more reliable.
.PARAMETER DatabaseName
    The name of the database you want to create (e.g., "thirupugazh_db").
.EXAMPLE
    .\Create-MySqlDatabase.ps1 -DatabaseName "thirupugazh_db"
#>
[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, HelpMessage = "Enter the name for the new database.")]
    [string]$DatabaseName,

    [Parameter(Mandatory = $false, HelpMessage = "Enter your MySQL username.")]
    [string]$MySqlUser = "root",

    [Parameter(Mandatory = $false, HelpMessage = "Path to mysql.exe if not in PATH.")]
    [string]$MySqlExecutablePath = "mysql.exe"
)

# --- Main Script ---

# Define a path for the temporary config file
$tempConfigFile = Join-Path $env:TEMP ([System.IO.Path]::GetRandomFileName() + ".cnf")

try {
    # Check if the mysql executable can be found
    if (-not (Get-Command $MySqlExecutablePath -ErrorAction SilentlyContinue)) {
        throw "MySQL executable not found at '$MySqlExecutablePath'. Please ensure MySQL client is installed and the path is correct or is in your system's PATH."
    }

    Write-Host "Please enter the credentials for your MySQL user."

    # Securely prompt for the username and password. The -UserName parameter pre-fills the username field.
    $credential = Get-Credential -UserName $MySqlUser -Message "Enter MySQL Credentials"
    $password = $credential.GetNetworkCredential().Password
    $usernameForCommand = $credential.UserName

    # --- Create a temporary config file for authentication ---
    $configFileContent = @"
[client]
user="$($usernameForCommand)"
password="$($password)"
"@
    Set-Content -Path $tempConfigFile -Value $configFileContent
    # --- End Modification ---

    Write-Host "Attempting to connect as user '$($usernameForCommand)' to set up database '$($DatabaseName)'."

    # The multi-statement SQL command to be executed.
    # MODIFIED: Combined all SQL statements into a single line to avoid newline issues with mysql.exe.
    $sqlCommand = "CREATE DATABASE IF NOT EXISTS $($DatabaseName) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; USE $($DatabaseName); CREATE TABLE IF NOT EXISTS playlist_history (id INT AUTO_INCREMENT PRIMARY KEY, song_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_song_id (song_id), INDEX idx_created_at (created_at));"


    # Construct the arguments for mysql.exe
    # Using the temporary config file for credentials instead of -u and -p
    $arguments = @(
        "--defaults-extra-file=$($tempConfigFile)",
        "-e", $sqlCommand
    )

    Write-Host "Executing setup script using a temporary config file..."
    
    # Execute the command
    $result = & $MySqlExecutablePath @arguments 2>&1

    # Check the result
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully executed setup script for database '$($DatabaseName)'." -ForegroundColor Green
    }
    else {
        # Output any errors from MySQL
        Write-Error "Failed to execute setup script. MySQL returned an error: $($result | Out-String)"
    }
}
catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
}
finally {
    # --- IMPORTANT: Clean up the temporary config file ---
    if (Test-Path $tempConfigFile) {
        Remove-Item $tempConfigFile -Force
        Write-Host "Temporary credentials file has been removed."
    }
}
