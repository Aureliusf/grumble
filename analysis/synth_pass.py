import pandas as pd, numpy as np, sys
pd.set_option("display.width",250); pd.set_option("display.max_columns",30)
d=sys.argv[1]
p=pd.read_csv(f"{d}/synthetic_participants.csv"); c=pd.read_csv(f"{d}/synthetic_checkups_week0_week12.csv"); dy=pd.read_csv(f"{d}/synthetic_daily.csv"); m=pd.read_csv(f"{d}/synthetic_meals.csv")
print("groups:",p.group.value_counts().to_dict())
print("finished by group:",p.groupby("group").finished_program.apply(lambda s:(s=="yes").mean()).round(3).to_dict())
print("finished by food_bg:",p.groupby("food_background").finished_program.apply(lambda s:(s=="yes").mean()).round(2).sort_values().to_dict())
print("finished by work:",p.groupby("work_schedule").finished_program.apply(lambda s:(s=="yes").mean()).round(2).to_dict())
print("finished by dog:",p.groupby("has_dog").finished_program.apply(lambda s:(s=="yes").mean()).round(2).to_dict())
print("finished by lang:",p.groupby("preferred_language").finished_program.apply(lambda s:(s=="yes").mean()).round(2).to_dict())
# week0->12 change by group
w=c.pivot(index="participant_id",columns="visit")
chg=pd.DataFrame({k:(w[k]["week 12"]-w[k]["week 0"]) for k in ["weight_kg","hba1c_pct","fasting_glucose_mg_dl","triglycerides_mg_dl","crp_mg_l","fatigue_score_0_to_52","six_minute_walk_m","waist_cm"]}).dropna()
chg=chg.join(p.set_index("participant_id")[["group","blood_sugar_group","has_dog","work_schedule","food_background"]])
print("\n== mean change wk0->12 by group ==\n",chg.groupby("group").mean(numeric_only=True).round(2))
print("\n== hba1c change by group x baseline sugar ==\n",chg.groupby(["blood_sugar_group","group"]).hba1c_pct.mean().round(3).unstack())
# daily behaviors by group
dy=dy.merge(p[["participant_id","group","has_dog","work_schedule"]],on="participant_id")
print("\n== daily medians by group ==\n",dy.groupby("group")[["steps","walked_after_dinner_min","overnight_fast_hours","evening_calories_pct","healthy_eating_score_0_to_10","calories","fiber_g","alcohol_drinks","energy_1_to_5","hunger_1_to_5","sleep_minutes"]].mean().round(2))
print("\nsteps by dog:",dy.groupby("has_dog").steps.mean().round(0).to_dict())
print("steps by work:",dy.groupby("work_schedule").steps.mean().round(0).to_dict())
# per-person: after-dinner walk habit vs hba1c change (observational)
pp=dy.groupby("participant_id").agg(walk=("walked_after_dinner_min","mean"),steps=("steps","mean"),fast=("overnight_fast_hours","mean"),eve=("evening_calories_pct","mean"),hes=("healthy_eating_score_0_to_10","mean"),logdays=("food_logged",lambda s:(s=="yes").mean()))
chg2=chg.join(pp)
for k in ["walk","steps","fast","eve","hes","logdays"]:
    print(f"spearman {k} vs dHbA1c: {chg2[[k,'hba1c_pct']].corr(method='spearman').iloc[0,1]:.3f}   vs dWeight: {chg2[[k,'weight_kg']].corr(method='spearman').iloc[0,1]:.3f}")
# fast hours bands within coaching+fast group
cf=chg2[chg2.group=="coaching + overnight fast"]
cf["fb"]=pd.cut(cf.fast,[0,11,12,13,14,24])
print("\nwithin fast group, dHbA1c by achieved fast hrs:\n",cf.groupby("fb",observed=True).agg(n=("hba1c_pct","size"),dA1c=("hba1c_pct","mean"),dWt=("weight_kg","mean")).round(3))
# night shift
cf2=chg2.copy(); cf2["fb"]=pd.cut(cf2.fast,[0,11,12,13,14,24])
print("\nall, dHbA1c by fast hrs x night shift:\n",cf2.groupby(["work_schedule","fb"],observed=True).hba1c_pct.mean().round(3).unstack())
# weekday/weekend, holidays
print("\nsteps weekend vs weekday:",dy.groupby(dy.day_of_week.isin(["Saturday","Sunday"])).steps.mean().round(0).to_dict())
print("holiday kcal:",dy[dy.holiday.notna()].calories.mean().round(0)," normal:",dy[dy.holiday.isna()].calories.mean().round(0))
# energy/hunger checkins vs eating
print("\nenergy vs healthy score:",dy.groupby("energy_1_to_5").healthy_eating_score_0_to_10.mean().round(2).to_dict())
print("hunger vs evening pct:",dy.groupby("hunger_1_to_5").evening_calories_pct.mean().round(1).to_dict())
print("energy by week:",dy.groupby("week").energy_1_to_5.mean().round(2).to_dict())
# meals
print("\ntop cuisines:",m.cuisine.value_counts().head(12).to_dict())
print("meal types:",m.meal_type.value_counts().to_dict())
print("walked_after share by meal_type:",m.groupby("meal_type").walked_after_min.apply(lambda s:(s>0).mean()).round(2).to_dict())
