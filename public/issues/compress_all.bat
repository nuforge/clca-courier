@echo off
for %%F in (*.pdf) do (
    if not "%%F" == "compressed_*" (
        echo Compressing %%F...
        gswin64c -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="compressed_%%F" "%%F"
    )
)
echo All files compressed!
pause