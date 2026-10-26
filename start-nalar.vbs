Set shell = CreateObject("WScript.Shell")
Set fileSystem = CreateObject("Scripting.FileSystemObject")
projectDirectory = fileSystem.GetParentFolderName(WScript.ScriptFullName)
logDirectory = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Nalar"

If Not fileSystem.FolderExists(logDirectory) Then
  fileSystem.CreateFolder(logDirectory)
End If

command = "cmd.exe /c cd /d """ & projectDirectory & """ && npm.cmd run build && npm.cmd start >> """ & logDirectory & "\server.log"" 2>&1"
shell.Run command, 0, False
