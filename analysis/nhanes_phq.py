import pandas as pd, sys
pd.set_option("display.width",250); pd.set_option("display.max_columns",30)
us = pd.read_csv(sys.argv[1], low_memory=False)
surv = us[us.cancer_survivor=="yes"].copy()
surv["phq_band"]=pd.cut(surv.phq9_depression_score_0_to_27,[-1,4,9,14,27],labels=["0-4 none","5-9 mild","10-14 mod","15+ severe"])
t=surv.groupby("phq_band",observed=True).agg(n=("person_id","size"),hba1c=("hba1c_pct","median"),fast_glu=("fasting_glucose_mg_dl","median"),bmi=("bmi","median"),waist=("waist_cm","median"),mims=("movement_per_day_mims","median"),fast_hrs=("overnight_fast_hours_avg","median"),last_eat=("last_eating_hour_avg","median"),eve_pct=("evening_calories_pct_day1","median"),occasions=("eating_occasions_day1","median"),kcal=("calories_per_day","median"),fiber=("fiber_g","median"),sugar=("sugar_g","median"),poor_fair=("self_rated_health",lambda s:(s.isin(["poor","fair"])).mean()),sleep=("sleep_hours_self_report","median"),income=("income_to_poverty_ratio","median"),dm=("diabetes_diagnosed",lambda s:(s=="yes").mean()),died=("died_by_end_of_2019",lambda s:(s=="yes").mean()),age=("age","median")).round(2)
print(t.T)
# same for non-survivors for contrast
ns = us[us.cancer_survivor!="yes"].copy()
ns["phq_band"]=pd.cut(ns.phq9_depression_score_0_to_27,[-1,4,9,14,27],labels=["0-4 none","5-9 mild","10-14 mod","15+ severe"])
print("\nnon-survivors hba1c by phq:", ns.groupby("phq_band",observed=True).hba1c_pct.median().round(2).to_dict())
# eating alone proxy? no. Household? no. Check eating occasions & calories by phq
# Hispanic survivors in NHANES
h = surv[surv.race_ethnicity.isin(["Other Hispanic","Mexican American"])]
print("\nHispanic survivors n=%d hba1c med %.2f, phq>=10 %.2f, income %.2f, mims %.0f" % (len(h), h.hba1c_pct.median(), (h.phq9_depression_score_0_to_27>=10).mean(), h.income_to_poverty_ratio.median(), h.movement_per_day_mims.median()))
