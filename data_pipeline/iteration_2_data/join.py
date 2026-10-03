import pandas as pd

# name normalisation
name_fixes = {
    "Merri-Bek": "Moreland",
    "Colac-Otway": "Colac Otway",
}

def fix_names(df):
    df['lga_name'] = (
        df['lga_name']
        .str.replace(" (VIC.)", "", regex=False)
        .str.replace(" (Vic.)", "", regex=False)
        .str.title()
        .replace(name_fixes)
    )
    return df


# read teammate files
aff    = pd.read_csv("rental_affordability.csv")
trend  = pd.read_csv("rental_trend.csv")
median = pd.read_csv("median_rent_by_lga.csv")

seifa = pd.read_csv("seifa-irsd-lga.csv")
seifa['lga_name'] = seifa['lga_name'].str.replace(" (Vic.)", "", regex=False)
seifa = seifa[~seifa['lga_name'].str.contains('Unincorporated', case=False, na=False)]

# read my files
crime         = fix_names(pd.read_csv("crime_by_lga.csv"))
bulk          = fix_names(pd.read_csv("bulk_billing_by_lga.csv"))
stations      = fix_names(pd.read_csv("stations_by_lga.csv"))
schools_total = fix_names(pd.read_csv("schools_by_lga.csv"))
schools_det   = fix_names(pd.read_csv("schools_by_lga_detailed.csv"))
parks         = fix_names(pd.read_csv("parks_by_lga.csv"))

# AEDC
aedc = pd.read_csv("aedc-one-or-more-vic-by-lga.csv")
aedc['lga_name'] = aedc['lga_name'].str.replace(" (Vic.)", "", regex=False)
aedc = aedc[~aedc['lga_name'].str.contains('Unincorporated', case=False, na=False)]
aedc = aedc.drop(columns=['lga_code'])
aedc = aedc.set_index('lga_name').add_prefix('aedc_').reset_index()

# sport variety
sport_variety = pd.read_csv("sports_variety_by_lga.csv")
sport_variety = sport_variety[['lga_name', 'value']].rename(columns={'value': 'sport_variety'})

# sport detail
sports_played = pd.read_csv("sports_played_by_lga.csv")
sports_dict = (
    sports_played.groupby('lga_name')
    .apply(lambda x: dict(zip(x['sport'], x['facility_count'])), include_groups=False)
    .to_dict()
)

# build master
master = seifa[['lga_code', 'lga_name']].copy()

# mismatch check
master_names = set(master['lga_name'])
files = {
    "affordability": aff, "trend": trend, "median": median,
    "crime": crime, "bulk": bulk, "stations": stations,
    "schools_total": schools_total, "schools_detailed": schools_det,
    "parks": parks, "aedc": aedc, "sport_variety": sport_variety,
}

for nm, d in files.items():
    miss = set(d['lga_name']) - master_names
    print(f"{nm}: NOT matching ->", miss if miss else "all match")

print()

# merge everything
school_cols = [
    'primary_Government','primary_Catholic','primary_Independent',
    'secondary_Government','secondary_Catholic','secondary_Independent'
]

master = master.merge(aff[['lga_name','value']].rename(columns={'value':'affordability_pct'}), on='lga_name', how='left')
master = master.merge(trend[['lga_name','value']].rename(columns={'value':'affordability_trend'}), on='lga_name', how='left')
master = master.merge(seifa[['lga_name','value']].rename(columns={'value':'seifa_irsd'}), on='lga_name', how='left')
master = master.merge(schools_total[['lga_name','school_count']], on='lga_name', how='left')
master = master.merge(schools_det[['lga_name'] + school_cols], on='lga_name', how='left')
master = master.merge(crime[['lga_name','offence_rate_per_100k']], on='lga_name', how='left')
master = master.merge(bulk[['lga_name','bulk_billing_rate']], on='lga_name', how='left')
master = master.merge(stations[['lga_name','station_count']], on='lga_name', how='left')
master = master.merge(median[['lga_name','flat_1br_median','flat_2br_median','house_2br_median','house_3br_median']], on='lga_name', how='left')
master = master.merge(parks[['lga_name','green_space_pct']], on='lga_name', how='left')
master = master.merge(aedc, on='lga_name', how='left')
master = master.merge(sport_variety, on='lga_name', how='left')

master['sports'] = master['lga_name'].map(sports_dict)

# fill existing gaps only
for c in school_cols + ['school_count','station_count']:
    master[c] = master[c].fillna(0).astype(int)

master['green_space_pct'] = master['green_space_pct'].fillna(0)

# checks
print("Missing per column:")
print(master.isnull().sum())
print("Total LGAs:", len(master))

casey = master[master['lga_name'] == 'Casey'].iloc[0]
print("Casey sport variety:", casey['sport_variety'])
print("Casey AEDC:", casey['aedc_vulnerable_pct_2024'])
print("Casey sports entries:", len(casey['sports']))

# save v4
master.drop(columns=['sports']).to_csv("master_table_v4.csv", index=False)
master.to_json("master_data_v4.json", orient="records", indent=2)