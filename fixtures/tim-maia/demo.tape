# VHS Demo for foam-habits
# https://github.com/charmbracelet/vhs
#
# Run with: vhs demo.tape

Output demo.gif

Set FontSize 16
Set Width 960
Set Height 440
Set Theme "Catppuccin Mocha"
Set Padding 20

Type "npx foam-habits --reference-date 1989-04-06"
Sleep 300ms
Enter
Sleep 4s

Type "# Show more weeks with --weeks flag"
Sleep 1s
Enter
Sleep 300ms

Type "npx foam-habits --weeks 8 --reference-date 1989-04-06"
Sleep 500ms
Enter
Sleep 3s

Type "# Or view only the current month"
Sleep 1s
Enter
Sleep 500ms

Type "npx foam-habits --current-month --reference-date 1989-04-06"
Sleep 300ms
Enter
Sleep 3s
