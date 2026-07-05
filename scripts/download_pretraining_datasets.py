#!/usr/bin/env python3
"""
Downloads sample pretraining datasets for KernelSense AI modeling.
Must be run from the repository root.
"""
import os
import json
import urllib.request
import zipfile

OUTPUT_DIR = os.path.join("backend", "tests", "fixtures", "pretraining")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def download_lttng_traces():
    url = "https://github.com/lttng/lttng-ref-traces/archive/refs/heads/master.zip"
    dest_zip = os.path.join(OUTPUT_DIR, "lttng-ref-traces.zip")
    extract_dir = os.path.join(OUTPUT_DIR, "lttng")
    
    print(f"Downloading LTTng Reference Traces from {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response, open(dest_zip, 'wb') as out_file:
        out_file.write(response.read())
    
    print("Extracting LTTng traces...")
    with zipfile.ZipFile(dest_zip, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)
        
    os.remove(dest_zip)
    print("LTTng traces downloaded successfully.\n")

def download_zenodo_kernel_dataset():
    # Zenodo Record 14679675 - Kernel Function Time Measurement Dataset
    api_url = "https://zenodo.org/api/records/14679675"
    dest_dir = os.path.join(OUTPUT_DIR, "zenodo_kernel_dataset")
    os.makedirs(dest_dir, exist_ok=True)
    
    print(f"Querying Zenodo API for Record 14679675...")
    try:
        req = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        
        files = data.get("files", [])
        if not files:
            print("No files found in Zenodo record.")
            return
            
        for f in files:
            # Download the first available dataset file
            download_url = f["links"]["self"]
            filename = f["key"]
            dest_file = os.path.join(dest_dir, filename)
            
            print(f"Downloading {filename} from {download_url}...")
            file_req = urllib.request.Request(download_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(file_req) as d_response, open(dest_file, 'wb') as d_out:
                d_out.write(d_response.read())
            
            if filename.endswith(".zip"):
                print(f"Extracting {filename}...")
                with zipfile.ZipFile(dest_file, 'r') as zip_ref:
                    zip_ref.extractall(dest_dir)
                os.remove(dest_file)
            
            # We just need one sample file for provenance
            break
            
        print("Zenodo Kernel Dataset downloaded successfully.\n")
    except Exception as e:
        print(f"Failed to download Zenodo dataset: {e}")

if __name__ == "__main__":
    print("Starting dataset download...\n")
    download_lttng_traces()
    download_zenodo_kernel_dataset()
    print(f"All downloads complete. Data stored in {OUTPUT_DIR}")
