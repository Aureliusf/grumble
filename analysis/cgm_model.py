import pandas as pd, numpy as np, sys, json
pd.set_option("display.width",250); pd.set_option("display.max_columns",40)
d=sys.argv[1]
g=pd.read_csv(f"{d}/synthetic_glucose_every_15_min.csv",parse_dates=["timestamp"])
m=pd.read_csv(f"{d}/synthetic_meals.csv")
p=pd.read_csv(f"{d}/synthetic_participants.csv")
sens=set(g.participant_id.unique())
m=m[m.participant_id.isin(sens)&m.meal_type.isin(["breakfast","lunch","dinner","late snack","snack","meal at work"])].copy()
m["ts"]=pd.to_datetime(m.date+" "+m.time)
g=g.sort_values(["participant_id","timestamp"])
gi={pid:df.set_index("timestamp").glucose_mg_dl for pid,df in g.groupby("participant_id")}
rows=[]
for r in m.itertuples():
    s=gi.get(r.participant_id)
    if s is None: continue
    w=s[(s.index>=r.ts-pd.Timedelta("20min"))&(s.index<=r.ts+pd.Timedelta("180min"))]
    if len(w)<10: continue
    base=w[w.index<=r.ts]
    if len(base)==0: continue
    b=base.iloc[-1]
    post=w[w.index>r.ts]
    rel=((post.index-r.ts).total_seconds()/60).values
    vals=post.values-b
    peak=vals.max(); tpk=rel[vals.argmax()]
    def at(t):
        i=np.argmin(np.abs(rel-t)); return vals[i] if abs(rel[i]-t)<=10 else np.nan
    iauc=np.trapezoid(np.clip(vals[rel<=120],0,None),rel[rel<=120])
    rows.append(dict(pid=r.participant_id,meal_type=r.meal_type,hour=r.ts.hour+r.ts.minute/60,carbs=r.carbs_g,fiber=r.fiber_g,protein=r.protein_g,fat=r.fat_g,sugar=r.sugar_g,kcal=r.calories,walk=r.walked_after_min,base=b,peak=peak,tpk=tpk,g30=at(30),g60=at(60),g90=at(90),g120=at(120),g180=at(180),iauc=iauc))
R=pd.DataFrame(rows).merge(p[["participant_id","blood_sugar_group","work_schedule"]],left_on="pid",right_on="participant_id")
print("meals with CGM:",len(R)); print(R.meal_type.value_counts().to_dict())
R.to_csv("data/meal_responses.csv",index=False)
R["late"]=(R.hour>=20)|(R.hour<4)
R["walked"]=R.walk>0
print("\n== mean curve delta by sugar group (mg/dL) ==")
print(R.groupby("blood_sugar_group")[["base","g30","g60","g90","g120","g180","peak","tpk","iauc"]].mean().round(1))
print("\n== by carbs band ==")
R["cb"]=pd.cut(R.carbs,[0,30,60,90,120,400])
print(R.groupby("cb",observed=True)[["peak","g120","iauc"]].mean().round(1))
print("\n== late vs not, dinner only, by sugar group ==")
D=R[R.meal_type=="dinner"]
print(D.groupby(["blood_sugar_group","late"])[["carbs","peak","g120","iauc"]].mean().round(1))
print("\n== walk after dinner vs not ==")
print(D.groupby(["blood_sugar_group","walked"])[["carbs","peak","g60","g120","iauc"]].mean().round(1))
D2=D.copy(); D2["wb"]=pd.cut(D2.walk,[-1,0,10,20,60])
print(D2.groupby("wb",observed=True)[["carbs","peak","g120","iauc"]].mean().round(1))
# regression
import numpy.linalg as la
def ols(df,y,cols):
    X=np.column_stack([np.ones(len(df))]+[df[c].astype(float).values for c in cols]); Y=df[y].values
    beta,res,rk,sv=la.lstsq(X,Y,rcond=None); pred=X@beta; r2=1-((Y-pred)**2).sum()/((Y-Y.mean())**2).sum()
    return dict(zip(["intercept"]+cols,beta.round(3))),round(r2,3)
R["pre"]=(R.blood_sugar_group=="prediabetes").astype(int); R["t2d"]=(R.blood_sugar_group=="type 2 diabetes").astype(int)
R["late_i"]=R.late.astype(int); R["walk_min"]=R.walk.clip(0,30)
R["night"]=(R.work_schedule=="night shift").astype(int)
for y in ["peak","iauc","g120"]:
    b,r2=ols(R.dropna(subset=[y]),y,["carbs","fiber","protein","fat","late_i","walk_min","pre","t2d","base"])
    print(f"\nOLS {y}: r2={r2}\n",b)
# interaction: late only for non-night
Rn=R[R.night==0]
b,r2=ols(Rn.dropna(subset=["peak"]),"peak",["carbs","fiber","protein","late_i","walk_min","pre","t2d"]); print("\nnon-night peak:",r2,b)
# by hour of day bins (all meals) adjusted crude
R["hb"]=pd.cut(R.hour,[0,4,10,14,17,20,24],labels=["0-4","4-10","10-14","14-17","17-20","20-24"])
print("\npeak per 10g carbs by hour:",(R.groupby("hb",observed=True).apply(lambda x:(x.peak/x.carbs.clip(10)).mean()*10)).round(2).to_dict())
# normalized curve shape
shape=R[["g30","g60","g90","g120","g180"]].div(R.peak.replace(0,np.nan),axis=0).mean().round(3)
print("\nmean shape (fraction of peak):",shape.to_dict())
print("mean tpk by group:",R.groupby("blood_sugar_group").tpk.mean().round(0).to_dict())
json.dump({"n_meals":int(len(R)),"shape_fraction_of_peak":{k:float(v) for k,v in shape.items()},"by_group":R.groupby("blood_sugar_group")[["base","peak","tpk","g120","iauc"]].mean().round(1).to_dict(orient="index")},open("data/cgm_summary.json","w"),indent=2)
