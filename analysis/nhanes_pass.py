import pandas as pd, numpy as np, sys
us = pd.read_csv(sys.argv[1], low_memory=False)
print(us.shape); print(list(us.columns))
print("\n== survivors vs not (median) ==")
cols=["age","hba1c_pct","fasting_glucose_mg_dl","bmi","overnight_fast_hours_avg","last_eating_hour_avg","evening_calories_pct_day1","movement_per_day_mims","phq9_depression_score_0_to_27","income_to_poverty_ratio","fiber_g","protein_g","sleep_hours_self_report"]
print(us.groupby("cancer_survivor")[cols].median().T)
surv = us[us.cancer_survivor=="yes"].copy()
print("\nN survivors:", len(surv), " diabetes dx:", surv.diabetes_diagnosed.value_counts().to_dict())
print("PHQ9>=10 share survivors: %.3f  vs non: %.3f" % ((surv.phq9_depression_score_0_to_27>=10).mean(), (us[us.cancer_survivor!="yes"].phq9_depression_score_0_to_27>=10).mean()))
# depression bands vs glucose & behaviors, survivors
surv["phq_band"]=pd.cut(surv.phq9_depression_score_0_to_27,[-1,4,9,14,27],labels=["0-4 none","5-9 mild","10-14 mod","15+ severe"])
print("\n== survivors by PHQ-9 band ==")
print(surv.groupby("phq_band",observed=True).agg(n=("person_id","size"),hba1c=("hba1c_pct","median"),fast_glu=("fasting_glucose_mg_dl","median"),bmi=("bmi","median"),mims=("movement_per_day_mims","median"),fast_hrs=("overnight_fast_hours_avg","median"),last_eat=("last_eating_hour_avg","median"),eve_pct=("evening_calories_pct_day1","median"),kcal=("calories_per_day","median"),fiber=("fiber_g","median"),selfhealth_poor=("self_rated_health",lambda s:(s.isin(["poor","fair"])).mean()),sleep=("sleep_hours_self_report","median"),income=("income_to_poverty_ratio","median")).round(2))
# income bands
surv["inc_band"]=pd.cut(surv.income_to_poverty_ratio,[0,1,2,3.5,5.1],labels=["<1x pov","1-2x","2-3.5x","3.5-5x"])
print("\n== survivors by income band ==")
print(surv.groupby("inc_band",observed=True).agg(n=("person_id","size"),hba1c=("hba1c_pct","median"),phq9=("phq9_depression_score_0_to_27","median"),mims=("movement_per_day_mims","median"),fast_hrs=("overnight_fast_hours_avg","median"),fiber=("fiber_g","median"),dm=("diabetes_diagnosed",lambda s:(s=="yes").mean())).round(2))
# fast hours bands
surv["fast_band"]=pd.cut(surv.overnight_fast_hours_avg,[0,10,12,13,14,24],labels=["<10","10-12","12-13","13-14","14+"])
print("\n== survivors by overnight fast ==")
print(surv.groupby("fast_band",observed=True).agg(n=("person_id","size"),hba1c=("hba1c_pct","median"),fast_glu=("fasting_glucose_mg_dl","median"),bmi=("bmi","median"),phq9=("phq9_depression_score_0_to_27","median"),mims=("movement_per_day_mims","median"),died=("died_by_end_of_2019",lambda s:(s=="yes").mean())).round(2))
# movement bands
surv["mv_band"]=pd.qcut(surv.movement_per_day_mims,4,labels=["Q1 least","Q2","Q3","Q4 most"])
print("\n== survivors by movement quartile ==")
print(surv.groupby("mv_band",observed=True).agg(n=("person_id","size"),mims=("movement_per_day_mims","median"),hba1c=("hba1c_pct","median"),phq9=("phq9_depression_score_0_to_27","median"),age=("age","median"),died=("died_by_end_of_2019",lambda s:(s=="yes").mean())).round(2))
# evening calories
surv["eve_band"]=pd.cut(surv[["evening_calories_pct_day1","evening_calories_pct_day2"]].mean(axis=1),[-0.01,0,10,25,100],labels=["0%","1-10%","10-25%","25%+"])
print("\n== survivors by evening calories share ==")
print(surv.groupby("eve_band",observed=True).agg(n=("person_id","size"),hba1c=("hba1c_pct","median"),bmi=("bmi","median"),phq9=("phq9_depression_score_0_to_27","median")).round(2))
# correlations survivors
print("\n== spearman w/ hba1c (survivors) ==")
print(surv[["hba1c_pct","phq9_depression_score_0_to_27","income_to_poverty_ratio","movement_per_day_mims","overnight_fast_hours_avg","last_eating_hour_avg","bmi","fiber_g","sleep_hours_self_report","eating_occasions_day1"]].corr(method="spearman")["hba1c_pct"].round(3))
print("\nrace/eth survivors:", surv.race_ethnicity.value_counts().to_dict())
print("self rated health vals:", us.self_rated_health.unique()[:10])
