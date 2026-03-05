import pandas as pd
import json
import math
import sys

def clean_value(val):
    if isinstance(val, float) and math.isnan(val):
        return None
    return val

try:
    xl = pd.ExcelFile("Collaboration.xlsx")
    res = {}
    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name)
        df = df.dropna(axis=1, how='all')
        df = df.where(pd.notnull(df), None)
        res[sheet_name] = [
            {str(k): clean_value(v) for k, v in row.items()}
            for row in df.to_dict('records')
        ]
        print(f"Sheet '{sheet_name}' -> {len(res[sheet_name])} rows")
        if not df.empty:
            print(f"  Columns: {list(df.columns)}")
    with open("collaboration.json", "w") as f:
        json.dump(res, f, indent=2)
    print("Successfully wrote collaboration.json")
except Exception as e:
    print(f"Error parsing Excel: {e}")
    sys.exit(1)
