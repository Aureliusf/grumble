import pandas as pd, numpy as np, json, sys
d=sys.argv[1]
m=pd.read_csv(f"{d}/synthetic_meals.csv"); p=pd.read_csv(f"{d}/synthetic_participants.csv"); c=pd.read_csv(f"{d}/synthetic_checkups_week0_week12.csv"); dy=pd.read_csv(f"{d}/synthetic_daily.csv")
# dishes
agg=m.groupby(["food","cuisine"]).agg(n=("calories","size"),calories=("calories","median"),carbs_g=("carbs_g","median"),protein_g=("protein_g","median"),fat_g=("fat_g","median"),fiber_g=("fiber_g","median"),sugar_g=("sugar_g","median"),mediterranean_style=("mediterranean_style",lambda s:(s=="yes").mean()>0.5)).reset_index()
mt=m.groupby("food").meal_type.agg(lambda s:s.value_counts().index[0]).rename("typical_meal_type")
agg=agg.merge(mt,on="food").sort_values(["cuisine","n"],ascending=[True,False])
def slug(s): return "".join(ch if ch.isalnum() else "-" for ch in s.lower()).strip("-").replace("--","-")
dishes=[]
for r in agg.itertuples():
    dishes.append({"id":slug(r.food),"name":r.food,"cuisine":r.cuisine,"typical_meal_type":r.typical_meal_type,"logged_count":int(r.n),"calories":float(r.calories),"carbs_g":float(r.carbs_g),"protein_g":float(r.protein_g),"fat_g":float(r.fat_g),"fiber_g":float(r.fiber_g),"sugar_g":float(r.sugar_g),"mediterranean_style":bool(r.mediterranean_style),"grumble_move":None})
json.dump({"source":"synthetic_meals.csv medians per dish; made-up program data","count":len(dishes),"dishes":dishes},open("specs/data/dishes.json","w"),indent=1,ensure_ascii=False)
print("dishes:",len(dishes))
# personas: pick real synthetic participants
def pick(q):
    s=p.query(q)
    s=s.sort_values("wore_glucose_sensor",ascending=False)
    return s
cands={
 "marisol":"participant_id=='N0771'",
 "jean":"sex=='male' and food_background=='Haitian' and work_schedule=='night shift'",
 "dani":"food_background=='Colombian or Venezuelan' and work_schedule=='works from home' and age<45",
 "tony":"sex=='male' and food_background=='Southern US' and race_ethnicity=='Black' and work_schedule=='retired' and cancer_type=='prostate' and blood_sugar_group=='normal'",
}
out={}
for k,q in cands.items():
    s=pick(q); print(k,len(s)); 
    if len(s)==0: s=pick(q.rsplit(" and ",1)[0]); print(" relaxed",len(s))
    r=s.iloc[0]
    pid=r.participant_id
    ck=c[c.participant_id==pid].to_dict(orient="records")
    days=dy[dy.participant_id==pid]
    meals=m[m.participant_id==pid]
    out[k]={"participant_id":pid,"profile":{kk:(None if pd.isna(v) else (v.item() if hasattr(v,"item") else v)) for kk,v in r.to_dict().items()},
      "checkups":[{kk:(None if pd.isna(v) else (v.item() if hasattr(v,"item") else v)) for kk,v in x.items()} for x in ck],
      "daily_summary":{"days":int(len(days)),"steps_mean":round(float(days.steps.mean()),0),"walked_after_dinner_days_pct":round(float((days.walked_after_dinner_min>0).mean()),2),"overnight_fast_mean":round(float(days.overnight_fast_hours.mean()),1),"evening_calories_pct_mean":round(float(days.evening_calories_pct.mean()),1),"last_ate_mode":days.last_ate.mode().iloc[0] if days.last_ate.notna().any() else None,"healthy_eating_score_mean":round(float(days.healthy_eating_score_0_to_10.mean()),1),"energy_mean":round(float(days.energy_1_to_5.mean()),1)},
      "top_dishes":meals.food.value_counts().head(8).to_dict()}
json.dump(out,open("specs/data/personas.json","w"),indent=1,ensure_ascii=False,default=str)
for k,v in out.items(): print(k,v["participant_id"],v["profile"]["age"],v["profile"]["blood_sugar_group"],v["profile"]["wore_glucose_sensor"],v["daily_summary"]["last_ate_mode"],list(v["top_dishes"])[:4])
