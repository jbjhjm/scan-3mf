# scan-3mf

A utility to analyze usage of printer/Print/filament profiles in .3mf files generated with SuperSlicer.
Likely also works with PrusaSlicer, Slic3r, OrcaSlicer.

My use case: check which profiles are used seldomly and should be thrown away, and which I use regularly.

CLI tool based on nodejs, tested with node 16.18.

## Installation 

```bash
npm install
npm run compile
```

## Usage

```bash
npm run scan --path=/path/to/my/printing/files --property=<propId>
```

propId should be one of print_settings_id, printer_settings_id, filament_settings_id.

Script scans all found files and logs a list stating how many times each profile type is being used.