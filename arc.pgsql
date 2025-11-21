                ┌────────────────────────┐
                │   Researchers / Labs   │
                │ (MRI, CT, PET centers) │
                └──────────┬─────────────┘
                           │
                           │  Upload large neuroimaging data
                           │  (via Aspera Connect / CLI)
                           ▼
             ┌───────────────────────────────┐
             │  AfNIA Aspera Upload Gateway  │
             │ (IBM Aspera on Cloud or self- │
             │   hosted Aspera Transfer Svr) │
             └──────────┬────────────────────┘
                        │
                        │  Transfers data to secure storage
                        ▼
             ┌───────────────────────────────┐
             │  AfNIA Data Storage (Cloud /  │
             │   Institutional Repository)   │
             └──────────┬────────────────────┘
                        │
                        │  Metadata validation, anonymization
                        ▼
             ┌───────────────────────────────┐
             │   AfNIA Curation & Database   │
             │ (Metadata, dataset indexing)  │
             └──────────┬────────────────────┘
                        │
                        │  Published dataset records
                        ▼
         ┌────────────────────────────────────────┐
         │       AfNIA Web Portal (React/Node)     │
         │ “Explore Datasets”  |  “Contribute Data”│
         └──────────┬──────────────────────────────┘
                    │
                    │  Links to Aspera for download
                    ▼
         ┌────────────────────────────────────────┐
         │        Data Users / Scientists          │
         │  • Browse datasets on AfNIA website     │
         │  • Click “Download via Aspera”          │
         │  • Fast transfer using Aspera Connect   │
         └────────────────────────────────────────┘








                 ┌───────────────────────────┐
                 │   Researchers / Labs      │
                 │ (MRI, CT, PET centers)    │
                 └──────────┬────────────────┘
                            │
                            │ Upload data (BIDS, DICOM, NIfTI)
                            │ via Globus or Dataverse web upload
                            ▼
         ┌────────────────────────────────────────┐
         │     AfNIA Data Ingestion Gateway       │
         │ (Globus Connect Server on AfNIA VM)    │
         └──────────┬─────────────────────────────┘
                    │
                    │ Transfers data fast & securely
                    ▼
         ┌────────────────────────────────────────┐
         │        AfNIA Storage (Cloud / VM)       │
         │   • Object storage (MinIO / S3 / COS)   │
         │   • Local volume for temporary staging  │
         └──────────┬─────────────────────────────┘
                    │
                    │  Metadata validation, anonymization
                    ▼
         ┌────────────────────────────────────────┐
         │       AfNIA Dataverse Repository        │
         │  • Stores dataset metadata & license    │
         │  • Assigns DOI for citation             │
         │  • Links to data in Globus storage      │
         └──────────┬─────────────────────────────┘
                    │
                    │  Publishes datasets + metadata
                    ▼
         ┌────────────────────────────────────────┐
         │          AfNIA Web Portal (React)       │
         │ "Explore Datasets" | "Contribute Data"  │
         │  • Shows dataset summary & DOI          │
         │  • Provides “Download via Globus” link  │
         └──────────┬─────────────────────────────┘
                    │
                    │  High-speed download
                    ▼
         ┌────────────────────────────────────────┐
         │       Scientists / Students / Public    │
         │  • Access datasets via AfNIA portal     │
         │  • Transfer data using Globus Connect   │
         │  • Verify metadata, cite DOI            │
         └────────────────────────────────────────┘
