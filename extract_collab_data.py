import pandas as pd
import json
import math
import sys
import os
import datetime

def clean_value(val):
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    if isinstance(val, (pd.Timestamp, datetime.datetime, datetime.date)):
        return str(val)
    return val

excel_file = "Collaboration New.xlsx" if os.path.exists("Collaboration New.xlsx") else "Collaboration.xlsx"

try:
    print(f"Reading {excel_file}...")
    xl = pd.ExcelFile(excel_file)
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

