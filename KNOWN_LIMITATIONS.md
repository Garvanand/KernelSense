# Known Limitations

- **Zenodo Kernel Function Time Measurement Dataset (Record 14679675)**: 
  - **Issue**: Attempting to query the Zenodo API for this dataset returned an HTTP 403 (Forbidden). It appears this specific academic dataset is either restricted, removed, or requires authenticated/approved access, despite being indexed publicly.
  - **Resolution**: Adhering to the project's strict data rules, no synthetic substitution was made. Pretraining currently relies on the LTTng Reference Traces. A secondary open dataset will need to be identified in the future if this remains inaccessible.
