Add-Type -AssemblyName System.Drawing

function Get-Color($hex) {
    return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function Draw-Elements($graphics, $elements) {
    foreach ($element in $elements) {
        $brush = New-Object System.Drawing.SolidBrush (Get-Color $element.Color)
        if ($element.Shape -eq 'ellipse') {
            $graphics.FillEllipse($brush, $element.X, $element.Y, $element.Width, $element.Height)
        }
        else {
            $graphics.FillRectangle($brush, $element.X, $element.Y, $element.Width, $element.Height)
        }
        if ($element.Outline) {
            $pen = New-Object System.Drawing.Pen (Get-Color $element.Outline), $element.OutlineWidth
            if ($element.Shape -eq 'ellipse') {
                $graphics.DrawEllipse($pen, $element.X, $element.Y, $element.Width, $element.Height)
            }
            else {
                $graphics.DrawRectangle($pen, $element.X, $element.Y, $element.Width, $element.Height)
            }
            $pen.Dispose()
        }
        $brush.Dispose()
    }
}

function New-SampleImage {
    param(
        [string]$Path,
        [string]$Title,
        [string]$Subtitle,
        [string]$Background = '#f7f4ef',
        [string]$Accent = '#e7ded3',
        [string]$Floor = '#cebca5',
        [array]$Elements = @()
    )

    $width = 1280
    $height = 960
    $bitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle(0, 0, $width, $height)),
        (Get-Color $Background),
        (Get-Color $Accent),
        90
    )
    $graphics.FillRectangle($backgroundBrush, 0, 0, $width, $height)
    $backgroundBrush.Dispose()

    $floorBrush = New-Object System.Drawing.SolidBrush (Get-Color $Floor)
    $graphics.FillRectangle($floorBrush, 0, [int]($height * 0.62), $width, [int]($height * 0.38))
    $floorBrush.Dispose()

    $windowBrush = New-Object System.Drawing.SolidBrush (Get-Color '#ffffff')
    $framePen = New-Object System.Drawing.Pen (Get-Color '#cfd4da'), 10
    $windowWidth = [int]($width * 0.25)
    $windowHeight = [int]($height * 0.25)
    $windowX = [int](($width - $windowWidth) / 2)
    $windowY = 150
    $graphics.FillRectangle($windowBrush, $windowX, $windowY, $windowWidth, $windowHeight)
    $graphics.DrawRectangle($framePen, $windowX, $windowY, $windowWidth, $windowHeight)
    $framePen.Dispose()
    $windowBrush.Dispose()

    Draw-Elements -graphics $graphics -elements $Elements

    $titleFont = New-Object System.Drawing.Font('Segoe UI', 48, [System.Drawing.FontStyle]::Bold)
    $subtitleFont = New-Object System.Drawing.Font('Segoe UI', 28)
    $textBrush = New-Object System.Drawing.SolidBrush (Get-Color '#2e2e2e')
    $graphics.DrawString($Title, $titleFont, $textBrush, 40, 30)
    $graphics.DrawString($Subtitle, $subtitleFont, $textBrush, 44, 110)
    $textBrush.Dispose()
    $titleFont.Dispose()
    $subtitleFont.Dispose()

    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $graphics.Dispose()
    $bitmap.Dispose()
}

$outputDir = Join-Path $PSScriptRoot '../client/public/sample-images'
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

New-SampleImage -Path (Join-Path $outputDir 'living-before.jpg') -Title 'Living Room' -Subtitle 'Before Staging' -Background '#f7f4ef' -Accent '#dcd4c7' -Floor '#d8c4a8'

New-SampleImage -Path (Join-Path $outputDir 'living-after.jpg') -Title 'Living Room' -Subtitle 'After Staging' -Background '#f5f2ec' -Accent '#e0d5c6' -Floor '#cdb69a' -Elements @(
    @{ Shape='rect'; X=180; Y=560; Width=920; Height=220; Color='#ede8e0' },
    @{ Shape='rect'; X=220; Y=520; Width=340; Height=110; Color='#d9d2c2' },
    @{ Shape='rect'; X=620; Y=520; Width=320; Height=110; Color='#f4efe5' },
    @{ Shape='rect'; X=540; Y=660; Width=220; Height=70; Color='#c7b8a7' },
    @{ Shape='ellipse'; X=420; Y=430; Width=420; Height=90; Color='#c0d3cb' },
    @{ Shape='rect'; X=260; Y=360; Width=200; Height=130; Color='#faf9f8'; Outline='#d4cbc0'; OutlineWidth=4 },
    @{ Shape='rect'; X=640; Y=360; Width=280; Height=130; Color='#faf9f8'; Outline='#d4cbc0'; OutlineWidth=4 }
)

New-SampleImage -Path (Join-Path $outputDir 'bed-before.jpg') -Title 'Bedroom' -Subtitle 'Before Staging' -Background '#f6f6fb' -Accent '#e2e7f3' -Floor '#cfd2e3'

New-SampleImage -Path (Join-Path $outputDir 'bed-after.jpg') -Title 'Bedroom' -Subtitle 'After Staging' -Background '#f5f5fb' -Accent '#ece5de' -Floor '#d8d2d1' -Elements @(
    @{ Shape='rect'; X=260; Y=560; Width=760; Height=220; Color='#f3efe9' },
    @{ Shape='rect'; X=360; Y=520; Width=560; Height=90; Color='#e0d6cc' },
    @{ Shape='rect'; X=360; Y=470; Width=560; Height=70; Color='#b3c4d1' },
    @{ Shape='ellipse'; X=320; Y=740; Width=240; Height=50; Color='#c9bbae' },
    @{ Shape='ellipse'; X=760; Y=740; Width=220; Height=50; Color='#c9bbae' },
    @{ Shape='rect'; X=220; Y=360; Width=180; Height=140; Color='#fafafa'; Outline='#d2d2d2'; OutlineWidth=4 },
    @{ Shape='rect'; X=620; Y=360; Width=300; Height=140; Color='#fafafa'; Outline='#d2d2d2'; OutlineWidth=4 },
    @{ Shape='rect'; X=360; Y=650; Width=560; Height=50; Color='#ede5da' }
)
