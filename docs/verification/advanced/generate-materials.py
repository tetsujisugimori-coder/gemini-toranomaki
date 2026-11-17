"""Regenerate original fictional HTML/PDF/CSV assets from exported recipe data.
Usage: python generate-materials.py material-json repository-root
No external data or network.
"""
import json,sys,html,csv
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
recipes=json.loads(Path(sys.argv[1]).read_text()); out=Path(sys.argv[2])/'public/advanced';out.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(UnicodeCIDFont('HeiseiKakuGo-W5'))
for r in recipes:
 for m in r['materials']:
  name=m.get('file','')
  if not name or name.endswith('.csv'):continue
  text=f"{m['id']} {m['title']}\n発行日：{m['date']}\n目的：{m['purpose']}\n教材用の架空資料。実在の製品・イベントではありません。\n{m['body']}"
  htmlname=name.replace('.pdf','.html')
  (out/htmlname).write_text('<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>'+html.escape(m['title'])+'</title><style>body{font:1.1rem/1.8 sans-serif;max-width:44rem;margin:2rem auto;padding:1rem;overflow-wrap:anywhere}pre{white-space:pre-wrap;font:inherit}</style><h1>'+html.escape(m['title'])+'</h1><pre>'+html.escape(text)+'</pre><a href="../#advanced-'+r['id']+'">教材へ戻る</a></html>')
  if name.endswith('.pdf'):
   c=canvas.Canvas(str(out/name),pagesize=(595,842),invariant=1);c.setTitle(m['title']);c.setFont('HeiseiKakuGo-W5',16);c.drawString(45,780,m['title']);c.setFont('HeiseiKakuGo-W5',11)
   y=740
   for line in text.splitlines():
    for start in range(0,len(line),42): c.drawString(45,y,line[start:start+42]);y-=25
   c.drawString(45,50,'教材原本 v1 / 1ページ');c.save()
with (out/'sales.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['id','date','sales_jpy'])
 for i,v in enumerate([1200,1800,-300,None,12000,2300]):w.writerow([f'T{i+1}','2026-11-01',v])
