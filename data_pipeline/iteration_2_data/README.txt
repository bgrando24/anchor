This folder contains the input CSV files required by the Iteration 2 join process. These include the datasets used in Iteration 1 as well as the additional datasets incorporated during Iteration 2. The CSV files are kept together in this folder because join.py reads them to produce the final combined LGA dataset.

The join combines the input datasets into a single table containing one row for each Victorian LGA, with 79 LGAs in total.

Version history

master_data_v2.json – contains the datasets included in the Iteration 1 version of the application.

master_data_v3.json – adds the detailed school breakdown and green space data.

master_data_v4.json – adds sport variety and AEDC data and is the latest Iteration 2 JSON output.

Current outputs

master_data_v4.json – the main Iteration 2 dataset used by the application.

master_table_v4.csv – a tabular version of the joined data. Nested sport data included in the JSON is not represented in the same nested structure in the CSV.

The crime dataset remains part of the joined data, although crime information is not currently displayed in the application.

Running the join

The join is performed by join.py. The script reads the required CSV files from this folder, joins the datasets by LGA, and generates the latest output files.

Run the script from this folder using:

python join.py

The original raw datasets and cleaning scripts for datasets carried over from Iteration 1 remain in their respective Iteration 1 dataset folders. This folder contains the processed CSV files required specifically for the combined join process.