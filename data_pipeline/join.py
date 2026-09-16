import pandas as pd

# name fixes for YOUR files (Title Case + spelling)
name_fixes = {
    "Merri-Bek": "Moreland",
    "Colac-Otway": "Colac Otway",
}

def fix_my_names(df):
    df['lga_name'] = (
        df['lga_name']
        .str.replace(" (VIC.)", "", regex=False)   # strip suffix (uppercase)
        .str.replace(" (Vic.)", "", regex=False)   # strip suffix (mixed case)
        .str.title()
        .replace(name_fixes)
    )
    return df

# read YOUR files and normalise names
schools  = fix_my_names(pd.read_csv("schools_by_lga.csv"))
crime    = fix_my_names(pd.read_csv("crime_by_lga.csv"))
bulk     = fix_my_names(pd.read_csv("bulk_billing_by_lga.csv"))
stations = fix_my_names(pd.read_csv("stations_by_lga.csv"))

# read TEAMMATE files
aff   = pd.read_csv("rental_affordability.csv")   # Andy
trend = pd.read_csv("rental_trend.csv")           # Andy
seifa = pd.read_csv("seifa-irsd-lga.csv")         # Ausking
seifa['lga_name'] = seifa['lga_name'].str.replace(" (Vic.)", "", regex=False)
seifa = seifa[~seifa['lga_name'].str.contains('Unincorporated', case=False, na=False)]  # drop it

# build master starting from SEIFA (the anchor: code + name)
master = seifa[['lga_code', 'lga_name']].copy()

# merge each factor on lga_name, taking only the value column
master = master.merge(aff[['lga_name','value']].rename(columns={'value':'affordability_pct'}), on='lga_name', how='left')
master = master.merge(trend[['lga_name','value']].rename(columns={'value':'affordability_trend'}), on='lga_name', how='left')
master = master.merge(seifa[['lga_name','value']].rename(columns={'value':'seifa_irsd'}), on='lga_name', how='left')
master = master.merge(schools[['lga_name','school_count']], on='lga_name', how='left')
master = master.merge(crime[['lga_name','offence_rate_per_100k']], on='lga_name', how='left')
master = master.merge(bulk[['lga_name','bulk_billing_rate']], on='lga_name', how='left')
master = master.merge(stations[['lga_name','station_count']], on='lga_name', how='left')

# CHECK for join gaps
print("Missing values per column:")
print(master.isnull().sum())
print()
print("Total LGAs:", len(master))

# save
master.to_csv("master_table.csv", index=False)
master.to_json("../master_data.json", orient="records", indent=2)
