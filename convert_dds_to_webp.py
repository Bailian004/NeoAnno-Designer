#!/usr/bin/env python3
"""Convert all DDS files in a directory to WebP format."""

import os
import sys
from pathlib import Path
from PIL import Image

def convert_dds_to_webp(input_dir):
    """Convert all .dds files in the given directory and subdirectories to .webp format."""
    input_path = Path(input_dir)
    
    if not input_path.exists():
        print(f"Error: Directory {input_dir} does not exist")
        return
    
    # Find all .dds files recursively in the directory and subdirectories
    dds_files = list(input_path.rglob("*.dds"))
    total_files = len(dds_files)
    
    if total_files == 0:
        print(f"No .dds files found in {input_dir}")
        return
    
    print(f"Found {total_files} .dds files to convert")
    
    converted = 0
    failed = 0
    
    for i, dds_file in enumerate(dds_files, 1):
        webp_file = dds_file.with_suffix(".webp")
        
        try:
            # Open and convert the DDS file
            with Image.open(dds_file) as img:
                # Convert RGBA to RGB if needed for WebP
                if img.mode in ('RGBA', 'LA'):
                    # Keep alpha channel
                    img.save(webp_file, 'WEBP', quality=90, method=6)
                else:
                    img.save(webp_file, 'WEBP', quality=90, method=6)
            
            converted += 1
            if i % 100 == 0:
                print(f"Progress: {i}/{total_files} files processed...")
        
        except Exception as e:
            print(f"Failed to convert {dds_file.name}: {e}")
            failed += 1
    
    print(f"\nConversion complete!")
    print(f"Successfully converted: {converted} files")
    if failed > 0:
        print(f"Failed: {failed} files")

if __name__ == "__main__":
    input_dir = "/workspaces/NeoAnno-Designer/public/3dicons"
    convert_dds_to_webp(input_dir)
