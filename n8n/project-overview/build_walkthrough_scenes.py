"""Build captioned video scenes from actual n8n screenshots and final-run metadata.
This is a condensed screen walkthrough; the company-input panel is an illustrative
rendering of the real form fields, and execution time is compressed.
"""
from pathlib import Path
import json,textwrap
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];ASSETS=ROOT/'n8n/project-overview/assets';OUT=ROOT/'n8n/output/walkthrough-scenes';OUT.mkdir(exist_ok=True)
REPORT=json.loads((ROOT/'n8n/orchestrator/FINAL_E2E_TEST_RESULTS.json').read_text())
FONT='/System/Library/Fonts/Supplemental/Arial.ttf';BOLD='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
def font(size,bold=False):return ImageFont.truetype(BOLD if bold else FONT,size)
NAVY='#10263e';TEAL='#007f83';LIGHT='#edf4f6'
scenes=[
 ('Run the research project','A walkthrough of the published configuration using real n8n screens. Waiting time is compressed.','orchestrator-canvas.png'),
 ('1  Start your local services','Start n8n and Ollama. Confirm gemma4:12b and your SerpApi credentials are configured.',None),
 ('2  Open Research Orchestrator','At localhost:5678, open Research Orchestrator. Click Execute workflow, then open its company form.','orchestrator-canvas.png'),
 ('3  Enter the company','Enter the real company name, official website, sector and geography. Attach its annual report when available.',None),
 ('4  Choose leadership refresh','Enter yes in Refresh Leadership to run Agent 4 live. Leave it blank to reuse profiles saved within seven days.','agent4-canvas.png'),
 ('5  Let the agents finish','Agent 1 selects peers; Agents 2 and 3 research signals. Agent 4 researches leaders; the orchestrator compiles the deck.','execution-canvas.png'),
 ('6  Check completion and coverage',f"Run {REPORT['execution_id']} reached Download Briefing and saved memory. It selected {REPORT['selected_peers']} of five requested peers; read the gaps.",'execution-canvas.png'),
 ('7  Download and open the presentation','Open Download Briefing, choose Binary, then download presentation. Open the editable PPTX in PowerPoint.','download-panel.png'),
 ('8  Recall a previous run','Open Research Memory - Recall. Enter the company and optionally a run ID, then download saved research.','memory-canvas.png'),
 ('9  Find the handoff files','The GitHub presentations folder contains both PowerPoints, PDFs, this video and its caption file.',None)
]
for index,(title,caption,image) in enumerate(scenes,1):
 im=Image.new('RGB',(1280,720),'white');draw=ImageDraw.Draw(im)
 draw.rectangle((0,0,1280,100),fill=NAVY);draw.text((40,20),'MAVENS / WEEK 3 PROJECT',font=font(14,True),fill='#86d4d5');draw.text((40,48),title,font=font(30,True),fill='white')
 if image:
  path=ASSETS/image
  if not path.exists():path=ASSETS/'orchestrator-canvas.png'
  pic=Image.open(path).convert('RGB');pic.thumbnail((1190,420));im.paste(pic,((1280-pic.width)//2,115+(420-pic.height)//2))
 elif index==2:
  values=['1. Docker / n8n running at localhost:5678','2. Ollama running with gemma4:12b','3. Native SerpApi search nodes and credentials connected','4. Persistent Research Memory Data Table available']
  for i,line in enumerate(values):draw.text((65,150+i*84),line,font=font(28,i==0),fill=NAVY)
 elif index==4:
  draw.rounded_rectangle((55,125,1225,520),radius=16,fill=LIGHT);draw.text((80,145),'Example company form values',font=font(24,True),fill=TEAL)
  fields=[('Company Name','Target'),('Official Website','https://corporate.target.com'),('Industry Sector','Retail'),('Geography','United States'),('Annual Report','Attach the company annual-report PDF')]
  for i,(label,value) in enumerate(fields):draw.text((85,205+i*56),label,font=font(22,True),fill=NAVY);draw.text((430,205+i*56),value,font=font(22),fill=NAVY)
 else:
  draw.rounded_rectangle((55,130,1225,520),radius=16,fill=LIGHT)
  for i,line in enumerate(['github.com/amitgandre/Mavens-Week3-AmitG','presentations/Project-overview.pptx','presentations/Target-final-briefing.pptx','presentations/How-to-run-project.mp4']):draw.text((80,170+i*77),line,font=font(25,i==0),fill=TEAL if i==0 else NAVY)
 draw.rectangle((0,555,1280,720),fill=NAVY);draw.rectangle((40,580,47,666),fill='#00a6a6')
 for i,line in enumerate(textwrap.wrap(caption,width=87)):draw.text((65,580+i*35),line,font=font(25),fill='white')
 draw.text((1140,685),f'{index:02d} / {len(scenes):02d}',font=font(16,True),fill='#86d4d5')
 im.save(OUT/f'{index:02d}.png')

def stamp(seconds):return f'00:{seconds//60:02d}:{seconds%60:02d},000'
srt='\n\n'.join(f'{i+1}\n{stamp(i*6)} --> {stamp((i+1)*6)}\n{caption}' for i,(_,caption,_) in enumerate(scenes))+'\n'
(ROOT/'n8n/output/How-to-run-project.srt').write_text(srt)
print('Prepared 10 captioned scenes and SRT; total duration 60 seconds.')
